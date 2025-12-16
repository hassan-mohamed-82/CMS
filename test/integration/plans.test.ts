/**
 * Integration Tests for Plans Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Plans API', () => {
    let adminToken: string;
    let createdPlanId: number;

    beforeAll(async () => {
        // Login as admin to get token
        const response = await request(BASE_URL)
            .post('/api/admin/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123',
            });

        adminToken = response.body.data.token;
    });

    describe('User Plans (Public)', () => {
        describe('GET /api/user/plans', () => {
            it('should get all plans', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/plans');

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.plans).toBeDefined();
                expect(Array.isArray(response.body.data.plans)).toBe(true);
            });
        });

        describe('GET /api/user/plans/:id', () => {
            it('should return 404 for non-existent plan', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/plans/99999');

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Admin Plans (Protected)', () => {
        describe('POST /api/admin/plans', () => {
            it('should create a new plan', async () => {
                const planData = {
                    name: `Test Plan ${Date.now()}`,
                    description: 'A test plan for integration testing',
                    monthlyPrice: 9.99,
                    quarterlyPrice: 24.99,
                    semiAnnuallyPrice: 44.99,
                    yearlyPrice: 79.99,
                    isActive: true,
                };

                const response = await request(BASE_URL)
                    .post('/api/admin/plans')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(planData);

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.plan).toBeDefined();
                expect(response.body.data.plan.name).toBe(planData.name);

                createdPlanId = response.body.data.plan.id;
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/plans')
                    .send({
                        name: 'Unauthorized Plan',
                        monthlyPrice: 9.99,
                    });

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });

            it('should reject missing required fields', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/plans')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        description: 'Missing name and price',
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/plans', () => {
            it('should get all plans with admin token', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/plans')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.plans).toBeDefined();
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/plans');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/plans/:id', () => {
            it('should get plan by id', async () => {
                if (!createdPlanId) {
                    console.log('Skipping - no plan created');
                    return;
                }

                const response = await request(BASE_URL)
                    .get(`/api/admin/plans/${createdPlanId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.plan.id).toBe(createdPlanId);
            });

            it('should return 404 for non-existent plan', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/plans/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('PUT /api/admin/plans/:id', () => {
            it('should update a plan', async () => {
                if (!createdPlanId) {
                    console.log('Skipping - no plan created');
                    return;
                }

                const updateData = {
                    name: `Updated Plan ${Date.now()}`,
                    monthlyPrice: 19.99,
                };

                const response = await request(BASE_URL)
                    .put(`/api/admin/plans/${createdPlanId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(updateData);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 404 for non-existent plan', async () => {
                const response = await request(BASE_URL)
                    .put('/api/admin/plans/99999')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Updated' });

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        describe('DELETE /api/admin/plans/:id', () => {
            it('should delete a plan', async () => {
                if (!createdPlanId) {
                    console.log('Skipping - no plan created');
                    return;
                }

                const response = await request(BASE_URL)
                    .delete(`/api/admin/plans/${createdPlanId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should return 404 for already deleted plan', async () => {
                if (!createdPlanId) {
                    console.log('Skipping - no plan to delete');
                    return;
                }

                const response = await request(BASE_URL)
                    .delete(`/api/admin/plans/${createdPlanId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });
});
