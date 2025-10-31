// User Activity Tracking Middleware
// Tracks user interactions, page views, and system events

import { Activity } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Track user activity middleware
 * @param {string} action - Action type
 * @param {string} resource - Resource type
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
export const trackActivity = (action, resource, options = {}) => {
  return async (req, res, next) => {
    try {
      // Skip tracking for non-authenticated users if required
      if (options.requireAuth && !req.user) {
        return next();
      }

      const activityData = {
        user: req.user?._id || null,
        action,
        resource,
        resourceId: options.getResourceId ? options.getResourceId(req) : null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        details: options.getDetails ? options.getDetails(req) : {},
        sessionId: req.sessionID || null,
        timestamp: new Date()
      };

      // Create activity record
      await Activity.create(activityData);

      // Update user's last active timestamp
      if (req.user) {
        req.user.lastActive = new Date();
        await req.user.save();
      }

    } catch (error) {
      // Don't fail the request if activity tracking fails
      logger.error('Activity tracking error', {
        action,
        resource,
        userId: req.user?._id,
        error: error.message
      });
    }

    next();
  };
};

/**
 * Track page view activity
 */
export const trackPageView = trackActivity('page_view', 'Page', {
  getDetails: (req) => ({
    path: req.path,
    method: req.method,
    query: req.query,
    referrer: req.get('Referer')
  })
});

/**
 * Track product view activity
 */
export const trackProductView = trackActivity('product_view', 'Product', {
  getResourceId: (req) => req.params.id,
  getDetails: (req) => ({
    productId: req.params.id,
    source: req.query.source || 'direct'
  })
});

/**
 * Track search activity
 */
export const trackSearch = trackActivity('search', 'Search', {
  getDetails: (req) => ({
    query: req.query.q || req.body.query,
    category: req.query.category,
    filters: req.query.filters,
    resultsCount: req.searchResults?.length || 0
  })
});

/**
 * Track cart activity
 */
export const trackCartActivity = (actionType) => {
  return trackActivity(`cart_${actionType}`, 'Cart', {
    requireAuth: true,
    getDetails: (req) => ({
      productId: req.body.productId || req.params.productId,
      quantity: req.body.quantity,
      variantId: req.body.variantId
    })
  });
};

/**
 * Track wishlist activity
 */
export const trackWishlistActivity = (actionType) => {
  return trackActivity(`wishlist_${actionType}`, 'Wishlist', {
    requireAuth: true,
    getDetails: (req) => ({
      productId: req.body.productId || req.params.productId
    })
  });
};

/**
 * Track authentication activity
 */
export const trackAuthActivity = (actionType) => {
  return trackActivity(`auth_${actionType}`, 'Authentication', {
    getDetails: (req) => ({
      email: req.body.email,
      method: actionType,
      success: !req.authError
    })
  });
};

export default {
  trackActivity,
  trackPageView,
  trackProductView,
  trackSearch,
  trackCartActivity,
  trackWishlistActivity,
  trackAuthActivity
};