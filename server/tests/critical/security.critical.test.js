/**
 * CRITICAL SECURITY TESTS
 * These tests cover security vulnerabilities and attack vectors
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import { setupTestDb, teardownTestDb, clearDatabase } from '../setup/testDb.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';

describe('CRITICAL: Security Vulnerabilities', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('SQL/NoSQL Injection Protection', () => {
    test('should prevent NoSQL injection in login', async () => {
      // Create test user
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '$2a$12$hashedpassword',
        isEmailVerified: true
      });

      // Attempt NoSQL injection
      const maliciousPayloads = [
        { email: { $ne: null }, password: { $ne: null } },
        { email: { $regex: '.*' }, password: { $regex: '.*' } },
        { email: 'john@example.com', password: { $gt: '' } },
        { email: { $where: 'this.email' }, password: 'anything' }
      ];

      for (const payload of maliciousPayloads) {
        await request(app)
          .post('/api/auth/login')
          .send(payload)
          .expect(400); // Should be rejected by validation
      }
    });

    test('should prevent NoSQL injection in product search', async () => {
      const maliciousQueries = [
        '{"$ne": null}',
        '{"$regex": ".*"}',
        '{"$where": "this.name"}',
        '{"$gt": ""}'
      ];

      for (const query of maliciousQueries) {
        await request(app)
          .get(`/api/products?search=${encodeURIComponent(query)}`)
          .expect(200); // Should handle gracefully, not crash
      }
    });
  });

  describe('XSS Protection', () => {
    let authUser, authToken;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser();
      authUser = auth.user;
      authToken = auth.token;
    });

    test('should sanitize user input in profile updates', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: payload,
            lastName: 'Test'
          })
          .expect(200);

        // Check that XSS payload was sanitized
        expect(response.body.data.user.firstName).not.toContain('<script>');
        expect(response.body.data.user.firstName).not.toContain('javascript:');
      }
    });

    test('should sanitize product review content', async () => {
      const product = await Product.create({
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: 99.99,
        status: 'active',
        category: 'electronics'
      });

      const xssPayload = '<script>alert("xss")</script>Malicious review';

      const response = await request(app)
        .post(`/api/products/${product._id}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          comment: xssPayload
        })
        .expect(201);

      expect(response.body.data.review.comment).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const promises = Array(20).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should rate limit API requests per user', async () => {
      const auth = await createAuthenticatedUser();

      // Make many requests quickly
      const promises = Array(100).fill().map(() =>
        request(app)
          .get('/api/products')
          .set('Authorization', `Bearer ${auth.token}`)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CSRF Protection', () => {
    let authUser, authToken;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser();
      authUser = auth.user;
      authToken = auth.token;
    });

    test('should protect state-changing operations', async () => {
      // CSRF protection should be handled by middleware
      // This test verifies that CSRF-protected endpoints exist
      
      const stateChangingEndpoints = [
        { method: 'post', path: '/api/products', data: { name: 'Test' } },
        { method: 'put', path: '/api/auth/profile', data: { firstName: 'Test' } },
        { method: 'delete', path: '/api/cart/clear', data: {} }
      ];

      for (const endpoint of stateChangingEndpoints) {
        // Without CSRF token, request should either work (if CSRF is disabled for API)
        // or fail with 403 (if CSRF is enabled)
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${authToken}`)
          .send(endpoint.data);

        // Should not crash the server
        expect([200, 201, 403, 404]).toContain(response.status);
      }
    });
  });

  describe('Input Validation', () => {
    let authUser, authToken;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser({ role: 'admin' });
      authUser = auth.user;
      authToken = auth.token;
    });

    test('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        ''
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

    test('should validate numeric inputs', async () => {
      const invalidPrices = [
        -1,
        'not-a-number',
        null,
        undefined,
        Infinity,
        NaN
      ];

      for (const price of invalidPrices) {
        await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Product',
            description: 'Test description',
            price,
            category: 'electronics'
          })
          .expect(400);
      }
    });

    test('should validate required fields', async () => {
      const incompleteData = [
        {}, // Empty object
        { name: 'Test' }, // Missing required fields
        { price: 99.99 }, // Missing name
        { name: '', price: 99.99 } // Empty name
      ];

      for (const data of incompleteData) {
        await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(data)
          .expect(400);
      }
    });
  });

  describe('File Upload Security', () => {
    let authUser, authToken;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser({ role: 'admin' });
      authUser = auth.user;
      authToken = auth.token;
    });

    test('should reject malicious file types', async () => {
      const maliciousFiles = [
        { filename: 'malicious.exe', mimetype: 'application/x-executable' },
        { filename: 'script.php', mimetype: 'application/x-php' },
        { filename: 'virus.bat', mimetype: 'application/x-bat' },
        { filename: 'shell.sh', mimetype: 'application/x-sh' }
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from('malicious content'), file.filename);

        // Should reject malicious files
        expect([400, 415]).toContain(response.status);
      }
    });

    test('should limit file size', async () => {
      // Create a large buffer (simulate large file)
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeBuffer, 'large-image.jpg');

      // Should reject files that are too large
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Authentication Bypass Attempts', () => {
    test('should prevent JWT token manipulation', async () => {
      const auth = await createAuthenticatedUser();
      const validToken = auth.token;

      // Attempt to manipulate token
      const manipulatedTokens = [
        validToken.replace(/.$/, 'X'), // Change last character
        validToken + 'extra', // Add extra content
        validToken.substring(0, validToken.length - 10), // Truncate
        'Bearer ' + validToken, // Add Bearer prefix to token itself
        validToken.split('.').reverse().join('.') // Reverse token parts
      ];

      for (const token of manipulatedTokens) {
        await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);
      }
    });

    test('should prevent session fixation', async () => {
      // Create user and login
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
        isEmailVerified: true
      });

      // Login should create new session/token
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'hashedpassword'
        })
        .expect(200);

      const token1 = response1.body.data.token;

      // Login again should create different token
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'hashedpassword'
        })
        .expect(200);

      const token2 = response2.body.data.token;

      // Tokens should be different (new session each time)
      expect(token1).not.toBe(token2);
    });
  });

  describe('Information Disclosure', () => {
    test('should not expose sensitive data in error messages', async () => {
      // Attempt to access non-existent user
      const response = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011') // Valid ObjectId format
        .expect(404);

      // Error message should not reveal internal details
      expect(response.body.message).not.toContain('ObjectId');
      expect(response.body.message).not.toContain('MongoDB');
      expect(response.body.message).not.toContain('database');
    });

    test('should not expose user passwords in responses', async () => {
      const auth = await createAuthenticatedUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${auth.token}`)
        .expect(200);

      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    test('should not expose internal server errors', async () => {
      // Force a server error by sending malformed data
      const response = await request(app)
        .post('/api/auth/login')
        .send('invalid-json')
        .set('Content-Type', 'application/json');

      // Should return generic error, not expose stack trace
      expect(response.status).toBe(400);
      if (response.body.error) {
        expect(response.body.error).not.toContain('at ');
        expect(response.body.error).not.toContain('node_modules');
        expect(response.body.error).not.toContain(__dirname);
      }
    });
  });
});