/**
 * Integration Tests for Subscriptions Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Subscriptions API', () => {
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        // Login as admin
        const adminResponse = await request(BASE_URL)
            .post('/api/admin/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123',
            });
        adminToken = adminResponse.body.data.token;

        // Login as user
        const userResponse = await request(BASE_URL)
            .post('/api/user/auth/local/login')
            .send({
                email: 'testuser@example.com',
                password: 'Test123456',
            });
        userToken = userResponse.body.data.token;
    });

    describe('Admin Subscriptions', () => {
        describe('GET /api/admin/subscriptions', () => {
            it('should get all subscriptions', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/subscriptions')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.subscriptions).toBeDefined();
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/subscriptions');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/subscriptions/:id', () => {
            it('should return 404 for non-existent subscription', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/subscriptions/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('User Subscriptions', () => {
        describe('GET /api/user/subscriptions', () => {
            it('should return 404 when user has no subscriptions', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/subscriptions')
                    .set('Authorization', `Bearer ${userToken}`);

                // Either 200 with empty array or 404
                expect([200, 404]).toContain(response.status);
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/subscriptions');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/user/subscriptions/:id', () => {
            it('should return 404 for non-existent subscription', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/subscriptions/99999')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
