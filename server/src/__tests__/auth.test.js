import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../../server.js';
import { User } from '../models/index.js';

describe('Authentication Flow Tests', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
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
      process.env.JWT_SECRET || 'test-secret',
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
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Login Endpoint Tests', () => {
    it('should login with valid credentials', async () => {
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

    it('should reject invalid credentials', async () => {
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

    it('should reject non-existent user', async () => {
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

    it('should reject login for inactive account', async () => {
      // Create inactive user
      await User.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'active',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated. Please contact support.');
    });

    it('should reject login for suspended account', async () => {
      // Create suspended user
      await User.create({
        firstName: 'Suspended',
        lastName: 'User',
        email: 'suspended@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'suspended',
        isActive: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'suspended@example.com',
          password: 'Password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is suspended. Please contact support.');
    });
  });

  describe('Protected Route Access Tests', () => {
    it('should access protected route with valid JWT token', async () => {
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
        process.env.JWT_SECRET || 'test-secret',
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

    it('should reject access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });
  });

  describe('Admin Role Requirements Tests', () => {
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

    it('should allow admin to access user management endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to user management', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ADMIN_REQUIRED');
    });
  });

  describe('Token Validation Edge Cases', () => {
    it('should reject token with invalid payload structure', async () => {
      const invalidToken = jwt.sign(
        { invalidPayload: true }, // Missing required fields
        process.env.JWT_SECRET || 'test-secret',
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
        process.env.JWT_SECRET || 'test-secret',
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

    it('should handle very short invalid tokens', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer abc')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token format.');
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Account Status Validation', () => {
    it('should reject access for locked account', async () => {
      // Create locked user
      const lockedUser = await User.create({
        firstName: 'Locked',
        lastName: 'User',
        email: 'locked@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'active',
        isActive: true,
        lockUntil: Date.now() + 15 * 60 * 1000 // Locked for 15 minutes
      });

      const lockedToken = jwt.sign(
        { 
          id: lockedUser._id, 
          email: lockedUser.email, 
          role: lockedUser.role 
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${lockedToken}`)
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Account is temporarily locked');
      expect(response.body.code).toBe('ACCOUNT_LOCKED');
    });

    it('should reject access for unverified email', async () => {
      // Create unverified user
      const unverifiedUser = await User.create({
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: false,
        accountStatus: 'pending',
        isActive: true
      });

      const unverifiedToken = jwt.sign(
        { 
          id: unverifiedUser._id, 
          email: unverifiedUser.email, 
          role: unverifiedUser.role 
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please verify your email address to activate your account.');
      expect(response.body.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('should reject access for closed account', async () => {
      // Create closed account user
      const closedUser = await User.create({
        firstName: 'Closed',
        lastName: 'User',
        email: 'closed@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user',
        isEmailVerified: true,
        accountStatus: 'closed',
        isActive: true
      });

      const closedToken = jwt.sign(
        { 
          id: closedUser._id, 
          email: closedUser.email, 
          role: closedUser.role 
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${closedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account has been closed. Please contact support.');
      expect(response.body.code).toBe('ACCOUNT_CLOSED');
    });
  });

  describe('Profile Management Tests', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(testUser._id.toString());
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Name');
      expect(response.body.data.user.phone).toBe('+1234567890');
    });

    it('should reject profile update without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });
  });

  describe('Password Change Tests', () => {
    it('should change password with valid current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify new password works for login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should reject password change with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
      expect(response.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('should reject password change without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No valid token provided.');
    });
  });

  describe('Logout Tests', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should logout without authentication (stateless)', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});