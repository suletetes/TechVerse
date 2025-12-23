/**
 * Jest Test Setup
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Store original timers
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

beforeAll(() => {
  // Mock console methods
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(async () => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;

  // Clear all timers
  jest.clearAllTimers();
  jest.useRealTimers();

  // Restore original timer functions
  global.setTimeout = originalSetTimeout;
  global.setInterval = originalSetInterval;
  global.clearTimeout = originalClearTimeout;
  global.clearInterval = originalClearInterval;

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllTimers();
});

// Global test utilities
global.testUtils = {
  createTestUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: '$2a$12$hashedpassword',
    role: 'user',
    isEmailVerified: true,
    ...overrides
  }),

  createTestProduct: (overrides = {}) => ({
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test product description',
    price: 99.99,
    category: 'electronics',
    status: 'active',
    stock: { quantity: 10, trackQuantity: true },
    ...overrides
  })
};