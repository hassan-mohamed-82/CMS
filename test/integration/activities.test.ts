/**
 * Integration Tests for Activities Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Activities API', () => {
    let adminToken: string;
    let userToken: string;
    let createdActivityId: number;

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

    describe('Admin Activities', () => {
        describe('POST /api/admin/activities', () => {
            it('should create a new activity', async () => {
                const activityData = {
                    name: `Test Activity ${Date.now()}`,
                    isActive: true,
                };

                const response = await request(BASE_URL)
                    .post('/api/admin/activities')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(activityData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.activity).toBeDefined();

                createdActivityId = response.body.data.activity.id;
            });

            it('should reject duplicate activity name', async () => {
                // First create an activity
                const uniqueName = `Unique Activity ${Date.now()}`;
                await request(BASE_URL)
                    .post('/api/admin/activities')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: uniqueName, isActive: true });

                // Try to create with same name
                const response = await request(BASE_URL)
                    .post('/api/admin/activities')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: uniqueName, isActive: true });

                expect(response.status).toBe(409);
                expect(response.body.success).toBe(false);
            });

            it('should reject missing name', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/activities')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ isActive: true });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/activities', () => {
            it('should get all activities', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/activities')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.activities).toBeDefined();
                expect(Array.isArray(response.body.data.activities)).toBe(true);
            });
        });

        describe('GET /api/admin/activities/:id', () => {
            it('should get activity by id', async () => {
                if (!createdActivityId) return;

                const response = await request(BASE_URL)
                    .get(`/api/admin/activities/${createdActivityId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.activity.id).toBe(createdActivityId);
            });

            it('should return 404 for non-existent activity', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/activities/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/admin/activities/:id', () => {
            it('should update an activity', async () => {
                if (!createdActivityId) return;

                const response = await request(BASE_URL)
                    .put(`/api/admin/activities/${createdActivityId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: `Updated Activity ${Date.now()}` });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        describe('DELETE /api/admin/activities/:id', () => {
            it('should delete an activity', async () => {
                // Create a new activity to delete
                const createResponse = await request(BASE_URL)
                    .post('/api/admin/activities')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: `To Delete ${Date.now()}`, isActive: true });

                const activityId = createResponse.body.data.activity.id;

                const response = await request(BASE_URL)
                    .delete(`/api/admin/activities/${activityId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });

    describe('User Activities', () => {
        describe('GET /api/user/activities', () => {
            it('should get all activities for authenticated user', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/activities')
                    .set('Authorization', `Bearer ${userToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should reject unauthenticated request', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/activities');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
