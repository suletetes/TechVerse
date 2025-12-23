/**
 * Jest Test Setup
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret';

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