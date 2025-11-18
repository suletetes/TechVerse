/**
 * Auth Controller Unit Tests
 * Tests for authentication controller functions
 */

const authController = require('../../../src/controllers/authController');
const User = require('../../../src/models/User');
const { mockRequest, mockResponse, mockNext, createTestUser } = require('../../setup/helpers');
const { clearDatabase } = require('../../setup/testDb');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      const req = mockRequest({
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Test123!@#'
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.signup(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );

      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe('John');
    });

    it('should return error for duplicate email', async () => {
      await createTestUser({ email: 'john@example.com' });

      const req = mockRequest({
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'Test123!@#'
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate required fields', async () => {
      const req = mockRequest({
        body: {
          email: 'john@example.com'
          // Missing required fields
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const user = await createTestUser({
        email: 'john@example.com',
        password: 'Test123!@#'
      });

      const req = mockRequest({
        body: {
          email: 'john@example.com',
          password: 'Test123!@#'
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String),
          user: expect.objectContaining({
            email: 'john@example.com'
          })
        })
      );
    });

    it('should return error for incorrect password', async () => {
      await createTestUser({
        email: 'john@example.com',
        password: 'Test123!@#'
      });

      const req = mockRequest({
        body: {
          email: 'john@example.com',
          password: 'WrongPassword123'
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return error for non-existent user', async () => {
      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'Test123!@#'
        }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const user = await createTestUser();
      const req = mockRequest({ user });
      const res = mockResponse();
      const next = mockNext();

      await authController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const user = await createTestUser({ email: 'john@example.com' });

      const req = mockRequest({
        body: { email: 'john@example.com' }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('reset')
        })
      );
    });

    it('should handle non-existent email gracefully', async () => {
      const req = mockRequest({
        body: { email: 'nonexistent@example.com' }
      });
      const res = mockResponse();
      const next = mockNext();

      await authController.forgotPassword(req, res, next);

      // Should still return success for security reasons
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
