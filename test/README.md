# CMS API Tests

This directory contains all tests for the CMS API.

## Directory Structure

```
test/
├── setup.ts                    # Jest setup file
├── helpers/
│   └── testUtils.ts            # Test utility functions
├── unit/                       # Unit tests
│   ├── auth.test.ts            # JWT auth utility tests
│   ├── validation.test.ts      # Validation schema tests
│   ├── errors.test.ts          # Error class tests
│   ├── response.test.ts        # Response utility tests
│   └── catchAsync.test.ts      # catchAsync wrapper tests
├── integration/                # Integration tests (API endpoint tests)
│   ├── auth.test.ts            # User auth endpoints
│   ├── adminAuth.test.ts       # Admin auth endpoints
│   ├── plans.test.ts           # Plans CRUD endpoints
│   ├── activities.test.ts      # Activities CRUD endpoints
│   ├── paymentMethods.test.ts  # Payment methods CRUD endpoints
│   ├── subscriptions.test.ts   # Subscriptions endpoints
│   ├── templates.test.ts       # Templates endpoints
│   ├── payments.test.ts        # Payments endpoints
│   ├── websites.test.ts        # Websites endpoints
│   ├── users.test.ts           # User management endpoints
│   └── promocodes.test.ts      # Promocodes endpoints
├── test_endpoints.ps1          # PowerShell script for manual testing
├── token.txt                   # User JWT token (for manual testing)
└── admin_token.txt             # Admin JWT token (for manual testing)
```

## Running Tests

### Prerequisites

1. Make sure the server is running: `npm run dev`
2. Make sure the database is set up: `npm run migrate-db`

### Commands

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### Manual API Testing (PowerShell)

For manual endpoint testing, run the PowerShell script:

```powershell
# From the test directory
powershell -ExecutionPolicy Bypass -File test_endpoints.ps1
```

## Test Types

### Unit Tests

Unit tests test individual functions and utilities in isolation:

- **auth.test.ts**: Tests JWT token generation and verification
- **validation.test.ts**: Tests Joi validation schemas for user input
- **errors.test.ts**: Tests custom error classes (NotFound, BadRequest, etc.)
- **response.test.ts**: Tests the SuccessResponse utility
- **catchAsync.test.ts**: Tests the async error handling wrapper

### Integration Tests

Integration tests test API endpoints against a running server:

- Tests actual HTTP requests/responses
- Tests authentication and authorization
- Tests CRUD operations
- Tests error handling
- Tests validation at the API level

## Writing New Tests

### Unit Test Example

```typescript
import { myFunction } from '../../src/utils/myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

describe('My Endpoint', () => {
  it('should return 200', async () => {
    const response = await request(BASE_URL)
      .get('/api/my-endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Credentials

For integration tests, the following test accounts are used:

- **User**: `testuser@example.com` / `Test123456`
- **Admin**: `admin@example.com` / `admin123`

## Coverage

Run `npm run test:coverage` to generate a coverage report. The report will be saved in the `coverage/` directory.

Coverage includes:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage
