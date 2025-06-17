import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Booking from '../models/Booking.js';
import app from '../server.js';

let authToken;
let testUser;
let testEvent;
let testBooking;

// Create test user, event, and booking
beforeEach(async () => {
    // Create test user with unique email
    testUser = await User.create({
        name: 'Test User',
        email: `test${Date.now()}_${Math.random().toString(36).substring(2, 8)}@example.com`,
        password: 'password123'
    });

    // Generate auth token with _id
    authToken = jwt.sign(
        { _id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Create test event
    testEvent = await Event.create({
        title: 'Test Event',
        description: 'Test Description',
        date: new Date(),
        category: 'workshop',
        price: 50,
        availableTickets: 100,
        location: 'Test Location',
        organizer: testUser._id,
        status: 'published'
    });

    // Create test booking
    testBooking = await Booking.create({
        event: testEvent._id,
        user: testUser._id,
        numberOfTickets: 2,
        totalAmount: 100,
        paymentIntentId: 'test_payment_intent',
        paymentStatus: 'completed',
        status: 'active'
    });
});

describe('Booking Endpoints', () => {
    describe('POST /api/bookings', () => {
        it('should create a new booking', async () => {
            const bookingData = {
                eventId: testEvent._id,
                numberOfTickets: 3
            };

            const res = await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookingData)
                .expect(201);

            expect(res.body.numberOfTickets).toBe(3);
            expect(res.body.totalAmount).toBe(150); // 3 tickets * $50
            expect(res.body.status).toBe('active');

            // Verify event tickets are updated
            const updatedEvent = await Event.findById(testEvent._id);
            expect(updatedEvent.availableTickets).toBe(97); // 100 - 3
        });

        it('should not create booking without auth token', async () => {
            const bookingData = {
                eventId: testEvent._id,
                numberOfTickets: 1
            };

            await request(app)
                .post('/api/bookings')
                .send(bookingData)
                .expect(401);
        });

        it('should not create booking if not enough tickets available', async () => {
            const bookingData = {
                eventId: testEvent._id,
                numberOfTickets: 101 // More than available
            };

            await request(app)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookingData)
                .expect(400);
        });
    });

    describe('GET /api/bookings/my-bookings', () => {
        it('should get user bookings', async () => {
            const res = await request(app)
                .get('/api/bookings/my-bookings')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0].numberOfTickets).toBe(2);
        });

        it('should not get bookings without auth token', async () => {
            await request(app)
                .get('/api/bookings/my-bookings')
                .expect(401);
        });
    });

    describe('GET /api/bookings/:id', () => {
        it('should get a single booking', async () => {
            const res = await request(app)
                .get(`/api/bookings/${testBooking._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.numberOfTickets).toBe(2);
            expect(res.body.totalAmount).toBe(100);
        });

        it('should not get booking without auth token', async () => {
            await request(app)
                .get(`/api/bookings/${testBooking._id}`)
                .expect(401);
        });

        it('should return 404 for non-existent booking', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/bookings/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PUT /api/bookings/:id/cancel', () => {
        it('should cancel a booking', async () => {
            const res = await request(app)
                .put(`/api/bookings/${testBooking._id}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(res.body.message).toBe('Booking cancelled successfully');

            // Verify booking is cancelled
            const cancelledBooking = await Booking.findById(testBooking._id);
            expect(cancelledBooking.status).toBe('cancelled');

            // Verify tickets are returned to event
            const updatedEvent = await Event.findById(testEvent._id);
            expect(updatedEvent.availableTickets).toBe(102); // 100 + 2 returned tickets
        });

        it('should not cancel booking without auth token', async () => {
            await request(app)
                .put(`/api/bookings/${testBooking._id}/cancel`)
                .expect(401);
        });

        it('should not cancel already cancelled booking', async () => {
            // First cancel the booking
            await Booking.findByIdAndUpdate(testBooking._id, { status: 'cancelled' });

            // Try to cancel again
            await request(app)
                .put(`/api/bookings/${testBooking._id}/cancel`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });
}); 