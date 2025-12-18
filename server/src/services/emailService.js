import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.initPromise = null;
    // Don't call initialize in constructor - let it be called explicitly
  }

  async initialize() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('Email service configuration incomplete - EMAIL_USER and EMAIL_PASS not set');
        logger.info('Email functionality will be disabled. To enable:');
        logger.info('1. Set EMAIL_USER to your Gmail address');
        logger.info('2. Set EMAIL_PASS to your Gmail App Password (not regular password)');
        logger.info('3. Enable 2FA and create App Password at: https://myaccount.google.com/apppasswords');
        this.isInitialized = false;
        return;
      }

      // Create transporter with better error handling
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // Use Gmail service for better compatibility
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Add timeout settings
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        // Disable debug logging
        debug: false,
        logger: false
      });

      // Try to verify connection with better error handling
      try {
        const verifyPromise = this.transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email verification timeout - check firewall/network')), 15000)
        );

        await Promise.race([verifyPromise, timeoutPromise]);
        this.isInitialized = true;
        logger.info(' Email service initialized successfully');
        logger.info(` Emails will be sent from: ${process.env.EMAIL_FROM}`);
      } catch (verifyError) {
        // Log detailed error but continue without email
        logger.warn('  Email verification failed, but service will attempt to send emails anyway', {
          error: verifyError.message,
          code: verifyError.code
        });
        // Set as initialized anyway - some networks block SMTP verify but allow sending
        this.isInitialized = true;
        logger.info(' Email service running in fallback mode (verification skipped)');
      }
    } catch (error) {
      logger.warn('  Failed to initialize email service, continuing without email functionality', {
        error: error.message
      });
      this.transporter = null;
      this.isInitialized = false;
    }
  }

  isAvailable() {
    return this.transporter !== null && this.isInitialized;
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.isAvailable()) {
        logger.warn(`Cannot send email to ${to}: Email service not available`);
        // Return success in development to not block functionality
        return { success: true, skipped: true, reason: 'Email service not configured' };
      }

      const mailOptions = {
        from: `TechVerse <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent successfully to ${to}: ${subject}`);
      return { success: true, result };
    } catch (error) {
      logger.error(`❌ Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Email Templates
  getEmailTemplate(title, content) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; background: #ffffff; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 14px 28px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #5568d3; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #f8f9fa; border-radius: 0 0 10px 10px; }
        .info-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 TechVerse</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Welcome Email
  async sendWelcomeEmail(user, verificationToken = null) {
    const verificationUrl = verificationToken 
      ? `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
      : null;

    const content = `
      <h2>Welcome to TechVerse, ${user.firstName}! 🎉</h2>
      <p>Thank you for joining our community of tech enthusiasts!</p>
      ${verificationUrl ? `
        <div class="info-box">
          <p><strong>Please verify your email address to get started:</strong></p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p style="font-size: 12px; color: #666;">Or copy this link: ${verificationUrl}</p>
        </div>
      ` : ''}
      <p>Here's what you can do with your TechVerse account:</p>
      <ul>
        <li>Browse our extensive collection of tech products</li>
        <li>Track your orders in real-time</li>
        <li>Save your favorite items to your wishlist</li>
        <li>Get exclusive deals and early access to new products</li>
      </ul>
      <p>If you have any questions, our support team is here to help!</p>
      <p>Happy shopping! 🛍️</p>
    `;

    return this.sendEmail(
      user.email,
      'Welcome to TechVerse! 🎉',
      this.getEmailTemplate('Welcome to TechVerse', content)
    );
  }

  // Email Verification
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Hi ${user.firstName},</p>
      <p>Please verify your email address to activate your TechVerse account.</p>
      <div class="info-box">
        <p style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </p>
        <p style="font-size: 12px; color: #666;">Or copy this link: ${verificationUrl}</p>
      </div>
      <div class="warning-box">
        <p><strong>⚠️ Security Note:</strong></p>
        <p>This link will expire in 24 hours. If you didn't create an account with TechVerse, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail(
      user.email,
      'Verify Your TechVerse Account',
      this.getEmailTemplate('Email Verification', content)
    );
  }

  // Password Reset Email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const content = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.firstName},</p>
      <p>We received a request to reset your password for your TechVerse account.</p>
      <div class="info-box">
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p style="font-size: 12px; color: #666;">Or copy this link: ${resetUrl}</p>
      </div>
      <div class="warning-box">
        <p><strong>⚠️ Security Note:</strong></p>
        <ul style="margin: 10px 0;">
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Your password will remain unchanged until you create a new one</li>
        </ul>
      </div>
    `;

    return this.sendEmail(
      user.email,
      'Reset Your TechVerse Password',
      this.getEmailTemplate('Password Reset', content)
    );
  }

  // Order Confirmation Email
  async sendOrderConfirmationEmail(user, order) {
    const orderUrl = `${process.env.CLIENT_URL}/orders/${order._id}`;
    
    const itemsList = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const content = `
      <h2>Order Confirmation 📦</h2>
      <p>Hi ${user.firstName},</p>
      <p>Thank you for your order! We've received it and will process it shortly.</p>
      
      <div class="info-box">
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
      </div>

      <h3>Order Items:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; text-align: left;">Item</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f8f9fa;">
            <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
            <td style="padding: 10px; text-align: right;">$${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${orderUrl}" class="button">View Order Details</a>
      </p>

      <p>We'll send you another email when your order ships.</p>
    `;

    return this.sendEmail(
      user.email,
      `Order Confirmation - ${order.orderNumber}`,
      this.getEmailTemplate('Order Confirmation', content)
    );
  }

  // Order Status Update Email
  async sendOrderStatusUpdateEmail(user, order) {
    const orderUrl = `${process.env.CLIENT_URL}/orders/${order._id}`;
    
    const statusMessages = {
      pending: { emoji: '⏳', message: 'Your order is being processed' },
      processing: { emoji: '🔄', message: 'Your order is being prepared' },
      shipped: { emoji: '🚚', message: 'Your order has been shipped!' },
      delivered: { emoji: '✅', message: 'Your order has been delivered!' },
      cancelled: { emoji: '❌', message: 'Your order has been cancelled' },
      refunded: { emoji: '💰', message: 'Your order has been refunded' }
    };

    const statusInfo = statusMessages[order.status] || { emoji: '📦', message: 'Order status updated' };

    const content = `
      <h2>${statusInfo.emoji} ${statusInfo.message}</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your order status has been updated.</p>
      
      <div class="info-box">
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
        ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
      </div>

      <p style="text-align: center;">
        <a href="${orderUrl}" class="button">Track Your Order</a>
      </p>
    `;

    return this.sendEmail(
      user.email,
      `Order Update - ${order.orderNumber}`,
      this.getEmailTemplate('Order Status Update', content)
    );
  }

  // Low Stock Alert (for admins)
  async sendLowStockAlert(product, currentStock) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
    const productUrl = `${process.env.CLIENT_URL}/admin/products/${product._id}`;

    const content = `
      <h2>⚠️ Low Stock Alert</h2>
      <p>The following product is running low on stock:</p>
      
      <div class="warning-box">
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Current Stock:</strong> ${currentStock} units</p>
        <p><strong>Low Stock Threshold:</strong> ${product.stock?.lowStockThreshold || 10} units</p>
      </div>

      <p>Please restock this item to avoid running out.</p>

      <p style="text-align: center;">
        <a href="${productUrl}" class="button">View Product</a>
      </p>
    `;

    return this.sendEmail(
      adminEmail,
      `Low Stock Alert: ${product.name}`,
      this.getEmailTemplate('Low Stock Alert', content)
    );
  }

  // Admin Notification
  async sendAdminNotification(subject, message, details = {}) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;

    const detailsHtml = Object.keys(details).length > 0 
      ? `<div class="info-box">
          ${Object.entries(details).map(([key, value]) => 
            `<p><strong>${key}:</strong> ${value}</p>`
          ).join('')}
        </div>`
      : '';

    const content = `
      <h2>${subject}</h2>
      <p>${message}</p>
      ${detailsHtml}
      <p><em>This is an automated notification from TechVerse.</em></p>
    `;

    return this.sendEmail(
      adminEmail,
      `[Admin] ${subject}`,
      this.getEmailTemplate(subject, content)
    );
  }

  // Password Changed Confirmation
  async sendPasswordChangedEmail(user) {
    const content = `
      <h2>Password Changed Successfully ✅</h2>
      <p>Hi ${user.firstName},</p>
      <p>Your TechVerse account password has been changed successfully.</p>
      
      <div class="warning-box">
        <p><strong>⚠️ Security Alert:</strong></p>
        <p>If you didn't make this change, please contact our support team immediately at ${process.env.EMAIL_FROM}</p>
      </div>

      <p>For your security, you may want to:</p>
      <ul>
        <li>Review your recent account activity</li>
        <li>Enable two-factor authentication</li>
        <li>Use a unique, strong password</li>
      </ul>
    `;

    return this.sendEmail(
      user.email,
      'Password Changed - TechVerse',
      this.getEmailTemplate('Password Changed', content)
    );
  }
}

export default new EmailService();
