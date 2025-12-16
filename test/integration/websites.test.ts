/**
 * Integration Tests for Websites Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Websites API', () => {
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

    describe('Admin Websites', () => {
        describe('GET /api/admin/websites', () => {
            it('should get all websites', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/websites')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.websites).toBeDefined();
                expect(Array.isArray(response.body.data.websites)).toBe(true);
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/websites');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/websites/:id', () => {
            it('should return 404 for non-existent website', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/websites/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/admin/websites/:id', () => {
            it('should return 404 for non-existent website', async () => {
                const response = await request(BASE_URL)
                    .put('/api/admin/websites/99999')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ status: 'approved' });

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });

            it('should reject invalid status', async () => {
                const response = await request(BASE_URL)
                    .put('/api/admin/websites/1')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ status: 'invalid_status' });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('User Websites', () => {
        describe('GET /api/user/websites', () => {
            it('should get user websites', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/websites')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.websites).toBeDefined();
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/websites');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/user/websites/:id', () => {
            it('should return 404 for non-existent website', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/websites/99999')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('DELETE /api/user/websites/:websiteId', () => {
            it('should return 404 for non-existent website', async () => {
                const response = await request(BASE_URL)
                    .delete('/api/user/websites/99999')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
