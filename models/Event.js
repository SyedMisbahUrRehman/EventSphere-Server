import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Event description is required']
    },
    date: {
        type: Date,
        required: [true, 'Event date is required']
    },
    category: {
        type: String,
        required: [true, 'Event category is required'],
        enum: ['workshop', 'concert', 'conference', 'other']
    },
    price: {
        type: Number,
        required: [true, 'Event price is required'],
        min: [0, 'Price cannot be negative']
    },
    availableTickets: {
        type: Number,
        required: [true, 'Number of available tickets is required'],
        min: [0, 'Available tickets cannot be negative']
    },
    location: {
        type: String,
        required: [true, 'Event location is required']
    },
    imageUrl: {
        type: String,
        default: 'default-event.jpg'
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled'],
        default: 'draft'
    }
}, {
    timestamps: true
});

// Add index for better search performance
eventSchema.index({ title: 'text', description: 'text' });

const Event = mongoose.model('Event', eventSchema);

export default Event; 