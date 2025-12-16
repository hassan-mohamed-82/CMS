/**
 * Unit Tests for Error Classes
 */

import { StatusCodes } from 'http-status-codes';
import { AppError } from '../../src/Errors/appError';
import { NotFound } from '../../src/Errors/NotFound';
import { BadRequest } from '../../src/Errors/BadRequest';
import { UnauthorizedError } from '../../src/Errors/unauthorizedError';
import { ForbiddenError } from '../../src/Errors/forbiddenError';
import { ConflictError } from '../../src/Errors/conflictError';
import { ValidationError } from '../../src/Errors/validationError';

describe('Error Classes', () => {
    describe('AppError', () => {
        it('should create error with message, statusCode, and details', () => {
            const error = new AppError('Test error', 500, { field: 'value' });

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.details).toEqual({ field: 'value' });
            expect(error instanceof Error).toBe(true);
        });

        it('should work without details', () => {
            const error = new AppError('Test error', 400);

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.details).toBeUndefined();
        });
    });

    describe('NotFound', () => {
        it('should create 404 error with default message', () => {
            const error = new NotFound();

            expect(error.message).toBe('Not Found Resource');
            expect(error.statusCode).toBe(StatusCodes.NOT_FOUND);
        });

        it('should create 404 error with custom message', () => {
            const error = new NotFound('User not found');

            expect(error.message).toBe('User not found');
            expect(error.statusCode).toBe(StatusCodes.NOT_FOUND);
        });

        it('should accept details', () => {
            const error = new NotFound('User not found', { userId: 123 });

            expect(error.details).toEqual({ userId: 123 });
        });
    });

    describe('BadRequest', () => {
        it('should create 400 error with default message', () => {
            const error = new BadRequest();

            expect(error.message).toBe('Bad request');
            expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should create 400 error with custom message', () => {
            const error = new BadRequest('Invalid input');

            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    describe('UnauthorizedError', () => {
        it('should create 401 error', () => {
            const error = new UnauthorizedError('Invalid token');

            expect(error.message).toBe('Invalid token');
            expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
        });
    });

    describe('ForbiddenError', () => {
        it('should create 403 error', () => {
            const error = new ForbiddenError('Access denied');

            expect(error.message).toBe('Access denied');
            expect(error.statusCode).toBe(StatusCodes.FORBIDDEN);
        });
    });

    describe('ConflictError', () => {
        it('should create 409 error', () => {
            const error = new ConflictError('Email already exists');

            expect(error.message).toBe('Email already exists');
            expect(error.statusCode).toBe(StatusCodes.CONFLICT);
        });
    });

    describe('ValidationError', () => {
        it('should create 400 error with validation details', () => {
            const details = [{ field: 'email', message: 'Invalid format' }];
            const error = new ValidationError('Validation failed', details);

            expect(error.message).toBe('Validation failed');
            expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(error.details).toEqual(details);
        });
    });
});
