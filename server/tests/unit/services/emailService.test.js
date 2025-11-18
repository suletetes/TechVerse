/**
 * Email Service Unit Tests
 * Tests for email service with mocked nodemailer
 */

const emailService = require('../../../src/services/emailService');

// Mock nodemailer
jest.mock('nodemailer');
const nodemailer = require('nodemailer');

describe('Email Service', () => {
  let mockSendMail;

  beforeEach(() => {
    // Setup mock transporter
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email'
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email',
          text: 'This is a test email'
        })
      );
      expect(result).toHaveProperty('messageId');
    });

    it('should handle email sending errors', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP Error'));

      const emailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email'
      };

      await expect(emailService.sendEmail(emailOptions)).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct template', async () => {
      const user = {
        email: 'newuser@example.com',
        firstName: 'John'
      };

      await emailService.sendWelcomeEmail(user);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: expect.stringContaining('Welcome')
        })
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token', async () => {
      const user = {
        email: 'user@example.com',
        firstName: 'John'
      };
      const resetToken = 'test-reset-token';

      await emailService.sendPasswordResetEmail(user, resetToken);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Password Reset')
        })
      );
    });
  });

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email', async () => {
      const order = {
        orderNumber: 'ORD-12345',
        user: {
          email: 'customer@example.com',
          firstName: 'Jane'
        },
        total: 999.99,
        items: []
      };

      await emailService.sendOrderConfirmationEmail(order);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('Order Confirmation')
        })
      );
    });
  });
});
