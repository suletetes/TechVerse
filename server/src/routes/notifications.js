import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pushNotificationService from '../services/pushNotificationService.js';
import logger from '../utils/enhancedLogger.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        error: 'Subscription object is required'
      });
    }

    const result = await pushNotificationService.subscribe(userId, subscription);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        subscribed: true,
        userId: userId
      }
    });
  } catch (error) {
    logger.error('Failed to subscribe to push notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to push notifications',
      message: error.message
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pushNotificationService.unsubscribe(userId);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        subscribed: false,
        userId: userId
      }
    });
  } catch (error) {
    logger.error('Failed to unsubscribe from push notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from push notifications',
      message: error.message
    });
  }
});

// Send test notification
router.post('/test', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pushNotificationService.sendTestNotification(userId);
    
    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      message: error.message
    });
  }
});

// Get notification preferences (placeholder - implement based on your user model)
router.get('/preferences', authenticate, async (req, res) => {
  try {
    // In a real app, get preferences from database
    const defaultPreferences = {
      orderUpdates: true,
      inventoryAlerts: false,
      promotions: true,
      securityAlerts: true,
      chatMessages: true,
      adminNotifications: req.user.role === 'admin' || req.user.role === 'super_admin'
    };

    res.status(200).json({
      success: true,
      data: defaultPreferences
    });
  } catch (error) {
    logger.error('Failed to get notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences',
      message: error.message
    });
  }
});

// Update notification preferences (placeholder - implement based on your user model)
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const preferences = req.body;
    const userId = req.user.id;

    // In a real app, save preferences to database
    logger.info(`Updated notification preferences for user ${userId}:`, preferences);

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error('Failed to update notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
});

// Admin: Send notification to specific user
router.post('/send-to-user', authenticate, async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { userId, notification } = req.body;

    if (!userId || !notification) {
      return res.status(400).json({
        success: false,
        error: 'User ID and notification object are required'
      });
    }

    const result = await pushNotificationService.sendToUser(userId, notification);
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send notification to user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      message: error.message
    });
  }
});

// Admin: Send notification to all users
router.post('/send-to-all', authenticate, async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { notification } = req.body;

    if (!notification) {
      return res.status(400).json({
        success: false,
        error: 'Notification object is required'
      });
    }

    const results = await pushNotificationService.sendToAll(notification);
    
    res.status(200).json({
      success: true,
      message: 'Broadcast notification sent',
      data: {
        totalSent: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results
      }
    });
  } catch (error) {
    logger.error('Failed to send broadcast notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast notification',
      message: error.message
    });
  }
});

// Admin: Send order update notification
router.post('/order-update', authenticate, async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { userId, orderData } = req.body;

    if (!userId || !orderData) {
      return res.status(400).json({
        success: false,
        error: 'User ID and order data are required'
      });
    }

    const result = await pushNotificationService.sendOrderUpdate(userId, orderData);
    
    res.status(200).json({
      success: true,
      message: 'Order update notification sent',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send order update notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send order update notification',
      message: error.message
    });
  }
});

// Admin: Send inventory alert
router.post('/inventory-alert', authenticate, async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { adminUserIds, productData } = req.body;

    if (!adminUserIds || !productData) {
      return res.status(400).json({
        success: false,
        error: 'Admin user IDs and product data are required'
      });
    }

    const results = await pushNotificationService.sendInventoryAlert(adminUserIds, productData);
    
    res.status(200).json({
      success: true,
      message: 'Inventory alert sent to admins',
      data: results
    });
  } catch (error) {
    logger.error('Failed to send inventory alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send inventory alert',
      message: error.message
    });
  }
});

// Admin: Get push notification statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = pushNotificationService.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get push notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get push notification stats',
      message: error.message
    });
  }
});

// Admin: Get all subscriptions
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    // Check admin permission
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const subscriptions = pushNotificationService.getAllSubscriptions();
    
    res.status(200).json({
      success: true,
      data: {
        subscriptions: subscriptions,
        total: subscriptions.length
      }
    });
  } catch (error) {
    logger.error('Failed to get push notification subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get push notification subscriptions',
      message: error.message
    });
  }
});

export default router;