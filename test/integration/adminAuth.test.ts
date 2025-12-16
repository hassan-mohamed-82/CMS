/**
 * Integration Tests for Admin Authentication Endpoints
 */

import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('Admin Authentication API', () => {
    let adminToken: string;

    describe('POST /api/admin/auth/login', () => {
        it('should login admin successfully', async () => {
            const response = await request(BASE_URL)
                .post('/api/admin/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'admin123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.message).toContain('login Successful');

            adminToken = response.body.data.token;
        });

        it('should reject wrong password', async () => {
            const response = await request(BASE_URL)
                .post('/api/admin/auth/login')
                .send({
                    email: 'admin@example.com',
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject non-existent admin', async () => {
            const response = await request(BASE_URL)
                .post('/api/admin/auth/login')
                .send({
                    email: 'notadmin@example.com',
                    password: 'admin123',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should reject missing email', async () => {
            const response = await request(BASE_URL)
                .post('/api/admin/auth/login')
                .send({
                    password: 'admin123',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject missing password', async () => {
            const response = await request(BASE_URL)
                .post('/api/admin/auth/login')
                .send({
                    email: 'admin@example.com',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
