import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import app from '../server.js';

let authToken;
let testUser;
let testEvent;

// Create test user and get auth token
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
});

describe('Event Endpoints', () => {
    describe('GET /api/events', () => {
        it('should get all published events', async () => {
            const res = await request(app)
                .get('/api/events')
                .expect(200);

            expect(res.body.events).toBeInstanceOf(Array);
            expect(res.body.events.length).toBeGreaterThan(0);
            expect(res.body.events[0].title).toBe('Test Event');
        });

        it('should filter events by category', async () => {
            const res = await request(app)
                .get('/api/events?category=workshop')
                .expect(200);

            expect(res.body.events).toBeInstanceOf(Array);
            expect(res.body.events[0].category).toBe('workshop');
        });
    });

    describe('GET /api/events/:id', () => {
        it('should get a single event', async () => {
            const res = await request(app)
                .get(`/api/events/${testEvent._id}`)
                .expect(200);

            expect(res.body.title).toBe('Test Event');
            expect(res.body.description).toBe('Test Description');
        });

        it('should return 404 for non-existent event', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await request(app)
                .get(`/api/events/${fakeId}`)
                .expect(404);
        });
    });

    describe('POST /api/events', () => {
        it('should create a new event', async () => {
            const newEvent = {
                title: 'New Event',
                description: 'New Description',
                date: new Date(),
                category: 'concert',
                price: 75,
                availableTickets: 50,
                location: 'New Location'
            };

            const res = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(newEvent)
                .expect(201);

            expect(res.body.title).toBe('New Event');
            expect(res.body.organizer.toString()).toBe(testUser._id.toString());
        });

        it('should not create event without auth token', async () => {
            const newEvent = {
                title: 'New Event',
                description: 'New Description'
            };

            await request(app)
                .post('/api/events')
                .send(newEvent)
                .expect(401);
        });
    });

    describe('PUT /api/events/:id', () => {
        it('should update an event', async () => {
            const updates = {
                title: 'Updated Event',
                price: 100
            };

            const res = await request(app)
                .put(`/api/events/${testEvent._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updates)
                .expect(200);

            expect(res.body.title).toBe('Updated Event');
            expect(res.body.price).toBe(100);
        });

        it('should not update event without auth token', async () => {
            const updates = {
                title: 'Updated Event'
            };

            await request(app)
                .put(`/api/events/${testEvent._id}`)
                .send(updates)
                .expect(401);
        });
    });

    describe('DELETE /api/events/:id', () => {
        it('should delete an event', async () => {
            await request(app)
                .delete(`/api/events/${testEvent._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Verify event is deleted
            const deletedEvent = await Event.findById(testEvent._id);
            expect(deletedEvent).toBeNull();
        });

        it('should not delete event without auth token', async () => {
            await request(app)
                .delete(`/api/events/${testEvent._id}`)
                .expect(401);
        });
    });
}); 