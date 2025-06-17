import Event from '../models/Event.js';
import { logger } from '../utils/logger.js';

// Create a new event
export const createEvent = async (req, res) => {
    try {
        const event = new Event({
            ...req.body,
            organizer: req.user._id
        });
        await event.save();
        logger.success(`Event created: ${event.title}`);
        res.status(201).json(event);
    } catch (error) {
        logger.error(`Error creating event: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Get all events with filtering and pagination
export const getEvents = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        const query = { status: 'published' };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const events = await Event.find(query)
            .sort({ date: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('organizer', 'name email');

        const total = await Event.countDocuments(query);

        res.json({
            events,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalEvents: total
        });
    } catch (error) {
        logger.error(`Error fetching events: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Get single event
export const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        logger.error(`Error fetching event: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Update event
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        logger.success(`Event updated: ${updatedEvent.title}`);
        res.json(updatedEvent);
    } catch (error) {
        logger.error(`Error updating event: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
};

// Delete event
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if user is the organizer
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await Event.findByIdAndDelete(req.params.id);
        logger.success(`Event deleted: ${event.title}`);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting event: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
}; 