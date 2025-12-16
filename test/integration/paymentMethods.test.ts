/**
 * Integration Tests for Payment Methods Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Payment Methods API', () => {
    let adminToken: string;
    let userToken: string;
    let createdPaymentMethodId: number;

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

    describe('Admin Payment Methods', () => {
        describe('POST /api/admin/payment-method', () => {
            it('should create a new payment method', async () => {
                const paymentMethodData = {
                    name: `PayPal ${Date.now()}`,
                    discription: 'PayPal payment method for testing',
                    isActive: true,
                };

                const response = await request(BASE_URL)
                    .post('/api/admin/payment-method')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(paymentMethodData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.paymentMethod).toBeDefined();

                createdPaymentMethodId = response.body.data.paymentMethod.id;
            });

            it('should reject missing required fields', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/payment-method')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ isActive: true });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/payment-method')
                    .send({
                        name: 'Unauthorized Payment',
                        discription: 'Should fail',
                    });

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/payment-method', () => {
            it('should get all payment methods', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/payment-method')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.paymentMethods).toBeDefined();
                expect(Array.isArray(response.body.data.paymentMethods)).toBe(true);
            });
        });

        describe('GET /api/admin/payment-method/:id', () => {
            it('should get payment method by id', async () => {
                if (!createdPaymentMethodId) return;

                const response = await request(BASE_URL)
                    .get(`/api/admin/payment-method/${createdPaymentMethodId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.paymentMethod.id).toBe(createdPaymentMethodId);
            });

            it('should return 404 for non-existent payment method', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/payment-method/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/admin/payment-method/:id', () => {
            it('should update a payment method', async () => {
                if (!createdPaymentMethodId) return;

                const response = await request(BASE_URL)
                    .put(`/api/admin/payment-method/${createdPaymentMethodId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: `Updated PayPal ${Date.now()}` });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe('DELETE /api/admin/payment-method/:id', () => {
            it('should delete a payment method', async () => {
                // Create a new payment method to delete
                const createResponse = await request(BASE_URL)
                    .post('/api/admin/payment-method')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: `To Delete ${Date.now()}`,
                        discription: 'Will be deleted',
                        isActive: true,
                    });

                const paymentMethodId = createResponse.body.data.paymentMethod.id;

                const response = await request(BASE_URL)
                    .delete(`/api/admin/payment-method/${paymentMethodId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });

    describe('User Payment Methods', () => {
        describe('GET /api/user/payment-method', () => {
            it('should get all payment methods for authenticated user', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/payment-method')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/payment-method');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/user/payment-method/:id', () => {
            it('should return 404 for non-existent payment method', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/payment-method/99999')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
