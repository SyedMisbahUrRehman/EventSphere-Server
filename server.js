import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => logger.success(`Server running on port ${PORT}`));
}

export default app;
