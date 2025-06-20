import express from 'express';
import stripe from '../config/stripe.js';

const router = express.Router();

/**
 * @swagger
 * /api/stripe/test:
 *   get:
 *     summary: Test Stripe connection
 *     tags: [Stripe]
 *     responses:
 *       200:
 *         description: Stripe connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 account:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     business_type:
 *                       type: string
 *                     charges_enabled:
 *                       type: boolean
 *       500:
 *         description: Stripe connection failed
 */
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

/**
 * @swagger
 * /api/stripe/create-payment-intent:
 *   post:
 *     summary: Create a payment intent for a booking
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - bookingId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in dollars (will be converted to cents)
 *               currency:
 *                 type: string
 *                 default: usd
 *                 description: Currency code
 *               bookingId:
 *                 type: string
 *                 description: ID of the booking
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 clientSecret:
 *                   type: string
 *                 paymentIntentId:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create payment intent
 */
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

/**
 * @swagger
 * /api/stripe/cancel-payment-intent/{paymentIntentId}:
 *   post:
 *     summary: Cancel a payment intent
 *     tags: [Stripe]
 *     parameters:
 *       - in: path
 *         name: paymentIntentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment intent ID to cancel
 *     responses:
 *       200:
 *         description: Payment intent cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 paymentIntent:
 *                   type: object
 *       500:
 *         description: Failed to cancel payment intent
 */
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

/**
 * @swagger
 * /api/stripe/refund-payment:
 *   post:
 *     summary: Refund a payment
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 description: Payment intent ID to refund
 *               amount:
 *                 type: number
 *                 description: Amount to refund in dollars (optional, defaults to full amount)
 *               reason:
 *                 type: string
 *                 enum: [requested_by_customer, duplicate, fraudulent]
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 refund:
 *                   type: object
 *       400:
 *         description: Missing payment intent ID
 *       500:
 *         description: Failed to process refund
 */
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