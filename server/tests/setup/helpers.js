/**
 * Test Helper Functions
 * Utility functions for testing
 */

import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { User, Product, Order } from '../../src/models/index.js';
import { createUserFixture, createAdminFixture, hashPassword } from './fixtures.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Create a test user in the database
 */
const createTestUser = async (overrides = {}) => {
  const userData = createUserFixture(overrides);
  
  // Hash password
  userData.password = await hashPassword(userData.password);
  
  const user = await User.create(userData);
  return user;
};

/**
 * Create a test admin user in the database
 */
const createTestAdmin = async (overrides = {}) => {
  const adminData = createAdminFixture(overrides);
  
  // Hash password
  adminData.password = await hashPassword(adminData.password);
  
  const admin = await User.create(adminData);
  return admin;
};

/**
 * Generate authentication token for user
 */
const generateAuthToken = (userId, role = 'user') => {
  return jwt.sign(
    { 
      id: userId,
      role: role
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Generate authentication headers
 */
const getAuthHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Create authenticated request headers
 */
const createAuthHeaders = async (user) => {
  const token = generateAuthToken(user._id, user.role);
  return getAuthHeaders(token);
};

/**
 * Clean up test data
 */
const cleanupTestData = async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
};

/**
 * Wait for a specified time (useful for async operations)
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create multiple test users
 */
const createMultipleUsers = async (count = 5) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      email: `testuser${i}@example.com`,
      firstName: `Test${i}`,
      lastName: `User${i}`
    });
    users.push(user);
  }
  return users;
};

/**
 * Create multiple test products
 */
const createMultipleProducts = async (count = 5) => {
  const { createProductFixture } = await import('./fixtures.js');
  const products = [];
  
  for (let i = 0; i < count; i++) {
    const productData = createProductFixture({
      name: `Test Product ${i}`,
      slug: `test-product-${i}`,
      price: 100 * (i + 1)
    });
    const product = await Product.create(productData);
    products.push(product);
  }
  return products;
};

/**
 * Mock Express request object
 */
const mockRequest = (data = {}) => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
    ...data
  };
};

/**
 * Mock Express response object
 */
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock Express next function
 */
const mockNext = () => jest.fn();

export {
  createTestUser,
  createTestAdmin,
  generateAuthToken,
  getAuthHeaders,
  createAuthHeaders,
  cleanupTestData,
  wait,
  createMultipleUsers,
  createMultipleProducts,
  mockRequest,
  mockResponse,
  mockNext
};
