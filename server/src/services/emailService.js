import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.initialize();
  }

  async initialize() {
    try {
      // Create transporter
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Template methods with proper Handlebars syntax
  getWelcomeTemplate() {
    return `<!DOCTYPE html>
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
            <h1>Welcome to \\{{companyName}}!</h1>
        </div>
        <div class="content">
            <h2>Hello \\{{firstName}} \\{{lastName}},</h2>
            <p>Thank you for joining TechVerse! We're excited to have you as part of our community.</p>
            <p>To get started, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="\\{{verificationUrl}}" class="button">Verify Email Address</a>
            </p>
            <p>If you have any questions, feel free to contact our support team at \\{{supportEmail}}.</p>
        </div>
        <div class="footer">
            <p>&copy; \\{{year}} \\{{companyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  async sendWelcomeEmail(userEmail, userData) {
    const template = this.getWelcomeTemplate();
    const html = template
      .replace(/\\\\{{companyName}}/g, 'TechVerse')
      .replace(/\\\\{{firstName}}/g, userData.firstName)
      .replace(/\\\\{{lastName}}/g, userData.lastName)
      .replace(/\\\\{{verificationUrl}}/g, userData.verificationUrl)
      .replace(/\\\\{{supportEmail}}/g, process.env.EMAIL_FROM)
      .replace(/\\\\{{year}}/g, new Date().getFullYear());

    return this.sendEmail(userEmail, 'Welcome to TechVerse!', html);
  }
}

export default new EmailService();