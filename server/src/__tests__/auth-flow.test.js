import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import authRoutes from '../routes/auth.js';
import adminRoutes from '../routes/admin.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';

// Create a minimal test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', authenticate, requireAdmin, adminRoutes);
  app.use(errorHandler);
  return app;
};

describe('Authentication Flow Integration Tests', () => {
  let mongoServer;
  let app;
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_EXPIRE = '1h';

    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test app
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});

    // Create test users
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: await bcrypt.hash('Password123', 12),
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      isActive: true
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('Password123', 12),
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active',
      isActive: true
    });

    // Generate auth tokens
    userToken = jwt.sign(
      { 
        id: testUser._id, 
        email: testUser.email, 
        role: testUser.role,
        isEmailVerified: testUser.isEmailVerified,
        accountStatus: testUser.accountStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { 
        id: adminUser._id, 
        email: adminUser.email, 
        role: adminUser.role,
        isEmailVerified: adminUser.isEmailVerified,
        accountStatus: adminUser.accountStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('Login Endpoint with Valid Credentials', () => {
    it('should login successfully with correct email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('Protected Route Access with Valid JWT Tokens', () => {
    it('should access protected route with valid user token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(testUser._id.toString());
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token format.');
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject access with expired token', async () => {
      const expiredToken = jwt.sign(
        { 
          id: testUser._id, 
          email: testUser.email, 
          role: testUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token has expired. Please login again.');
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Admin Role Requirements for Admin Endpoints', () => {
    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Administrator privileges required.');
      expect(response.body.code).toBe('ADMIN_REQUIRED');
    });

    it('should deny unauthenticated access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });
  });

  describe('Token Validation Edge Cases', () => {
    it('should reject token with invalid payload structure', async () => {
      const invalidToken = jwt.sign(
        { invalidPayload: true }, // Missing required fields
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token payload.');
      expect(response.body.code).toBe('INVALID_TOKEN_PAYLOAD');
    });

    it('should reject token for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidUserToken = jwt.sign(
        { 
          id: nonExistentUserId, 
          email: 'nonexistent@example.com', 
          role: 'user' 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidUserToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token. User not found.');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('Account Status Validation', () => {
    it('should reject access for inactive account', async () => {
      // Create inactive user
      const inactiveUser = await User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'active',
        isActive: false
      });

      const inactiveToken = jwt.sign(
        { 
          id: inactiveUser._id, 
          email: inactiveUser.email, 
          role: inactiveUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated. Please contact support.');
      expect(response.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('should reject access for suspended account', async () => {
      // Create suspended user
      const suspendedUser = await User.create({
        firstName: 'Suspended',
        lastName: 'User',
        email: 'suspended@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'suspended',
        isActive: true
      });

      const suspendedToken = jwt.sign(
        { 
          id: suspendedUser._id, 
          email: suspendedUser.email, 
          role: suspendedUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${suspendedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is suspended. Please contact support.');
      expect(response.body.code).toBe('ACCOUNT_SUSPENDED');
    });
  });
});