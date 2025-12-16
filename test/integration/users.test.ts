/**
 * Integration Tests for Users Management (Admin)
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Users Management API (Admin)', () => {
    let adminToken: string;
    let createdUserId: number;

    beforeAll(async () => {
        // Login as admin
        const response = await request(BASE_URL)
            .post('/api/admin/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123',
            });
        adminToken = response.body.data.token;
    });

    describe('GET /api/admin/users', () => {
        it('should get all users', async () => {
            const response = await request(BASE_URL)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeDefined();
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });

        it('should reject without authentication', async () => {
            const response = await request(BASE_URL)
                .get('/api/admin/users');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject with user token', async () => {
            // Login as regular user
            const userResponse = await request(BASE_URL)
                .post('/api/user/auth/local/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'Test123456',
                });
            const userToken = userResponse.body.data.token;

            const response = await request(BASE_URL)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/admin/users/:id', () => {
        it('should get user by id', async () => {
            const response = await request(BASE_URL)
                .get('/api/admin/users/1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.id).toBe(1);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(BASE_URL)
                .get('/api/admin/users/99999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/admin/users', () => {
        it('should create a new user', async () => {
            const userData = {
                name: 'Admin Created User',
                email: `admin_created_${Date.now()}@example.com`,
                password: 'Password123',
                phonenumber: '9876543210',
            };

            const response = await request(BASE_URL)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();

            createdUserId = response.body.data.user.id;
        });

        it('should reject missing password', async () => {
            const response = await request(BASE_URL)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'No Password User',
                    email: `nopassword_${Date.now()}@example.com`,
                    phonenumber: '1234567890',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/admin/users/:id', () => {
        it('should update a user', async () => {
            if (!createdUserId) return;

            const response = await request(BASE_URL)
                .put(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated User Name' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(BASE_URL)
                .put('/api/admin/users/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Should Fail' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete a user', async () => {
            // Create a user to delete
            const createResponse = await request(BASE_URL)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'To Delete User',
                    email: `to_delete_${Date.now()}@example.com`,
                    password: 'Password123',
                    phonenumber: '1234567890',
                });

            const userId = createResponse.body.data.user.id;

            const response = await request(BASE_URL)
                .delete(`/api/admin/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(BASE_URL)
                .delete('/api/admin/users/99999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });
});
