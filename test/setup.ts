import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
    // Add any global cleanup here
});
