import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/eventsphere-test';
process.env.JWT_SECRET = 'test-secret-key';

// Connect to test database
beforeAll(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI_TEST);
        console.log('Connected to test database');
    } catch (error) {
        console.error('Error connecting to test database:', error);
        process.exit(1);
    }
});

// Clear all collections between tests
beforeEach(async () => {
    try {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
        console.log('Cleared test database');
    } catch (error) {
        console.error('Error clearing test database:', error);
    }
});

// Close database connection after all tests
afterAll(async () => {
    try {
        await mongoose.connection.close();
        console.log('Disconnected from test database');
    } catch (error) {
        console.error('Error disconnecting from test database:', error);
    }
}); 