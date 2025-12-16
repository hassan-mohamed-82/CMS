/**
 * Integration Tests for Promocodes Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Promocodes API', () => {
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

    describe('Admin Promocodes', () => {
        describe('GET /api/admin/promocode', () => {
            it('should get all promocodes', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/promocode')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.promos).toBeDefined();
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/promocode');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/promocode/:id', () => {
            it('should return 404 for non-existent promocode', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/promocode/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('POST /api/admin/promocode', () => {
            it('should reject missing promo data', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/promocode')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/admin/promocode/:id', () => {
            it('should return 404 for non-existent promocode', async () => {
                const response = await request(BASE_URL)
                    .put('/api/admin/promocode/99999')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ code: 'UPDATED' });

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('DELETE /api/admin/promocode/:id', () => {
            it('should return 404 for non-existent promocode', async () => {
                const response = await request(BASE_URL)
                    .delete('/api/admin/promocode/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Admin Promocode Users', () => {
        describe('GET /api/admin/promocodeuser', () => {
            it('should return promocode users or 404 if empty', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/promocodeuser')
                    .set('Authorization', `Bearer ${adminToken}`);

                // Either 200 with data or 404 if no promocode users
                expect([200, 404]).toContain(response.status);
            });
        });

        describe('GET /api/admin/promocodeuser/:id', () => {
            it('should return 404 for non-existent promocode user', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/promocodeuser/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('User Promocode', () => {
        describe('GET /api/user/promocodeuser', () => {
            it('should return 404 when user has no promocode', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/promocodeuser')
                    .set('Authorization', `Bearer ${userToken}`);

                // User likely doesn't have a promocode
                expect([200, 404]).toContain(response.status);
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/promocodeuser');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/user/promocodeuser/:id', () => {
            it('should return 404 for non-existent promocode', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/promocodeuser/99999')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
