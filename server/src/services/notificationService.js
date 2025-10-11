import logger from '../utils/logger.js';
import emailService from './emailService.js';

class NotificationService {
  constructor() {
    this.channels = ['email', 'sms', 'push', 'in_app'];
    this.templates = new Map();
    this.initializeTemplates();
  }

  // Initialize notification templates
  initializeTemplates() {
    this.templates.set('order_confirmation', {
      email: true,
      sms: false,
      push: true,
      in_app: true,
      priority: 'high'
    });

    this.templates.set('order_status_update', {
      email: true,
      sms: false,
      push: true,
      in_app: true,
      priority: 'medium'
    });

    this.templates.set('low_stock_alert', {
      email: true,
      sms: false,
      push: false,
      in_app: true,
      priority: 'high'
    });

    this.templates.set('password_reset', {
      email: true,
      sms: true,
      push: false,
      in_app: false,
      priority: 'high'
    });

    this.templates.set('welcome', {
      email: true,
      sms: false,
      push: false,
      in_app: true,
      priority: 'low'
    });
  }

  // Send notification through multiple channels
  async sendNotification(type, recipient, data, channels = null) {
    try {
      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      const activeChannels = channels || this.getActiveChannels(template, recipient);
      const results = {};

      // Send through each active channel
      for (const channel of activeChannels) {
        try {
          results[channel] = await this.sendThroughChannel(channel, type, recipient, data);
        } catch (error) {
          logger.error(`Failed to send ${type} notification through ${channel}`, {
            recipient: recipient.email || recipient.phone,
            error: error.message
          });
          results[channel] = { success: false, error: error.message };
        }
      }

      logger.info('Notification sent', {
        type,
        recipient: recipient.email || recipient.phone,
        channels: activeChannels,
        results
      });

      return results;

    } catch (error) {
      logger.error('Failed to send notification', {
        type,
        recipient: recipient.email || recipient.phone,
        error: error.message
      });
      throw error;
    }
  }

  // Get active channels based on template and user preferences
  getActiveChannels(template, recipient) {
    const channels = [];

    if (template.email && recipient.email && recipient.preferences?.notifications !== false) {
      channels.push('email');
    }

    if (template.sms && recipient.phone && recipient.preferences?.smsNotifications) {
      channels.push('sms');
    }

    if (template.push && recipient.pushTokens?.length > 0) {
      channels.push('push');
    }

    if (template.in_app) {
      channels.push('in_app');
    }

    return channels;
  }

  // Send through specific channel
  async sendThroughChannel(channel, type, recipient, data) {
    switch (channel) {
      case 'email':
        return await this.sendEmailNotification(type, recipient, data);
      case 'sms':
        return await this.sendSMSNotification(type, recipient, data);
      case 'push':
        return await this.sendPushNotification(type, recipient, data);
      case 'in_app':
        return await this.sendInAppNotification(type, recipient, data);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  // Send email notification
  async sendEmailNotification(type, recipient, data) {
    switch (type) {
      case 'order_confirmation':
        return await emailService.sendOrderConfirmationEmail(recipient, data.order);
      case 'order_status_update':
        return await emailService.sendOrderStatusUpdateEmail(recipient, data.order);
      case 'welcome':
        return await emailService.sendWelcomeEmail(recipient);
      case 'password_reset':
        return await emailService.sendPasswordResetEmail(recipient, data.token);
      case 'low_stock_alert':
        return await emailService.sendLowStockAlert(data.products);
      default:
        throw new Error(`Unsupported email notification type: ${type}`);
    }
  }

  // Send SMS notification (placeholder)
  async sendSMSNotification(type, recipient, data) {
    // TODO: Implement SMS service integration (Twilio, etc.)
    logger.info('SMS notification would be sent', {
      type,
      phone: recipient.phone,
      data
    });
    
    return { success: true, message: 'SMS service not implemented' };
  }

  // Send push notification (placeholder)
  async sendPushNotification(type, recipient, data) {
    // TODO: Implement push notification service (Firebase, etc.)
    logger.info('Push notification would be sent', {
      type,
      tokens: recipient.pushTokens,
      data
    });
    
    return { success: true, message: 'Push notification service not implemented' };
  }

  // Send in-app notification
  async sendInAppNotification(type, recipient, data) {
    // TODO: Store in-app notification in database
    logger.info('In-app notification created', {
      type,
      userId: recipient._id,
      data
    });
    
    return { success: true, message: 'In-app notification created' };
  }

  // Batch send notifications
  async sendBatchNotification(type, recipients, data) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendNotification(type, recipient, data);
        results.push({ recipient: recipient.email, ...result });
      } catch (error) {
        results.push({ 
          recipient: recipient.email, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }
}

export default new NotificationService();