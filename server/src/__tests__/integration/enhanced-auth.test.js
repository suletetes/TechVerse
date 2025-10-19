import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../server.js';
import { User } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';

describe('Enhanced Authentication Integration Tests', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let mfaSecret;

  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
    process.env.JWT_EXPIRE = '15m';
    process.env.JWT_REFRESH_EXPIRE = '7d';

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
      isActive: true,
      twoFactorEnabled: false
    });

    // Generate MFA secret for testing
    mfaSecret = speakeasy.generateSecret({
      name: 'TechVerse Test',
      issuer: 'TechVerse'
    });
  });

  describe('Enhanced Login Flow', () => {
    it('should login successfully with enhanced authentication', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123',
          rememberMe: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.sessionId).toBeDefined();
      expect(response.body.data.session.currentSessions).toBe(1);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should require MFA token when MFA is enabled', async () => {
      // Enable MFA for test user
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret.base32
      });

      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.requiresMFA).toBe(true);
      expect(response.body.data.tempToken).toBeDefined();
    });

    it('should login successfully with valid MFA token', async () => {
      // Enable MFA for test user
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret.base32
      });

      // Generate valid MFA token
      const mfaToken = speakeasy.totp({
        secret: mfaSecret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123',
          mfaToken: mfaToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.mfaEnabled).toBe(true);
    });

    it('should reject invalid MFA token', async () => {
      // Enable MFA for test user
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret.base32
      });

      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123',
          mfaToken: '123456' // Invalid token
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_MFA_TOKEN');
    });
  });

  describe('Token Refresh with Rotation', () => {
    let refreshToken;
    let accessToken;

    beforeEach(async () => {
      // Login to get initial tokens
      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
      
      // Extract refresh token from cookie
      const cookies = loginResponse.headers['set-cookie'];
      const refreshCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
      refreshToken = refreshCookie.split('=')[1].split(';')[0];
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.accessToken).not.toBe(accessToken);
      expect(response.body.data.user).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should reject reused refresh token', async () => {
      // Use refresh token once
      await request(app)
        .post('/api/auth/enhanced-refresh')
        .send({ refreshToken })
        .expect(200);

      // Try to use the same token again
      const response = await request(app)
        .post('/api/auth/enhanced-refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('MFA Management', () => {
    let userToken;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      userToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should setup MFA for user', async () => {
      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.secret).toBeDefined();
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.manualEntryKey).toBeDefined();
    });

    it('should enable MFA with valid verification token', async () => {
      // Setup MFA first
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`);

      const secret = setupResponse.body.data.secret;

      // Generate verification token
      const verificationToken = speakeasy.totp({
        secret: secret,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/api/auth/mfa/enable')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          secret: secret,
          verificationToken: verificationToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backupCodes).toBeDefined();
      expect(response.body.data.backupCodes).toHaveLength(10);
    });

    it('should reject MFA enable with invalid verification token', async () => {
      const setupResponse = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`);

      const secret = setupResponse.body.data.secret;

      const response = await request(app)
        .post('/api/auth/mfa/enable')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          secret: secret,
          verificationToken: '123456' // Invalid token
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MFA_ENABLE_FAILED');
    });

    it('should disable MFA with valid credentials', async () => {
      // First enable MFA
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret.base32
      });

      // Generate valid MFA token
      const mfaToken = speakeasy.totp({
        secret: mfaSecret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/api/auth/mfa/disable')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'Password123',
          mfaToken: mfaToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('disabled');
    });

    it('should generate new backup codes', async () => {
      // Enable MFA first
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret.base32
      });

      // Generate valid MFA token
      const mfaToken = speakeasy.totp({
        secret: mfaSecret.base32,
        encoding: 'base32'
      });

      const response = await request(app)
        .post('/api/auth/mfa/backup-codes')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mfaToken: mfaToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.backupCodes).toBeDefined();
      expect(response.body.data.backupCodes).toHaveLength(10);
    });
  });

  describe('Session Management', () => {
    let userToken;
    let sessionId;

    beforeEach(async () => {
      // Login to get access token and session
      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      userToken = loginResponse.body.data.tokens.accessToken;
      sessionId = loginResponse.body.data.tokens.sessionId;
    });

    it('should get active sessions', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(response.body.data.totalSessions).toBe(1);
      expect(response.body.data.sessions[0].isCurrent).toBe(true);
    });

    it('should create multiple sessions with concurrent limit', async () => {
      // Create additional sessions
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const loginResponse = await request(app)
          .post('/api/auth/enhanced-login')
          .send({
            email: testUser.email,
            password: 'Password123'
          });
        sessions.push(loginResponse.body.data.tokens);
      }

      // Check total sessions
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${sessions[0].accessToken}`)
        .expect(200);

      expect(response.body.data.totalSessions).toBe(4); // Original + 3 new
    });

    it('should revoke all other sessions', async () => {
      // Create additional session
      await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      const response = await request(app)
        .post('/api/auth/sessions/revoke-all')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revokedSessions).toBe(1);

      // Check remaining sessions
      const sessionsResponse = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(sessionsResponse.body.data.totalSessions).toBe(1);
    });

    it('should logout from current session', async () => {
      const response = await request(app)
        .post('/api/auth/enhanced-logout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ logoutAll: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');

      // Token should be invalid after logout
      await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);
    });

    it('should logout from all sessions', async () => {
      // Create additional session
      const additionalLogin = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      const response = await request(app)
        .post('/api/auth/enhanced-logout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ logoutAll: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('all sessions');

      // Both tokens should be invalid
      await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${additionalLogin.body.data.tokens.accessToken}`)
        .expect(401);
    });
  });

  describe('Security Overview', () => {
    let userToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      userToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should get security overview', async () => {
      const response = await request(app)
        .get('/api/auth/security')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mfa).toBeDefined();
      expect(response.body.data.sessions).toBeDefined();
      expect(response.body.data.account).toBeDefined();
      expect(response.body.data.mfa.enabled).toBe(false);
      expect(response.body.data.sessions.active).toBe(1);
    });

    it('should show MFA status when enabled', async () => {
      // Enable MFA
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true,
        twoFactorSecret: mfaSecret.base32,
        backupCodes: ['CODE1', 'CODE2', 'CODE3']
      });

      const response = await request(app)
        .get('/api/auth/security')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.mfa.enabled).toBe(true);
      expect(response.body.data.mfa.backupCodesCount).toBe(3);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid session ID format', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      const userToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .delete('/api/auth/sessions/invalid-session-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle account lockout during enhanced login', async () => {
      // Simulate locked account
      await User.findByIdAndUpdate(testUser._id, {
        loginAttempts: 5,
        lockUntil: Date.now() + 60000 // 1 minute
      });

      const response = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCOUNT_LOCKED');
    });

    it('should handle MFA setup when already enabled', async () => {
      // Enable MFA first
      await User.findByIdAndUpdate(testUser._id, {
        twoFactorEnabled: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/enhanced-login')
        .send({
          email: testUser.email,
          password: 'Password123'
        });

      const userToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .post('/api/auth/mfa/setup')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MFA_ALREADY_ENABLED');
    });
  });
});