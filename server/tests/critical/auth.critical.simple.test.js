/**
 * CRITICAL AUTHENTICATION TESTS (Simplified)
 * These tests cover authentication without requiring database connection
 */

import request from 'supertest';
import app from '../app.js';

// Mock the database models
jest.mock('../../src/models/User.js', () => {
  const mockUser = {
    _id: 'mock-user-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'user',
    isEmailVerified: true,
    toObject: () => ({
      _id: 'mock-user-id',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'user',
      isEmailVerified: true
    })
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn().mockResolvedValue(mockUser),
      findOne: jest.fn().mockImplementation(({ email }) => {
        // Return null for new registrations, existing user for login
        if (email === 'john@example.com') {
          return Promise.resolve(null); // New user
        }
        return Promise.resolve(mockUser); // Existing user
      }),
      findById: jest.fn().mockResolvedValue(mockUser),
      find: jest.fn().mockResolvedValue([mockUser])
    }
  };
});

jest.mock('../../src/models/Product.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

jest.mock('../../src/models/Cart.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.mock('../../src/models/Order.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.mock('../../src/models/Role.js', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findOne: jest.fn()
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock mongoose to prevent actual database connections
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  connection: {
    readyState: 0,
    close: jest.fn().mockResolvedValue({}),
    collections: {}
  },
  Schema: jest.fn(),
  model: jest.fn()
}));

describe('CRITICAL: Authentication (Simplified)', () => {
  let server;

  beforeAll(() => {
    // Ensure no actual server is started
    jest.clearAllTimers();
  });

  afterAll(async () => {
    // Clean up any remaining handles
    if (server && server.close) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    
    // Clear all timers and intervals
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should reject registration with missing fields', async () => {
      const incompleteData = {
        firstName: 'John',
        email: 'john@example.com'
        // Missing lastName and password
      };

      await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);
    });

    test('should reject registration with mismatched passwords', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'ValidPass123!',
        confirmPassword: 'DifferentPass123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'ValidPass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should reject login with missing credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      await request(app)
        .post('/api/auth/login')
        .send({ password: 'password' })
        .expect(400);
    });
  });

  describe('Protected Routes', () => {
    test('should access protected route with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!'
        });

      const token = loginResponse.body.data.token;

      // Access protected route
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    test('should reject access without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    test('should reject access with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Role-Based Access Control', () => {
    test('should allow admin access to admin routes', async () => {
      // Mock admin user
      const User = require('../../src/models/User.js').default;
      User.findById.mockResolvedValueOnce({
        _id: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
        toObject: () => ({
          _id: 'admin-id',
          email: 'admin@example.com',
          role: 'admin'
        })
      });

      // Create admin token
      const jwt = require('jsonwebtoken');
      const adminToken = jwt.sign(
        { userId: 'admin-id', email: 'admin@example.com', role: 'admin' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test('should deny regular user access to admin routes', async () => {
      // Mock regular user
      const User = require('../../src/models/User.js').default;
      User.findById.mockResolvedValueOnce({
        _id: 'user-id',
        email: 'user@example.com',
        role: 'user',
        toObject: () => ({
          _id: 'user-id',
          email: 'user@example.com',
          role: 'user'
        })
      });

      // Create user token
      const jwt = require('jsonwebtoken');
      const userToken = jwt.sign(
        { userId: 'user-id', email: 'user@example.com', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format in registration', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      for (const email of invalidEmails) {
        await request(app)
          .post('/api/auth/register')
          .send({
            firstName: 'Test',
            lastName: 'User',
            email,
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!'
          })
          .expect(400);
      }
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid-json');

      expect([400, 500]).toContain(response.status);
    });
  });
});