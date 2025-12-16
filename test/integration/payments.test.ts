/**
 * Integration Tests for Payments Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Payments API', () => {
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

    describe('Admin Payments', () => {
        describe('GET /api/admin/payments', () => {
            it('should get all payments', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/payments')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.payments).toBeDefined();
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/payments');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/payments/:id', () => {
            it('should return 404 for non-existent payment', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/payments/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/admin/payments/:id', () => {
            it('should return 404 for non-existent payment', async () => {
                const response = await request(BASE_URL)
                    .put('/api/admin/payments/99999')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ status: 'approved' });

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('User Payments', () => {
        describe('GET /api/user/payments', () => {
            it('should get user payments', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/payments')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.payments).toBeDefined();
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/payments');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/user/payments/:id', () => {
            it('should return 404 for non-existent payment', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/payments/99999')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('POST /api/user/payments', () => {
            it('should reject missing required fields', async () => {
                const response = await request(BASE_URL)
                    .post('/api/user/payments')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
