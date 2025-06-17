import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import swaggerSetup from './swagger.js';

dotenv.config();
connectDB();

const app = express();

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5050', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use((req, res, next) => {
    if (req.originalUrl === '/api/bookings/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stripe', stripeRoutes);

// Swagger documentation
swaggerSetup(app);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
}

export default app;
