import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import enhancedLogger from '../utils/enhancedLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Service for TechVerse Platform
 * Handles all email notifications with template support
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize email service with configuration
   */
  async initialize() {
    try {
      // Create transporter based on environment
      if (process.env.NODE_ENV === 'production') {
        // Production configuration (e.g., SendGrid, AWS SES, etc.)
        this.transporter = nodemailer.createTransporter({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          },
          secure: true,
          port: 465
        });
      } else {
        // Development configuration (Ethereal for testing)
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        enhancedLogger.info('Email service initialized with test account', {
          user: testAccount.user,
          password: testAccount.pass,
          previewUrl: 'https://ethereal.email'
        });
      }

      // Verify transporter
      await this.transporter.verify();
      this.isInitialized = true;

      // Load email templates
      await this.loadTemplates();

      enhancedLogger.info('Email service initialized successfully', {
        environment: process.env.NODE_ENV,
        service: process.env.EMAIL_SERVICE || 'ethereal'
      });

    } catch (error) {
      enhancedLogger.error('Failed to initialize email service', {
        error: error.message,
        stack: error.stack
      });
      
      // Continue without email service in development
      if (process.env.NODE_ENV !== 'production') {
        enhancedLogger.warn('Email service disabled - continuing without email functionality');
        this.isInitialized = false;
      } else {
        throw error;
      }
    }
  }

  /**
   * Load email templates from filesystem
   */
  async loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    
    try {
      await fs.mkdir(templatesDir, { recursive: true });
      
      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          const templateName = path.parse(file).name;
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          
          this.templates.set(templateName, handlebars.compile(templateContent));
          
          enhancedLogger.debug('Email template loaded', {
            templateName,
            templatePath
          });
        }
      }

      // Create default templates if none exist
      if (this.templates.size === 0) {
        await this.createDefaultTemplates();
      }

    } catch (error) {
      enhancedLogger.warn('Failed to load email templates', {
        error: error.message,
        templatesDir
      });
      
      // Create default templates
      await this.createDefaultTemplates();
    }
  }

  /**
   * Create default email templates
   */
  async createDefaultTemplates() {
    const defaultTemplates = {
      welcome: this.getWelcomeTemplate(),
      orderConfirmation: this.getOrderConfirmationTemplate(),
      orderStatusUpdate: this.getOrderStatusUpdateTemplate(),
      passwordReset: this.getPasswordResetTemplate(),
      emailVerification: this.getEmailVerificationTemplate(),
      lowStockAlert: this.getLowStockAlertTemplate(),
      adminNotification: this.getAdminNotificationTemplate()
    };

    for (const [name, template] of Object.entries(defaultTemplates)) {
      this.templates.set(name, handlebars.compile(template));
    }

    enhancedLogger.info('Default email templates created', {
      templateCount: Object.keys(defaultTemplates).length
    });
  }

  /**
   * Send email with template
   */
  async sendEmail(options) {
    if (!this.isInitialized) {
      enhancedLogger.warn('Email service not initialized - email not sent', {
        to: options.to,
        subject: options.subject
      });
      return { success: false, message: 'Email service not available' };
    }

    try {
      const {
        to,
        subject,
        template,
        data = {},
        attachments = [],
        priority = 'normal'
      } = options;

      let html = '';
      let text = '';

      // Use template if provided
      if (template && this.templates.has(template)) {
        const templateFunction = this.templates.get(template);
        html = templateFunction({
          ...data,
          baseUrl: process.env.CLIENT_URL || 'http://localhost:3000',
          companyName: 'TechVerse',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@techverse.com',
          year: new Date().getFullYear()
        });
        
        // Generate text version from HTML
        text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      } else {
        html = data.html || '';
        text = data.text || '';
      }

      const mailOptions = {
        from: {
          name: 'TechVerse',
          address: process.env.EMAIL_FROM || 'noreply@techverse.com'
        },
        to,
        subject,
        html,
        text,
        attachments,
        priority: priority === 'high' ? 'high' : 'normal'
      };

      const result = await this.transporter.sendMail(mailOptions);

      enhancedLogger.info('Email sent successfully', {
        to,
        subject,
        template,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? 
          nodemailer.getTestMessageUrl(result) : null
      });

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? 
          nodemailer.getTestMessageUrl(result) : null
      };

    } catch (error) {
      enhancedLogger.error('Failed to send email', {
        error: error.message,
        to: options.to,
        subject: options.subject,
        template: options.template
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to TechVerse!',
      template: 'welcome',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${user.emailVerificationToken}`
      }
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order, user) {
    return await this.sendEmail({
      to: user.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      template: 'orderConfirmation',
      data: {
        firstName: user.firstName,
        orderNumber: order.orderNumber,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        shippingAddress: order.shippingAddress,
        trackingUrl: `${process.env.CLIENT_URL}/orders/${order._id}`
      }
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(order, user, previousStatus) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.'
    };

    return await this.sendEmail({
      to: user.email,
      subject: `Order Update - ${order.orderNumber}`,
      template: 'orderStatusUpdate',
      data: {
        firstName: user.firstName,
        orderNumber: order.orderNumber,
        status: order.status,
        statusMessage: statusMessages[order.status] || 'Your order status has been updated.',
        previousStatus,
        trackingNumber: order.tracking?.trackingNumber,
        estimatedDelivery: order.tracking?.estimatedDelivery,
        trackingUrl: `${process.env.CLIENT_URL}/orders/${order._id}`
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      data: {
        firstName: user.firstName,
        resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
        expiryTime: '1 hour'
      }
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user, verificationToken) {
    return await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'emailVerification',
      data: {
        firstName: user.firstName,
        verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
      }
    });
  }

  /**
   * Send low stock alert to admins
   */
  async sendLowStockAlert(product, currentStock) {
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',') : 
      ['admin@techverse.com'];

    const promises = adminEmails.map(email => 
      this.sendEmail({
        to: email.trim(),
        subject: `Low Stock Alert - ${product.name}`,
        template: 'lowStockAlert',
        data: {
          productName: product.name,
          productSku: product.sku,
          currentStock,
          lowStockThreshold: product.stock.lowStockThreshold,
          productUrl: `${process.env.CLIENT_URL}/admin/products/${product._id}`
        },
        priority: 'high'
      })
    );

    return await Promise.allSettled(promises);
  }

  /**
   * Send admin notification
   */
  async sendAdminNotification(subject, message, data = {}) {
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',') : 
      ['admin@techverse.com'];

    const promises = adminEmails.map(email => 
      this.sendEmail({
        to: email.trim(),
        subject: `[TechVerse Admin] ${subject}`,
        template: 'adminNotification',
        data: {
          subject,
          message,
          ...data,
          timestamp: new Date().toLocaleString()
        },
        priority: 'high'
      })
    );

    return await Promise.allSettled(promises);
  }

  /**
   * Template definitions
   */
  getWelcomeTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to TechVerse</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{companyName}}!</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}} {{lastName}},</h2>
            <p>Thank you for joining TechVerse! We're excited to have you as part of our community.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            </p>
            <p>Once verified, you'll be able to:</p>
            <ul>
                <li>Browse our extensive catalog of tech products</li>
                <li>Save items to your wishlist</li>
                <li>Track your orders</li>
                <li>Manage your profile and preferences</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team at {{supportEmail}}.</p>
        </div>
        <div class="footer">
            <p>&copy; {{year}} {{companyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  getOrderConfirmationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background: #f8f9fa; padding: 15px; margin: 15px 0; }
        .item { border-bottom: 1px solid #dee2e6; padding: 10px 0; }
        .total { font-weight: bold; font-size: 18px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
            <h2>Thank you for your order, {{firstName}}!</h2>
            <p>Your order <strong>{{orderNumber}}</strong> has been confirmed and is being prepared for shipment.</p>
            
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Date:</strong> {{orderDate}}</p>
                <p><strong>Order Number:</strong> {{orderNumber}}</p>
                
                <h4>Items Ordered:</h4>
                {{#each items}}
                <div class="item">
                    <strong>{{name}}</strong><br>
                    Quantity: {{quantity}} × ${{price}} = ${{total}}
                </div>
                {{/each}}
                
                <div style="margin-top: 15px;">
                    <p>Subtotal: ${{subtotal}}</p>
                    <p>Tax: ${{tax}}</p>
                    <p>Shipping: ${{shipping.cost}}</p>
                    <p class="total">Total: ${{total}}</p>
                </div>
            </div>
            
            <p style="text-align: center;">
                <a href="{{trackingUrl}}" class="button">Track Your Order</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  getOrderStatusUpdateTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .status-update { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Status Update</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>We have an update on your order <strong>{{orderNumber}}</strong>.</p>
            
            <div class="status-update">
                <h3>Status: {{status}}</h3>
                <p>{{statusMessage}}</p>
                {{#if trackingNumber}}
                <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
                {{/if}}
                {{#if estimatedDelivery}}
                <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
                {{/if}}
            </div>
            
            <p style="text-align: center;">
                <a href="{{trackingUrl}}" class="button">View Order Details</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  getPasswordResetTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>We received a request to reset your password for your TechVerse account.</p>
            
            <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
            </p>
            
            <div class="warning">
                <p><strong>Important:</strong> This link will expire in {{expiryTime}}. If you didn't request this password reset, please ignore this email.</p>
            </div>
            
            <p>If you're having trouble clicking the button, copy and paste the following URL into your browser:</p>
            <p style="word-break: break-all;">{{resetUrl}}</p>
        </div>
    </div>
</body>
</html>`;
  }

  getEmailVerificationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}},</h2>
            <p>Please verify your email address to complete your TechVerse account setup.</p>
            
            <p style="text-align: center;">
                <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
            </p>
            
            <p>If you're having trouble clicking the button, copy and paste the following URL into your browser:</p>
            <p style="word-break: break-all;">{{verificationUrl}}</p>
        </div>
    </div>
</body>
</html>`;
  }

  getLowStockAlertTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Low Stock Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
        </div>
        <div class="content">
            <div class="alert">
                <h3>{{productName}} ({{productSku}})</h3>
                <p><strong>Current Stock:</strong> {{currentStock}} units</p>
                <p><strong>Low Stock Threshold:</strong> {{lowStockThreshold}} units</p>
                <p>This product has reached the low stock threshold and may need restocking.</p>
            </div>
            
            <p style="text-align: center;">
                <a href="{{productUrl}}" class="button">Manage Product</a>
            </p>
        </div>
    </div>
</body>
</html>`;
  }

  getAdminNotificationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6c757d; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .notification { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Admin Notification</h1>
        </div>
        <div class="content">
            <div class="notification">
                <h3>{{subject}}</h3>
                <p>{{message}}</p>
                <p><small>Timestamp: {{timestamp}}</small></p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;