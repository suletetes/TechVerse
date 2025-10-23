import webpush from 'web-push';
import logger from '../utils/enhancedLogger.js';

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.subscriptions = new Map(); // In production, use database
    this.initialize();
  }

  initialize() {
    try {
      // Set VAPID keys (generate these for production)
      const vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI2BN9XplSCYgDbrn7rVgLOYWX2CCKw2OFGEVwdXsaQhQRAcgYKRZdh9Ag',
        privateKey: process.env.VAPID_PRIVATE_KEY || 'tUkzMHuHNlqKJM3_BdXLdHdHcXLGT4nOHLQQU9h02d8'
      };

      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@techverse.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );

      this.isInitialized = true;
      logger.info('Push notification service initialized');
    } catch (error) {
      logger.error('Failed to initialize push notification service:', error);
    }
  }

  // Subscribe a user to push notifications
  async subscribe(userId, subscription) {
    try {
      if (!this.isInitialized) {
        throw new Error('Push notification service not initialized');
      }

      // Validate subscription object
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new Error('Invalid subscription object');
      }

      // Store subscription (in production, save to database)
      this.subscriptions.set(userId, {
        ...subscription,
        subscribedAt: new Date(),
        active: true
      });

      logger.info(`User ${userId} subscribed to push notifications`);
      return { success: true, message: 'Successfully subscribed to notifications' };
    } catch (error) {
      logger.error('Failed to subscribe user to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe a user from push notifications
  async unsubscribe(userId) {
    try {
      if (this.subscriptions.has(userId)) {
        this.subscriptions.delete(userId);
        logger.info(`User ${userId} unsubscribed from push notifications`);
      }
      return { success: true, message: 'Successfully unsubscribed from notifications' };
    } catch (error) {
      logger.error('Failed to unsubscribe user from push notifications:', error);
      throw error;
    }
  }

  // Send notification to a specific user
  async sendToUser(userId, notification) {
    try {
      if (!this.isInitialized) {
        throw new Error('Push notification service not initialized');
      }

      const subscription = this.subscriptions.get(userId);
      if (!subscription || !subscription.active) {
        logger.warn(`No active subscription found for user ${userId}`);
        return { success: false, message: 'No active subscription' };
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/img/logo-192.png',
        badge: notification.badge || '/img/badge-72.png',
        image: notification.image,
        data: notification.data || {},
        actions: notification.actions || [],
        tag: notification.tag,
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false,
        timestamp: Date.now()
      });

      const options = {
        TTL: notification.ttl || 86400, // 24 hours default
        urgency: notification.urgency || 'normal', // low, normal, high
        topic: notification.topic
      };

      await webpush.sendNotification(subscription, payload, options);

      logger.info(`Push notification sent to user ${userId}: ${notification.title}`);
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      logger.error(`Failed to send push notification to user ${userId}:`, error);

      // Handle invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        logger.info(`Removing invalid subscription for user ${userId}`);
        this.subscriptions.delete(userId);
      }

      throw error;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds, notification) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notification);
        results.push({ userId, ...result });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Send notification to all subscribed users
  async sendToAll(notification) {
    const userIds = Array.from(this.subscriptions.keys());
    return this.sendToUsers(userIds, notification);
  }

  // Send notification based on user roles or criteria
  async sendToRole(role, notification) {
    // In production, query database for users with specific role
    // For now, we'll use a simple filter
    const userIds = Array.from(this.subscriptions.keys()).filter(userId => {
      // This would be replaced with actual role checking
      return true; // Placeholder
    });

    return this.sendToUsers(userIds, notification);
  }

  // Predefined notification templates
  async sendOrderUpdate(userId, orderData) {
    const notification = {
      title: 'Order Update',
      body: `Your order #${orderData.orderId} status: ${orderData.status}`,
      icon: '/img/order-icon.png',
      tag: `order-${orderData.orderId}`,
      data: {
        type: 'order-update',
        orderId: orderData.orderId,
        status: orderData.status,
        url: `/orders/${orderData.orderId}`
      },
      actions: [
        {
          action: 'view-order',
          title: 'View Order',
          icon: '/img/view-icon.png'
        },
        {
          action: 'track-order',
          title: 'Track Package',
          icon: '/img/track-icon.png'
        }
      ]
    };

    return this.sendToUser(userId, notification);
  }

  async sendInventoryAlert(adminUserIds, productData) {
    const notification = {
      title: 'Low Stock Alert',
      body: `${productData.name} is running low (${productData.stock} remaining)`,
      icon: '/img/inventory-icon.png',
      tag: `inventory-${productData.id}`,
      urgency: 'high',
      requireInteraction: true,
      data: {
        type: 'inventory-alert',
        productId: productData.id,
        stock: productData.stock,
        url: `/admin/products/${productData.id}`
      },
      actions: [
        {
          action: 'restock',
          title: 'Restock Now',
          icon: '/img/restock-icon.png'
        },
        {
          action: 'view-product',
          title: 'View Product',
          icon: '/img/view-icon.png'
        }
      ]
    };

    return this.sendToUsers(adminUserIds, notification);
  }

  async sendPromotionalNotification(userIds, promotionData) {
    const notification = {
      title: promotionData.title,
      body: promotionData.description,
      icon: '/img/promotion-icon.png',
      image: promotionData.image,
      tag: `promotion-${promotionData.id}`,
      data: {
        type: 'promotion',
        promotionId: promotionData.id,
        discount: promotionData.discount,
        url: promotionData.url || '/promotions'
      },
      actions: [
        {
          action: 'shop-now',
          title: 'Shop Now',
          icon: '/img/shop-icon.png'
        },
        {
          action: 'save-offer',
          title: 'Save Offer',
          icon: '/img/save-icon.png'
        }
      ]
    };

    return this.sendToUsers(userIds, notification);
  }

  async sendSecurityAlert(userId, alertData) {
    const notification = {
      title: 'Security Alert',
      body: alertData.message,
      icon: '/img/security-icon.png',
      tag: 'security-alert',
      urgency: 'high',
      requireInteraction: true,
      data: {
        type: 'security-alert',
        alertType: alertData.type,
        timestamp: alertData.timestamp,
        url: '/account/security'
      },
      actions: [
        {
          action: 'review-activity',
          title: 'Review Activity',
          icon: '/img/review-icon.png'
        },
        {
          action: 'secure-account',
          title: 'Secure Account',
          icon: '/img/secure-icon.png'
        }
      ]
    };

    return this.sendToUser(userId, notification);
  }

  // Get subscription statistics
  getStats() {
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.active).length;

    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions,
      inactiveSubscriptions: this.subscriptions.size - activeSubscriptions,
      isInitialized: this.isInitialized
    };
  }

  // Get all subscriptions (for admin)
  getAllSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([userId, subscription]) => ({
      userId,
      endpoint: subscription.endpoint,
      subscribedAt: subscription.subscribedAt,
      active: subscription.active
    }));
  }

  // Test notification (for development)
  async sendTestNotification(userId) {
    const notification = {
      title: 'Test Notification',
      body: 'This is a test push notification from TechVerse!',
      icon: '/img/logo-192.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/img/dismiss-icon.png'
        }
      ]
    };

    return this.sendToUser(userId, notification);
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;