import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import { logger } from '../utils/logger.js';

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

        // Create booking
        const booking = new Booking({
            event: eventId,
            user: req.user._id,
            numberOfTickets,
            totalAmount,
            paymentIntentId: 'temp_id' // This will be updated after Stripe integration
        });

        await booking.save();

        // Update available tickets
        event.availableTickets -= numberOfTickets;
        await event.save();

        logger.success(`Booking created for event: ${event.title}`);
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        logger.error(`Error creating booking: ${error.message}`);
        res.status(400).json({
            success: false,
            message: error.message
        });
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

        // Update booking status
        booking.status = 'cancelled';
        await booking.save();

        // Return tickets to event
        const event = await Event.findById(booking.event);
        event.availableTickets += booking.numberOfTickets;
        await event.save();

        logger.success(`Booking cancelled: ${booking._id}`);
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