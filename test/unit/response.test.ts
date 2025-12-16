/**
 * Unit Tests for Response Utilities
 */

import { Response } from 'express';
import { SuccessResponse } from '../../src/utils/response';

// Mock Response object
const createMockResponse = () => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
    return res as Response;
};

describe('Response Utilities', () => {
    describe('SuccessResponse', () => {
        it('should send response with default status 200', () => {
            const res = createMockResponse();
            const data = { message: 'Success', user: { id: 1 } };

            SuccessResponse(res, data);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data,
            });
        });

        it('should send response with custom status code', () => {
            const res = createMockResponse();
            const data = { message: 'Created' };

            SuccessResponse(res, data, 201);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data,
            });
        });

        it('should handle empty data object', () => {
            const res = createMockResponse();

            SuccessResponse(res, {});

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });

        it('should handle complex data structures', () => {
            const res = createMockResponse();
            const data = {
                message: 'Success',
                users: [
                    { id: 1, name: 'User 1' },
                    { id: 2, name: 'User 2' },
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 100,
                },
            };

            SuccessResponse(res, data);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data,
            });
        });
    });
});
