import express from 'express';
import stripe from '../config/stripe.js';

const router = express.Router();

// Test endpoint to verify Stripe connection
router.get('/test', async (req, res) => {
    try {
        // Test the connection by retrieving account information
        const account = await stripe.account.retrieve();
        res.json({
            success: true,
            message: 'Stripe connection successful',
            account: {
                id: account.id,
                business_type: account.business_type,
                charges_enabled: account.charges_enabled
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Stripe connection failed',
            error: error.message
        });
    }
});

// Create a payment intent for a booking
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd', bookingId } = req.body;

        if (!amount || !bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Amount and bookingId are required'
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                bookingId
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create payment intent',
            error: error.message
        });
    }
});

// Cancel a payment intent
router.post('/cancel-payment-intent/:paymentIntentId', async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        res.json({
            success: true,
            message: 'Payment intent cancelled successfully',
            paymentIntent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to cancel payment intent',
            error: error.message
        });
    }
});

// Refund a payment
router.post('/refund-payment', async (req, res) => {
    try {
        const { paymentIntentId, amount, reason } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment intent ID is required'
            });
        }

        const refundParams = {
            payment_intent: paymentIntentId,
        };

        if (amount) {
            refundParams.amount = Math.round(amount * 100); // Convert to cents
        }

        if (reason) {
            refundParams.reason = reason; // Can be 'requested_by_customer', 'duplicate', or 'fraudulent'
        }

        const refund = await stripe.refunds.create(refundParams);

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to process refund',
            error: error.message
        });
    }
});

export default router; 