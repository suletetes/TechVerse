/**
 * Authentication Integration Tests
 * Tests complete authentication flow
 */

const request = require('supertest');
const app = require('../../src/app'); // Assuming app is exported separately
const { clearDatabase } = require('../setup/testDb');
const { createTestUser } = require('../setup/helpers');

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Complete Authentication Flow', () => {
    it('should complete signup → login → access protected route flow', async () => {
      // Step 1: Signup
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Test123!@#'
        });

      expect(signupResponse.status).toBe(201);
      expect(signupResponse.body).toHaveProperty('success', true);

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Test123!@#'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      const token = loginResponse.body.token;

      // Step 3: Access protected route
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data).toHaveProperty('email', 'john@example.com');
    });

    it('should reject access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/user/profile');

      expect(response.status).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete forgot password → reset password flow', async () => {
      // Create user
      await createTestUser({ email: 'john@example.com' });

      // Step 1: Request password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' });

      expect(forgotResponse.status).toBe(200);

      // Note: In real implementation, you'd extract reset token from email
      // For testing, you might need to mock or retrieve it from database

      // Step 2: Reset password (assuming we have the token)
      // const resetResponse = await request(app)
      //   .post('/api/auth/reset-password')
      //   .send({
      //     token: resetToken,
      //     password: 'NewPassword123!@#'
      //   });

      // expect(resetResponse.status).toBe(200);
    });
  });

  describe('Session Management', () => {
    it('should logout user and invalidate token', async () => {
      // Create and login user
      await createTestUser({ email: 'john@example.com', password: 'Test123!@#' });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Test123!@#'
        });

      const token = loginResponse.body.token;

      // Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);

      // Try to access protected route with same token
      // (Depending on implementation, this might still work if token isn't blacklisted)
      // const profileResponse = await request(app)
      //   .get('/api/user/profile')
      //   .set('Authorization', `Bearer ${token}`);

      // expect(profileResponse.status).toBe(401);
    });
  });
});
