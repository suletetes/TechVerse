/**
 * Test Data Fixtures
 * Factory functions for creating test data
 */

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

/**
 * Create test user data
 */
const createUserFixture = (overrides = {}) => {
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    role: 'user',
    isEmailVerified: true,
    ...overrides
  };
};

/**
 * Create admin user data
 */
const createAdminFixture = (overrides = {}) => {
  return createUserFixture({
    firstName: 'Admin',
    lastName: 'User',
    email: `admin${Date.now()}@example.com`,
    role: 'admin',
    ...overrides
  });
};

/**
 * Create product data
 */
const createProductFixture = (overrides = {}) => {
  return {
    name: `Test Product ${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    description: 'This is a test product description',
    price: 999.99,
    compareAtPrice: 1299.99,
    category: 'Phones',
    brand: 'TestBrand',
    model: 'TestModel',
    sku: `SKU-${Date.now()}`,
    stock: {
      quantity: 100,
      trackQuantity: true,
      lowStockThreshold: 10
    },
    images: [
      {
        url: 'https://example.com/image1.jpg',
        alt: 'Test Product Image',
        isPrimary: true
      }
    ],
    status: 'active',
    featured: false,
    sections: ['latest'],
    colors: ['Midnight', 'Silver', 'Gold'],
    storageOptions: ['128GB', '256GB', '512GB'],
    technicalSpecs: {
      'Display & Design': {
        'Screen Size': '6.1 inches',
        'Display Type': 'OLED'
      },
      'Performance': {
        'Processor': 'Test Chip',
        'RAM': '8GB'
      }
    },
    rating: {
      average: 4.5,
      count: 100
    },
    ...overrides
  };
};

/**
 * Create order data
 */
const createOrderFixture = (userId, overrides = {}) => {
  return {
    user: userId,
    orderNumber: `ORD-${Date.now()}`,
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 999.99,
        quantity: 1,
        selectedOptions: {
          color: 'Midnight',
          storage: '256GB'
        }
      }
    ],
    total: 999.99,
    subtotal: 999.99,
    tax: 0,
    shipping: 0,
    shippingAddress: {
      name: 'Test User',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postcode: '12345',
      country: 'United Kingdom'
    },
    billingAddress: {
      name: 'Test User',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postcode: '12345',
      country: 'United Kingdom'
    },
    payment: {
      method: 'stripe',
      status: 'succeeded',
      paymentIntentId: `pi_test_${Date.now()}`
    },
    status: 'pending',
    ...overrides
  };
};

/**
 * Create review data
 */
const createReviewFixture = (userId, productId, overrides = {}) => {
  return {
    user: userId,
    product: productId,
    rating: 5,
    title: 'Great Product!',
    comment: 'This is a test review comment. The product is excellent.',
    verified: true,
    helpful: 0,
    ...overrides
  };
};

/**
 * Create category data
 */
const createCategoryFixture = (overrides = {}) => {
  return {
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    description: 'Test category description',
    image: 'https://example.com/category.jpg',
    isActive: true,
    productCount: 0,
    ...overrides
  };
};

/**
 * Create address data
 */
const createAddressFixture = (overrides = {}) => {
  return {
    type: 'Home',
    name: 'Test User',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    postcode: '12345',
    country: 'United Kingdom',
    isDefault: false,
    ...overrides
  };
};

/**
 * Hash password for user fixtures
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export {
  createUserFixture,
  createAdminFixture,
  createProductFixture,
  createOrderFixture,
  createReviewFixture,
  createCategoryFixture,
  createAddressFixture,
  hashPassword
};
