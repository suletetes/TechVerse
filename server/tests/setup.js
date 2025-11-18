/**
 * Jest Test Setup
 * Global setup and teardown for all tests
 */

import { setupTestDb, teardownTestDb } from './setup/testDb.js';

// Setup before all tests
beforeAll(async () => {
  await setupTestDb();
});

// Teardown after all tests
afterAll(async () => {
  await teardownTestDb();
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}
