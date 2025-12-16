/**
 * Integration Tests for User Authentication Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('User Authentication API', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    let authToken: string;
    let userId: number;

    describe('POST /api/user/auth/local/signup', () => {
        it('should create a new user successfully', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/signup')
                .send({
                    name: 'Integration Test User',
                    email: testEmail,
                    password: 'TestPassword123',
                    phoneNumber: '1234567890',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toContain('User Signup Successfully');
            expect(response.body.data.userId).toBeDefined();

            userId = response.body.data.userId;
        });

        it('should reject duplicate email', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/signup')
                .send({
                    name: 'Another User',
                    email: testEmail,
                    password: 'TestPassword123',
                    phoneNumber: '9876543210',
                });

            // Should return conflict or require verification
            expect([201, 409, 403]).toContain(response.status);
        });

        it('should reject invalid email format', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/signup')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'TestPassword123',
                    phoneNumber: '1234567890',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject missing required fields', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/signup')
                .send({
                    name: 'Test User',
                    email: `missing_${Date.now()}@example.com`,
                    // missing password and phoneNumber
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject short password', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/signup')
                .send({
                    name: 'Test User',
                    email: `short_${Date.now()}@example.com`,
                    password: '123',
                    phoneNumber: '1234567890',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/user/auth/local/login', () => {
        it('should reject unverified user', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/login')
                .send({
                    email: testEmail,
                    password: 'TestPassword123',
                });

            // Unverified user should get 403
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('Verify');
        });

        it('should reject wrong password', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'WrongPassword123',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject non-existent user', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'TestPassword123',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should login verified user successfully', async () => {
            // Using the pre-verified test user
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'Test123456',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();

            authToken = response.body.data.token;
        });
    });

    describe('POST /api/user/auth/local/forgot-password', () => {
        it('should send reset code for existing user', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/forgot-password')
                .send({
                    email: 'testuser@example.com',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject non-existent email', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/forgot-password')
                .send({
                    email: 'nonexistent@example.com',
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should reject invalid email format', async () => {
            const response = await request(BASE_URL)
                .post('/api/user/auth/local/forgot-password')
                .send({
                    email: 'invalid-email',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
