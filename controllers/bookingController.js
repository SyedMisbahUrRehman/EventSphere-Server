import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import { logger } from '../utils/logger.js';
import stripe from '../config/stripe.js';
import dotenv from 'dotenv';

dotenv.config();
// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const { eventId, numberOfTickets } = req.body;

        // Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if enough tickets are available
        if (event.availableTickets < numberOfTickets) {
            return res.status(400).json({
                success: false,
                message: 'Not enough tickets available'
            });
        }

        // Calculate total amount
        const totalAmount = event.price * numberOfTickets;

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100, // Convert to cents
            currency: 'usd',
            metadata: {
                eventId: event._id.toString(),
                userId: req.user._id.toString(),
                numberOfTickets: numberOfTickets
            }
        });

        // Create booking with pending status
        const booking = new Booking({
            event: eventId,
            user: req.user._id,
            numberOfTickets,
            totalAmount,
            paymentIntentId: paymentIntent.id,
            paymentStatus: 'pending',
            status: 'active'
        });

        await booking.save();

        // Update event tickets
        event.availableTickets -= numberOfTickets;
        await event.save();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                ...booking.toObject(),
                clientSecret: paymentIntent.client_secret
            }
        });
    } catch (error) {
        logger.error(`Error creating booking: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: `Webhook Error: ${err.message}`
        });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailure(event.data.object);
            break;
        default:
            logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
};

// Helper function to handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
    try {
        const { eventId, userId, numberOfTickets } = paymentIntent.metadata;

        // Update booking status
        const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
        if (booking) {
            booking.paymentStatus = 'completed';
            booking.status = 'active';
            await booking.save();

            // Update event tickets
            const event = await Event.findById(eventId);
            if (event) {
                event.availableTickets -= numberOfTickets;
                await event.save();
            }

            logger.success(`Payment successful for booking: ${booking._id}`);
        }
    } catch (error) {
        logger.error(`Error handling payment success: ${error.message}`);
    }
};

// Helper function to handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
    try {
        const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
        if (booking) {
            booking.paymentStatus = 'failed';
            booking.status = 'cancelled';
            await booking.save();
            logger.error(`Payment failed for booking: ${booking._id}`);
        }
    } catch (error) {
        logger.error(`Error handling payment failure: ${error.message}`);
    }
};

// Get user's bookings
export const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'event',
                select: 'title date location imageUrl'
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookings
        });
    } catch (error) {
        logger.error(`Error fetching user bookings: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single booking
export const getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'event',
                select: 'title date location imageUrl'
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns the booking
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.json({
            success: true,
            message: 'Booking retrieved successfully',
            data: booking
        });
    } catch (error) {
        logger.error(`Error fetching booking: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns the booking
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // If payment was completed, process refund
        if (booking.paymentStatus === 'completed') {
            try {
                // Skip refund for test payment intent
                if (booking.paymentIntentId !== 'test_payment_intent') {
                    const refund = await stripe.refunds.create({
                        payment_intent: booking.paymentIntentId
                    });
                    booking.refundId = refund.id;
                }
            } catch (refundError) {
                logger.error(`Error processing refund: ${refundError.message}`);
                // Don't return error for test payment intent
                if (booking.paymentIntentId !== 'test_payment_intent') {
                    return res.status(400).json({
                        success: false,
                        message: 'Error processing refund'
                    });
                }
            }
        }

        // Update booking status
        booking.status = 'cancelled';
        await booking.save();

        // Return tickets to event
        const event = await Event.findById(booking.event);
        if (event) {
            event.availableTickets += booking.numberOfTickets;
            await event.save();
        }

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        logger.error(`Error cancelling booking: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 