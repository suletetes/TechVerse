import express from 'express';
import { body, query } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/passportAuth.js';
import { validate } from '../middleware/validation.js';
import emailService from '../services/emailService.js';
import { emailQueue } from '../middleware/emailNotifications.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import { auditAdminAction } from '../middleware/adminAuditLogger.js';

const router = express.Router();

// Validation rules
const sendTestEmailValidation = [
  body('to')
    .isEmail()
    .withMessage('Valid email address is required'),
  body('template')
    .isIn(['welcome', 'orderConfirmation', 'orderStatusUpdate', 'passwordReset', 'emailVerification', 'lowStockAlert', 'adminNotification'])
    .withMessage('Invalid email template'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object')
];

const sendBulkEmailValidation = [
  body('recipients')
    .isArray({ min: 1, max: 100 })
    .withMessage('Recipients must be an array with 1-100 email addresses'),
  body('recipients.*')
    .isEmail()
    .withMessage('All recipients must be valid email addresses'),
  body('template')
    .isIn(['welcome', 'orderConfirmation', 'orderStatusUpdate', 'passwordReset', 'emailVerification', 'lowStockAlert', 'adminNotification'])
    .withMessage('Invalid email template'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must not exceed 200 characters')
];

/**
 * @desc    Send test email
 * @route   POST /api/email/test
 * @access  Private (Admin only)
 */
router.post('/test', 
  authenticate,
  requireAdmin,
  sendTestEmailValidation,
  validate,
  auditAdminAction('EMAIL_TEST'),
  async (req, res, next) => {
    try {
      const { to, template, data = {}, subject } = req.body;

      // Add test data based on template
      let testData = { ...data };
      
      switch (template) {
        case 'welcome':
          testData = {
            firstName: 'John',
            lastName: 'Doe',
            email: to,
            verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=test-token`,
            ...testData
          };
          break;
        case 'orderConfirmation':
          testData = {
            firstName: 'John',
            orderNumber: 'TEST-12345',
            orderDate: new Date().toLocaleDateString(),
            items: [
              { name: 'Test Product', quantity: 1, price: 99.99, sku: 'TEST-001' }
            ],
            subtotal: 99.99,
            tax: 8.00,
            shipping: { cost: 9.99, method: 'Standard' },
            total: 117.98,
            trackingUrl: `${process.env.CLIENT_URL}/orders/test-order`,
            ...testData
          };
          break;
        case 'orderStatusUpdate':
          testData = {
            firstName: 'John',
            orderNumber: 'TEST-12345',
            status: 'shipped',
            statusMessage: 'Your order has been shipped and is on its way!',
            trackingNumber: 'TEST123456789',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            trackingUrl: `${process.env.CLIENT_URL}/orders/test-order`,
            ...testData
          };
          break;
        case 'passwordReset':
          testData = {
            firstName: 'John',
            resetUrl: `${process.env.CLIENT_URL}/reset-password?token=test-token`,
            expiryTime: '1 hour',
            ...testData
          };
          break;
        case 'emailVerification':
          testData = {
            firstName: 'John',
            email: to,
            verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=test-token`,
            ...testData
          };
          break;
        case 'lowStockAlert':
          testData = {
            productName: 'Test Product',
            productSku: 'TEST-001',
            currentStock: 3,
            lowStockThreshold: 10,
            productUrl: `${process.env.CLIENT_URL}/admin/products/test-product`,
            ...testData
          };
          break;
        case 'adminNotification':
          testData = {
            subject: subject || 'Test Admin Notification',
            message: 'This is a test admin notification to verify email functionality.',
            priority: 'info',
            timestamp: new Date().toLocaleString(),
            ...testData
          };
          break;
      }

      const result = await emailService.sendEmail({
        to,
        subject: subject || `Test Email - ${template}`,
        template,
        data: testData
      });

      enhancedLogger.info('Test email sent', {
        to,
        template,
        success: result.success,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl,
          template,
          recipient: to
        }
      });

    } catch (error) {
      enhancedLogger.error('Failed to send test email', {
        error: error.message,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @desc    Send bulk emails
 * @route   POST /api/email/bulk
 * @access  Private (Admin only)
 */
router.post('/bulk',
  authenticate,
  requireAdmin,
  sendBulkEmailValidation,
  validate,
  auditAdminAction('EMAIL_BULK_SEND'),
  async (req, res, next) => {
    try {
      const { recipients, template, subject, data = {} } = req.body;

      // Add emails to queue for processing
      const notifications = recipients.map(email => ({
        to: email,
        subject,
        template,
        data: {
          ...data,
          email // Add recipient email to template data
        }
      }));

      // Add to email queue
      notifications.forEach(notification => {
        emailQueue.add(notification);
      });

      enhancedLogger.info('Bulk emails queued', {
        recipientCount: recipients.length,
        template,
        subject,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(202).json({
        success: true,
        message: 'Bulk emails queued for processing',
        data: {
          recipientCount: recipients.length,
          template,
          subject,
          queueStatus: emailQueue.getStatus()
        }
      });

    } catch (error) {
      enhancedLogger.error('Failed to queue bulk emails', {
        error: error.message,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to queue bulk emails',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @desc    Get email queue status
 * @route   GET /api/email/queue/status
 * @access  Private (Admin only)
 */
router.get('/queue/status',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const status = emailQueue.getStatus();

      res.status(200).json({
        success: true,
        message: 'Email queue status retrieved',
        data: status
      });

    } catch (error) {
      enhancedLogger.error('Failed to get email queue status', {
        error: error.message,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get email queue status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @desc    Get available email templates
 * @route   GET /api/email/templates
 * @access  Private (Admin only)
 */
router.get('/templates',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const templates = [
        {
          name: 'welcome',
          description: 'Welcome email for new user registrations',
          requiredData: ['firstName', 'lastName', 'email', 'verificationUrl']
        },
        {
          name: 'orderConfirmation',
          description: 'Order confirmation email after purchase',
          requiredData: ['firstName', 'orderNumber', 'orderDate', 'items', 'total', 'trackingUrl']
        },
        {
          name: 'orderStatusUpdate',
          description: 'Order status update notifications',
          requiredData: ['firstName', 'orderNumber', 'status', 'statusMessage', 'trackingUrl']
        },
        {
          name: 'passwordReset',
          description: 'Password reset request email',
          requiredData: ['firstName', 'resetUrl', 'expiryTime']
        },
        {
          name: 'emailVerification',
          description: 'Email address verification',
          requiredData: ['firstName', 'email', 'verificationUrl']
        },
        {
          name: 'lowStockAlert',
          description: 'Low stock alert for administrators',
          requiredData: ['productName', 'productSku', 'currentStock', 'lowStockThreshold', 'productUrl']
        },
        {
          name: 'adminNotification',
          description: 'General admin notification template',
          requiredData: ['subject', 'message', 'timestamp']
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Email templates retrieved',
        data: {
          templates,
          count: templates.length
        }
      });

    } catch (error) {
      enhancedLogger.error('Failed to get email templates', {
        error: error.message,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get email templates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @desc    Get email service status
 * @route   GET /api/email/status
 * @access  Private (Admin only)
 */
router.get('/status',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const status = {
        initialized: emailService.isInitialized,
        environment: process.env.NODE_ENV,
        service: process.env.EMAIL_SERVICE || 'ethereal',
        queueStatus: emailQueue.getStatus(),
        templatesLoaded: emailService.templates ? emailService.templates.size : 0
      };

      res.status(200).json({
        success: true,
        message: 'Email service status retrieved',
        data: status
      });

    } catch (error) {
      enhancedLogger.error('Failed to get email service status', {
        error: error.message,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get email service status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

export default router;