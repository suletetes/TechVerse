import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { EMAIL_TEMPLATES } from '../utils/constants.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.warn('Email configuration missing. Email service will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed', error);
          this.isConfigured = false;
        } else {
          logger.info('Email service configured successfully');
          this.isConfigured = true;
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter', error);
      this.isConfigured = false;
    }
  }

  // Generic email sending method
  async sendEmail(to, subject, html, text = null) {
    if (!this.isConfigured) {
      logger.warn('Email service not configured. Skipping email send.', { to, subject });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'TechVerse'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };

    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to TechVerse!';
    const html = this.generateWelcomeEmailTemplate(user);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Send email verification
  async sendVerificationEmail(user, token) {
    const subject = 'Verify Your Email Address';
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    const html = this.generateVerificationEmailTemplate(user, verificationUrl);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Send password reset email
  async sendPasswordResetEmail(user, token) {
    const subject = 'Reset Your Password';
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const html = this.generatePasswordResetEmailTemplate(user, resetUrl);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Send order confirmation email
  async sendOrderConfirmationEmail(user, order) {
    const subject = `Order Confirmation - ${order.orderNumber}`;
    const html = this.generateOrderConfirmationEmailTemplate(user, order);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Send order status update email
  async sendOrderStatusUpdateEmail(user, order) {
    const subject = `Order Update - ${order.orderNumber}`;
    const html = this.generateOrderStatusUpdateEmailTemplate(user, order);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Send newsletter to multiple users
  async sendNewsletterEmail(users, content) {
    const results = [];
    
    for (const user of users) {
      if (user.preferences?.newsletter) {
        const subject = content.subject;
        const html = this.generateNewsletterEmailTemplate(user, content);
        
        const result = await this.sendEmail(user.email, subject, html);
        results.push({ user: user.email, ...result });
        
        // Add delay to avoid rate limiting
        await this.delay(100);
      }
    }
    
    return results;
  }

  // Send low stock alert to admin
  async sendLowStockAlert(products) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const subject = 'Low Stock Alert';
    const html = this.generateLowStockAlertTemplate(products);
    
    return await this.sendEmail(adminEmail, subject, html);
  }

  // Send review notification
  async sendReviewNotification(user, product, review) {
    const subject = 'Thank you for your review!';
    const html = this.generateReviewNotificationTemplate(user, product, review);
    
    return await this.sendEmail(user.email, subject, html);
  }

  // Email Templates
  generateWelcomeEmailTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TechVerse</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TechVerse!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName}!</h2>
            <p>Welcome to TechVerse, your ultimate destination for cutting-edge technology products.</p>
            <p>Your account has been successfully created and verified. You can now:</p>
            <ul>
              <li>Browse our extensive product catalog</li>
              <li>Add items to your wishlist</li>
              <li>Enjoy fast and secure checkout</li>
              <li>Track your orders in real-time</li>
              <li>Leave reviews and ratings</li>
            </ul>
            <p>
              <a href="${process.env.CLIENT_URL}" class="button">Start Shopping</a>
            </p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
            <p>You received this email because you created an account with us.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateVerificationEmailTemplate(user, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName}!</h2>
            <p>Thank you for signing up with TechVerse. To complete your registration, please verify your email address.</p>
            <p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <div class="warning">
              <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmailTemplate(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName}!</h2>
            <p>We received a request to reset your password for your TechVerse account.</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>Security Notice:</strong> This reset link will expire in 10 minutes for your security.</p>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOrderConfirmationEmailTemplate(user, order) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <strong>${item.name}</strong><br>
          Quantity: ${item.quantity}<br>
          ${item.variants && item.variants.length > 0 ? 
            `Options: ${item.variants.map(v => `${v.name}: ${v.value}`).join(', ')}<br>` : 
            ''
          }
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
          £${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .total-row { font-weight: bold; background: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Order #${order.orderNumber}</p>
          </div>
          <div class="content">
            <h2>Thank you for your order, ${user.firstName}!</h2>
            <p>We've received your order and are preparing it for shipment.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <table class="items-table">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr class="total-row">
                    <td style="padding: 10px;">Subtotal</td>
                    <td style="padding: 10px; text-align: right;">£${order.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td style="padding: 10px;">Shipping</td>
                    <td style="padding: 10px; text-align: right;">£${order.shipping.cost.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                    <td style="padding: 10px;">Tax</td>
                    <td style="padding: 10px; text-align: right;">£${order.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row" style="font-size: 18px;">
                    <td style="padding: 10px;">Total</td>
                    <td style="padding: 10px; text-align: right;">£${order.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="order-details">
              <h3>Shipping Address</h3>
              <p>
                ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.postcode}<br>
                ${order.shippingAddress.country}
              </p>
            </div>

            <p>
              <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="button">Track Your Order</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOrderStatusUpdateEmailTemplate(user, order) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.',
      refunded: 'Your order has been refunded.'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #17a2b8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-update { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #17a2b8; }
          .button { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Update</h1>
            <p>Order #${order.orderNumber}</p>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName}!</h2>
            
            <div class="status-update">
              <h3>Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</h3>
              <p>${statusMessages[order.status] || 'Your order status has been updated.'}</p>
              ${order.tracking && order.tracking.trackingNumber ? 
                `<p><strong>Tracking Number:</strong> ${order.tracking.trackingNumber}</p>` : 
                ''
              }
            </div>

            <p>
              <a href="${process.env.CLIENT_URL}/orders/${order._id}" class="button">View Order Details</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateNewsletterEmailTemplate(user, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .unsubscribe { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TechVerse Newsletter</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName}!</h2>
            ${content.html}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TechVerse. All rights reserved.</p>
            <div class="unsubscribe">
              <p><a href="${process.env.CLIENT_URL}/unsubscribe?email=${user.email}">Unsubscribe from newsletters</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateLowStockAlertTemplate(products) {
    const productsHtml = products.map(product => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${product.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${product.stock.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${product.stock.lowStockThreshold}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Low Stock Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .products-table th { background: #f8f9fa; padding: 10px; text-align: left; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Low Stock Alert</h1>
          </div>
          <div class="content">
            <p>The following products are running low on stock:</p>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Current Stock</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>
            <p>Please restock these items to avoid stockouts.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateReviewNotificationTemplate(user, product, review) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you for your review!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .review-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .stars { color: #ffc107; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Review!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName}!</h2>
            <p>Thank you for taking the time to review <strong>${product.name}</strong>.</p>
            
            <div class="review-box">
              <h3>Your Review</h3>
              <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
              <p><strong>${review.title}</strong></p>
              <p>${review.comment}</p>
            </div>

            <p>Your feedback helps other customers make informed decisions and helps us improve our products and services.</p>
            <p>Your review will be published after moderation, typically within 24 hours.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Utility methods
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new EmailService();