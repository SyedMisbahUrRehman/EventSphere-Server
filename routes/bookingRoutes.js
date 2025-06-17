import express from 'express';
import {
    createBooking,
    getUserBookings,
    getBooking,
    cancelBooking
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes require authentication
router.use(protect);

router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);

export default router; 