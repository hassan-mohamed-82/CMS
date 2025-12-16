/**
 * Integration Tests for Templates Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Templates API', () => {
    let adminToken: string;

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

    describe('User Templates (Public)', () => {
        describe('GET /api/user/templates', () => {
            it('should return templates or 404 if empty', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/templates');

                // Either 200 with templates or 404 if no templates
                expect([200, 404]).toContain(response.status);
            });
        });

        describe('GET /api/user/templates/:id', () => {
            it('should return 404 for non-existent template', async () => {
                const response = await request(BASE_URL)
                    .get('/api/user/templates/99999');

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });
    });

    describe('Admin Templates', () => {
        describe('GET /api/admin/templates', () => {
            it('should return templates or 404 if empty', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/templates')
                    .set('Authorization', `Bearer ${adminToken}`);

                // Either 200 with templates or 404 if no templates
                expect([200, 404]).toContain(response.status);
            });

            it('should reject without authentication', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/templates');

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe('GET /api/admin/templates/:id', () => {
            it('should return 404 for non-existent template', async () => {
                const response = await request(BASE_URL)
                    .get('/api/admin/templates/99999')
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(404);
                expect(response.body.success).toBe(false);
            });
        });

        // Note: POST, PUT, DELETE tests would require file uploads
        // which need special handling with supertest
        describe('POST /api/admin/templates', () => {
            it('should reject without file upload', async () => {
                const response = await request(BASE_URL)
                    .post('/api/admin/templates')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: 'Test Template',
                    });

                // Should fail without required files
                expect([400, 500]).toContain(response.status);
            });
        });
    });
});
