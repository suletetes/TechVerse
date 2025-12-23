/**
 * Authentication Helper for Tests
 * Provides utilities for creating authenticated users in tests
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';

/**
 * Create an authenticated user for testing
 * @param {Object} userData - Optional user data overrides
 * @returns {Object} { user, token }
 */
export const createAuthenticatedUser = async (userData = {}) => {
  const defaultUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Math.random().toString(36).substring(7)}@example.com`,
    password: await bcrypt.hash('TestPassword123!', 12),
    role: 'user', // Changed from 'customer' to 'user' to match User model enum
    isEmailVerified: true,
    ...userData
  };

  const user = await User.create(defaultUserData);

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  return { user, token };
};

/**
 * Create multiple authenticated users
 * @param {number} count - Number of users to create
 * @param {Object} baseUserData - Base user data for all users
 * @returns {Array} Array of { user, token } objects
 */
export const createMultipleAuthenticatedUsers = async (count, baseUserData = {}) => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const userData = {
      ...baseUserData,
      email: `test${i}${Math.random().toString(36).substring(7)}@example.com`
    };
    
    const auth = await createAuthenticatedUser(userData);
    users.push(auth);
  }
  
  return users;
};

/**
 * Create admin user for testing
 * @returns {Object} { user, token }
 */
export const createAdminUser = async () => {
  return createAuthenticatedUser({ role: 'admin' });
};

/**
 * Create super admin user for testing
 * @returns {Object} { user, token }
 */
export const createSuperAdminUser = async () => {
  return createAuthenticatedUser({ role: 'super_admin' });
};

/**
 * Create moderator user for testing
 * @returns {Object} { user, token }
 */
export const createModeratorUser = async () => {
  return createAuthenticatedUser({ role: 'content_moderator' }); // Use valid enum value
};

/**
 * Login existing user and get token
 * @param {string} email - User email
 * @param {string} password - User password (plain text)
 * @returns {Object} { user, token }
 */
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  return { user, token };
};

/**
 * Create expired token for testing
 * @param {Object} user - User object
 * @returns {string} Expired JWT token
 */
export const createExpiredToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '-1h' } // Expired 1 hour ago
  );
};

/**
 * Create invalid token for testing
 * @returns {string} Invalid JWT token
 */
export const createInvalidToken = () => {
  return 'invalid.jwt.token';
};

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {string} User ID
 */
export const getUserIdFromToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
  return decoded.userId;
};