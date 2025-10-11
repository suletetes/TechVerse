import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import authController from '../../controllers/authController.js';
import { User } from '../../models/index.js';
import emailService from '../../services/emailService.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Mock services
vi.mock('../../services/emailService.js', () => ({
  default: {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendWelcomeEmail: vi.fn()
  }
}));

vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Auth Controller', () => {
  let app;
  let mongoServer;
  let testUser;

  beforeEach(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Auth routes
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    app.post('/logout', authController.logout);
    app.get('/profile', authController.getProfile);
    app.put('/profile', authController.updateProfile);
    app.post('/change-password', authController.changePassword);
    app.post('/forgot-password', authController.forgotPassword);
    app.post('/reset-password', authController.resetPassword);
    app.get('/verify-email/:token', authController.verifyEmail);
    app.post('/resend-verification', authController.resendVerification);
    app.post('/refresh-token', authController.refreshToken);
    
    app.use(errorHandler);

    // Create test user
    testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    };

    vi.clearAllMocks();
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toMatchObject({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        role: testUser.role
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();

      // Verify user was created in database
      const createdUser = await User.findOne({ email: testUser.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.isEmailVerified).toBe(false);
    });

    it('should send verification email on registration', async () => {
      await request(app)
        .post('/register')
        .send(testUser)
        .expect(201);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should return error for duplicate email', async () => {
      // Create user first
      await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12)
      });

      const response = await request(app)
        .post('/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidUser = { email: 'test@example.com' };

      const response = await request(app)
        .post('/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should validate email format', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const weakPasswordUser = {
        ...testUser,
        password: '123'
      };

      const response = await request(app)
        .post('/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create verified user for login tests
      await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: true
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: testUser.password
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return error for unverified email', async () => {
      // Create unverified user
      await User.create({
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@example.com',
        password: await bcrypt.hash('password123', 12),
        isEmailVerified: false
      });

      const loginData = {
        email: 'unverified@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('verify');
    });

    it('should handle account lockout', async () => {
      const user = await User.findOne({ email: testUser.email });
      user.accountLocked = true;
      user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save();

      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('locked');
    });

    it('should increment login attempts on failed login', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      await request(app)
        .post('/login')
        .send(loginData)
        .expect(401);

      const user = await User.findOne({ email: testUser.email });
      expect(user.loginAttempts).toBe(1);
    });
  });

  describe('POST /logout', () => {
    let authToken;

    beforeEach(async () => {
      const user = await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: true
      });

      authToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should work without authentication token', async () => {
      const response = await request(app)
        .post('/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: true
      });
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should rate limit password reset requests', async () => {
      // Make multiple requests
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/forgot-password')
          .send({ email: testUser.email });
      }

      const response = await request(app)
        .post('/forgot-password')
        .send({ email: testUser.email })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('rate');
    });
  });

  describe('POST /reset-password', () => {
    let resetToken;
    let user;

    beforeEach(async () => {
      user = await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: true
      });

      resetToken = user.createPasswordResetToken();
      await user.save();
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';

      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');

      // Verify password was changed
      const updatedUser = await User.findById(user._id);
      const isValidPassword = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isValidPassword).toBe(true);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalid');
    });

    it('should return error for expired token', async () => {
      // Expire the token
      user.passwordResetExpires = Date.now() - 1000;
      await user.save();

      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .post('/reset-password')
        .send({
          token: resetToken,
          password: '123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /verify-email/:token', () => {
    let verificationToken;
    let user;

    beforeEach(async () => {
      user = await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: false
      });

      verificationToken = user.createEmailVerificationToken();
      await user.save();
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get(`/verify-email/${verificationToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');

      // Verify user is now verified
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).toBe(true);
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/verify-email/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalid');
    });

    it('should return error for expired token', async () => {
      // Expire the token
      user.emailVerificationExpires = Date.now() - 1000;
      await user.save();

      const response = await request(app)
        .get(`/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should handle already verified email', async () => {
      // Verify email first
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      const response = await request(app)
        .get(`/verify-email/${verificationToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already');
    });
  });

  describe('POST /refresh-token', () => {
    let refreshToken;
    let user;

    beforeEach(async () => {
      user = await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: true
      });

      refreshToken = jwt.sign(
        { id: user._id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
        { expiresIn: '7d' }
      );

      user.refreshTokens.push({
        token: refreshToken,
        createdAt: new Date()
      });
      await user.save();
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return error for expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { id: user._id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
        { expiresIn: '-1d' }
      );

      const response = await request(app)
        .post('/refresh-token')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Features', () => {
    it('should hash passwords before saving', async () => {
      const response = await request(app)
        .post('/register')
        .send(testUser)
        .expect(201);

      const user = await User.findOne({ email: testUser.email });
      expect(user.password).not.toBe(testUser.password);
      expect(user.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should not return password in responses', async () => {
      const response = await request(app)
        .post('/register')
        .send(testUser)
        .expect(201);

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should generate secure tokens', async () => {
      await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 12),
        isEmailVerified: true
      });

      const response = await request(app)
        .post('/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      const user = await User.findOne({ email: testUser.email });
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetToken.length).toBeGreaterThan(20);
    });

    it('should validate JWT tokens properly', async () => {
      const invalidToken = 'invalid.jwt.token';

      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for sensitive endpoints', async () => {
      // Test login rate limiting
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/login')
          .send(loginData);
      }

      const response = await request(app)
        .post('/login')
        .send(loginData)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('rate');
    });
  });
});