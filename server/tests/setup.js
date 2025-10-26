import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock logger to avoid console output during tests
jest.mock('../src/utils/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock database connection
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    dropDatabase: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue({})
  },
  Types: {
    ObjectId: jest.fn().mockImplementation(() => 'mockObjectId')
  }
}));

// Global test timeout
jest.setTimeout(30000);

// Setup global test environment
global.console = {
  ...console,
  // Suppress console.log during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};