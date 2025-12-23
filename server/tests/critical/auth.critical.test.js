/**
 * CRITICAL AUTHENTICATION TESTS
 * These tests cover security-critical authentication flows
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../../src/models/User.js';
import { setupTestDb, teardownTestDb, clearDatabase } from '../setup/testDb.js';

describe('CRITICAL: Authentication Security', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('User Registration Security', () => {
    test('should hash passwords before storing', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findById(response.body.data.user._id);
      expect(user.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Duplicate registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    test('should enforce password complexity', async () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'Password',
        'Password1'
      ];

      for (const password of weakPasswords) {
        await request(app)
          .post('/api/auth/register')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email: `test${Math.random()}@example.com`,
            password,
            confirmPassword: password
          })
          .expect(400);
      }
    });
  });

  describe('Login Security', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('SecurePass123!', 12),
        isEmailVerified: true
      });
    });

    test('should authenticate valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword'
        })
        .expect(401);
    });

    test('should reject login for non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123!'
        })
        .expect(401);
    });

    test('should generate valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      const token = response.body.data.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
    });
  });

  describe('JWT Token Security', () => {
    let testUser, validToken;

    beforeEach(async () => {
      testUser = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('SecurePass123!', 12),
        isEmailVerified: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecurePass123!'
        });

      validToken = loginResponse.body.data.token;
    });

    test('should protect routes with valid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });

    test('should reject requests without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    test('should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Password Reset Security', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('SecurePass123!', 12),
        isEmailVerified: true
      });
    });

    test('should not reveal if email exists', async () => {
      // Valid email
      const response1 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' })
        .expect(200);

      // Invalid email
      const response2 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Both should return same message
      expect(response1.body.message).toBe(response2.body.message);
    });
  });
});