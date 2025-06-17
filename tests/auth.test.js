
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoutes.js';
import errorHandler from '../middleware/errorHandler.js';
import User from '../models/User.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Auth Routes', () => {
  const testUser = { email: 'test@example.com', password: '123456' };

  it('should register a user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('User registered successfully');
  });

  it('should login a user', async () => {
    const res = await request(app).post('/api/auth/login').send(testUser);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
