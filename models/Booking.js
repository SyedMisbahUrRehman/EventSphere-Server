import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    numberOfTickets: {
        type: Number,
        required: [true, 'Number of tickets is required'],
        min: [1, 'Must book at least 1 ticket']
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Add compound index for better query performance
bookingSchema.index({ event: 1, user: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking; 