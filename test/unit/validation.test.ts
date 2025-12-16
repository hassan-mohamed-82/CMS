/**
 * Unit Tests for Validation Schemas
 */

import {
    signupSchema,
    loginSchema,
    verifyEmailSchema,
    sendResetCodeSchema,
    checkResetCodeSchema,
    resetPasswordSchema,
} from '../../src/validation/user/auth';

describe('User Auth Validation Schemas', () => {
    describe('signupSchema', () => {
        it('should validate correct signup data', async () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                phoneNumber: '1234567890',
            };

            const result = await signupSchema.validateAsync(validData);
            expect(result).toEqual(validData);
        });

        it('should reject missing name', async () => {
            const invalidData = {
                email: 'john@example.com',
                password: 'password123',
                phoneNumber: '1234567890',
            };

            await expect(signupSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject short name (less than 3 characters)', async () => {
            const invalidData = {
                name: 'Jo',
                email: 'john@example.com',
                password: 'password123',
                phoneNumber: '1234567890',
            };

            await expect(signupSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject invalid email format', async () => {
            const invalidData = {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'password123',
                phoneNumber: '1234567890',
            };

            await expect(signupSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject short password (less than 6 characters)', async () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '12345',
                phoneNumber: '1234567890',
            };

            await expect(signupSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject missing phone number', async () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            };

            await expect(signupSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should accept optional imagePath', async () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                phoneNumber: '1234567890',
                imagePath: '/uploads/profile.jpg',
            };

            const result = await signupSchema.validateAsync(validData);
            expect(result.imagePath).toBe('/uploads/profile.jpg');
        });
    });

    describe('loginSchema', () => {
        it('should validate correct login data', async () => {
            const validData = {
                email: 'john@example.com',
                password: 'password123',
            };

            const result = await loginSchema.validateAsync(validData);
            expect(result).toEqual(validData);
        });

        it('should reject missing email', async () => {
            const invalidData = {
                password: 'password123',
            };

            await expect(loginSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject missing password', async () => {
            const invalidData = {
                email: 'john@example.com',
            };

            await expect(loginSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject invalid email format', async () => {
            const invalidData = {
                email: 'not-an-email',
                password: 'password123',
            };

            await expect(loginSchema.validateAsync(invalidData)).rejects.toThrow();
        });
    });

    describe('verifyEmailSchema', () => {
        it('should validate correct verification data', async () => {
            const validData = {
                userId: '123',
                code: '123456',
            };

            const result = await verifyEmailSchema.validateAsync(validData);
            expect(result).toEqual(validData);
        });

        it('should reject missing userId', async () => {
            const invalidData = {
                code: '123456',
            };

            await expect(verifyEmailSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject missing code', async () => {
            const invalidData = {
                userId: '123',
            };

            await expect(verifyEmailSchema.validateAsync(invalidData)).rejects.toThrow();
        });
    });

    describe('sendResetCodeSchema', () => {
        it('should validate correct email', async () => {
            const validData = { email: 'john@example.com' };

            const result = await sendResetCodeSchema.validateAsync(validData);
            expect(result).toEqual(validData);
        });

        it('should reject invalid email', async () => {
            const invalidData = { email: 'invalid-email' };

            await expect(sendResetCodeSchema.validateAsync(invalidData)).rejects.toThrow();
        });
    });

    describe('checkResetCodeSchema', () => {
        it('should validate correct reset code data', async () => {
            const validData = {
                email: 'john@example.com',
                code: '123456',
            };

            const result = await checkResetCodeSchema.validateAsync(validData);
            expect(result).toEqual(validData);
        });
    });

    describe('resetPasswordSchema', () => {
        it('should validate correct reset password data', async () => {
            const validData = {
                email: 'john@example.com',
                newPassword: 'newpassword123',
            };

            const result = await resetPasswordSchema.validateAsync(validData);
            expect(result).toEqual(validData);
        });

        it('should reject short password', async () => {
            const invalidData = {
                email: 'john@example.com',
                newPassword: '12345',
            };

            await expect(resetPasswordSchema.validateAsync(invalidData)).rejects.toThrow();
        });

        it('should reject too long password', async () => {
            const invalidData = {
                email: 'john@example.com',
                newPassword: 'a'.repeat(31),
            };

            await expect(resetPasswordSchema.validateAsync(invalidData)).rejects.toThrow();
        });
    });
});
