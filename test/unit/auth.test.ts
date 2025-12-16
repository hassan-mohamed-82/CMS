/**
 * Unit Tests for Authentication Utilities
 */

import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';

// Import after setting env
import { generateToken, verifyToken } from '../../src/utils/auth';

describe('Auth Utilities', () => {
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const user = { id: 1, name: 'Test User' };
            const token = generateToken(user);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        it('should include user data in token payload', () => {
            const user = { id: 1, name: 'Test User', role: 'admin' };
            const token = generateToken(user);

            const decoded = jwt.decode(token) as any;

            expect(decoded.id).toBe(user.id);
            expect(decoded.name).toBe(user.name);
            expect(decoded.role).toBe(user.role);
        });

        it('should set expiration time', () => {
            const user = { id: 1, name: 'Test User' };
            const token = generateToken(user);

            const decoded = jwt.decode(token) as any;

            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token and return user data', () => {
            const user = { id: 1, name: 'Test User', role: 'user' };
            const token = generateToken(user);

            const result = verifyToken(token);

            expect(result.id).toBe(user.id);
            expect(result.name).toBe(user.name);
        });

        it('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => verifyToken(invalidToken)).toThrow();
        });

        it('should throw error for expired token', () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { id: 1, name: 'Test' },
                process.env.JWT_SECRET as string,
                { expiresIn: '-1s' }
            );

            expect(() => verifyToken(expiredToken)).toThrow();
        });

        it('should throw error for token with wrong secret', () => {
            const tokenWithWrongSecret = jwt.sign(
                { id: 1, name: 'Test' },
                'wrong-secret',
                { expiresIn: '7d' }
            );

            expect(() => verifyToken(tokenWithWrongSecret)).toThrow();
        });
    });
});
