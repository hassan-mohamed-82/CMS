import request from 'supertest';
import express from 'express';

/**
 * Test utility functions for API testing
 */

export interface TestUser {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
}

export interface TestAdmin {
    email: string;
    password: string;
}

export const testUser: TestUser = {
    name: 'Test User',
    email: `testuser_${Date.now()}@example.com`,
    password: 'TestPassword123',
    phoneNumber: '1234567890',
};

export const testAdmin: TestAdmin = {
    email: 'admin@example.com',
    password: 'admin123',
};

/**
 * Generate a unique test email
 */
export const generateTestEmail = (): string => {
    return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * Generate a random string
 */
export const generateRandomString = (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Create authenticated request headers
 */
export const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
});

/**
 * Wait for a specified time (useful for rate limiting tests)
 */
export const wait = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Assert response structure
 */
export const assertSuccessResponse = (response: any) => {
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
};

export const assertErrorResponse = (response: any, statusCode: number) => {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', statusCode);
};
