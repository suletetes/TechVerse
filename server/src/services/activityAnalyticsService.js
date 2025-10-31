// Activity Analytics Service
// Provides insights and analytics based on user activity data

import { Activity, User, Product } from '../models/index.js';
import logger from '../utils/logger.js';

class ActivityAnalyticsService {
  /**
   * Get user activity summary
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Activity summary
   */
  async getUserActivitySummary(userId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 50
    } = options;

    const [
      totalActivities,
      recentActivities,
      activityByType,
      dailyActivity,
      topResources
    ] = await Promise.all([
      // Total activity count
      Activity.countDocuments({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),

      // Recent activities
      Activity.find({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),

      // Activity by type
      Activity.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastActivity: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Daily activity trend
      Activity.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            uniqueActions: { $addToSet: '$action' }
          }
        },
        {
          $project: {
            date: '$_id',
            count: 1,
            uniqueActionsCount: { $size: '$uniqueActions' }
          }
        },
        { $sort: { date: 1 } }
      ]),

      // Top accessed resources
      Activity.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate },
            resourceId: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              resource: '$resource',
              resourceId: '$resourceId'
            },
            count: { $sum: 1 },
            lastAccessed: { $max: '$createdAt' },
            actions: { $addToSet: '$action' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      summary: {
        totalActivities,
        period: { startDate, endDate },
        mostActiveDay: dailyActivity.reduce((max, day) => 
          day.count > (max?.count || 0) ? day : max, null
        )
      },
      recentActivities,
      distribution: {
        byType: activityByType,
        byDay: dailyActivity
      },
      topResources
    };
  }

  /**
   * Get platform-wide activity analytics
   * @param {Object} options - Query options
   * @returns {Object} Platform analytics
   */
  async getPlatformAnalytics(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = options;

    const [
      overallStats,
      userEngagement,
      popularActions,
      popularProducts,
      trafficSources,
      deviceStats
    ] = await Promise.all([
      // Overall statistics
      Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' },
            uniqueSessions: { $addToSet: '$sessionId' },
            topAction: { $first: '$action' }
          }
        },
        {
          $project: {
            totalActivities: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            uniqueSessions: { $size: '$uniqueSessions' }
          }
        }
      ]),

      // User engagement metrics
      Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            user: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$user',
            activityCount: { $sum: 1 },
            sessionCount: { $addToSet: '$sessionId' },
            firstActivity: { $min: '$createdAt' },
            lastActivity: { $max: '$createdAt' }
          }
        },
        {
          $project: {
            activityCount: 1,
            sessionCount: { $size: '$sessionCount' },
            engagementDuration: {
              $divide: [
                { $subtract: ['$lastActivity', '$firstActivity'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgActivitiesPerUser: { $avg: '$activityCount' },
            avgSessionsPerUser: { $avg: '$sessionCount' },
            avgEngagementDuration: { $avg: '$engagementDuration' },
            totalUsers: { $sum: 1 }
          }
        }
      ]),

      // Popular actions
      Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            action: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Popular products (most viewed)
      Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            resource: 'Product',
            action: 'product_view',
            resourceId: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$resourceId',
            views: { $sum: 1 },
            uniqueViewers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            productId: '$_id',
            views: 1,
            uniqueViewers: { $size: '$uniqueViewers' }
          }
        },
        { $sort: { views: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            productId: 1,
            name: '$product.name',
            sku: '$product.sku',
            views: 1,
            uniqueViewers: 1
          }
        }
      ]),

      // Traffic sources (based on referrer)
      Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            action: 'page_view',
            'details.referrer': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$details.referrer',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            referrer: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Device/Browser statistics
      Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            userAgent: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$userAgent',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            userAgent: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            // Simple device detection
            isMobile: {
              $cond: [
                { $regexMatch: { input: '$_id', regex: /Mobile|Android|iPhone/i } },
                true,
                false
              ]
            }
          }
        },
        {
          $group: {
            _id: '$isMobile',
            count: { $sum: '$count' },
            uniqueUsers: { $sum: '$uniqueUsers' }
          }
        }
      ])
    ]);

    return {
      overview: overallStats[0] || {
        totalActivities: 0,
        uniqueUsers: 0,
        uniqueSessions: 0
      },
      engagement: userEngagement[0] || {
        avgActivitiesPerUser: 0,
        avgSessionsPerUser: 0,
        avgEngagementDuration: 0,
        totalUsers: 0
      },
      popular: {
        actions: popularActions,
        products: popularProducts
      },
      traffic: {
        sources: trafficSources,
        devices: deviceStats
      },
      period: { startDate, endDate }
    };
  }

  /**
   * Get user behavior patterns
   * @param {string} userId - User ID (optional, for specific user)
   * @param {Object} options - Query options
   * @returns {Object} Behavior patterns
   */
  async getBehaviorPatterns(userId = null, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = options;

    const matchQuery = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (userId) {
      matchQuery.user = userId;
    }

    const [
      sessionPatterns,
      conversionFunnel,
      abandonmentAnalysis,
      timePatterns
    ] = await Promise.all([
      // Session patterns
      Activity.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              user: '$user',
              session: '$sessionId'
            },
            activities: { $sum: 1 },
            duration: {
              $subtract: [
                { $max: '$createdAt' },
                { $min: '$createdAt' }
              ]
            },
            actions: { $addToSet: '$action' }
          }
        },
        {
          $group: {
            _id: null,
            avgActivitiesPerSession: { $avg: '$activities' },
            avgSessionDuration: { $avg: '$duration' },
            totalSessions: { $sum: 1 }
          }
        }
      ]),

      // Conversion funnel analysis
      Activity.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$user',
            actions: { $addToSet: '$action' }
          }
        },
        {
          $project: {
            hasViewed: { $in: ['product_view', '$actions'] },
            hasAddedToCart: { $in: ['cart_add', '$actions'] },
            hasOrdered: { $in: ['order_created', '$actions'] }
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            viewedProduct: { $sum: { $cond: ['$hasViewed', 1, 0] } },
            addedToCart: { $sum: { $cond: ['$hasAddedToCart', 1, 0] } },
            completedOrder: { $sum: { $cond: ['$hasOrdered', 1, 0] } }
          }
        }
      ]),

      // Cart abandonment analysis
      Activity.aggregate([
        {
          $match: {
            ...matchQuery,
            action: { $in: ['cart_add', 'order_created'] }
          }
        },
        {
          $group: {
            _id: '$user',
            hasAddedToCart: {
              $sum: { $cond: [{ $eq: ['$action', 'cart_add'] }, 1, 0] }
            },
            hasOrdered: {
              $sum: { $cond: [{ $eq: ['$action', 'order_created'] }, 1, 0] }
            }
          }
        },
        {
          $group: {
            _id: null,
            usersWithCartItems: {
              $sum: { $cond: [{ $gt: ['$hasAddedToCart', 0] }, 1, 0] }
            },
            usersWhoOrdered: {
              $sum: { $cond: [{ $gt: ['$hasOrdered', 0] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            usersWithCartItems: 1,
            usersWhoOrdered: 1,
            abandonmentRate: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$usersWithCartItems', '$usersWhoOrdered'] },
                    '$usersWithCartItems'
                  ]
                },
                100
              ]
            }
          }
        }
      ]),

      // Time-based activity patterns
      Activity.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              hour: { $hour: '$createdAt' },
              dayOfWeek: { $dayOfWeek: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            hourlyPattern: {
              $push: {
                hour: '$_id.hour',
                count: '$count'
              }
            },
            dailyPattern: {
              $push: {
                dayOfWeek: '$_id.dayOfWeek',
                count: '$count'
              }
            }
          }
        }
      ])
    ]);

    return {
      sessions: sessionPatterns[0] || {
        avgActivitiesPerSession: 0,
        avgSessionDuration: 0,
        totalSessions: 0
      },
      conversion: conversionFunnel[0] || {
        totalUsers: 0,
        viewedProduct: 0,
        addedToCart: 0,
        completedOrder: 0
      },
      abandonment: abandonmentAnalysis[0] || {
        usersWithCartItems: 0,
        usersWhoOrdered: 0,
        abandonmentRate: 0
      },
      timePatterns: timePatterns[0] || {
        hourlyPattern: [],
        dailyPattern: []
      }
    };
  }

  /**
   * Get real-time activity feed
   * @param {Object} options - Query options
   * @returns {Array} Recent activities
   */
  async getRealtimeActivityFeed(options = {}) {
    const {
      limit = 50,
      actions = null,
      excludeActions = ['page_view'] // Exclude noisy actions by default
    } = options;

    const matchQuery = {
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    };

    if (actions) {
      matchQuery.action = { $in: actions };
    } else if (excludeActions) {
      matchQuery.action = { $nin: excludeActions };
    }

    const activities = await Activity.find(matchQuery)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return activities.map(activity => ({
      ...activity,
      timeAgo: this.getTimeAgo(activity.createdAt),
      displayText: this.generateActivityDisplayText(activity)
    }));
  }

  /**
   * Generate human-readable activity display text
   * @param {Object} activity - Activity object
   * @returns {string} Display text
   */
  generateActivityDisplayText(activity) {
    const userName = activity.user ? 
      `${activity.user.firstName} ${activity.user.lastName}` : 
      'Anonymous user';

    const actionTexts = {
      'product_view': `${userName} viewed a product`,
      'cart_add': `${userName} added item to cart`,
      'cart_remove': `${userName} removed item from cart`,
      'wishlist_add': `${userName} added item to wishlist`,
      'order_created': `${userName} placed an order`,
      'user_registered': `${userName} registered`,
      'user_login': `${userName} logged in`,
      'review_created': `${userName} left a review`,
      'search': `${userName} searched for "${activity.details?.query || 'products'}"`
    };

    return actionTexts[activity.action] || `${userName} performed ${activity.action}`;
  }

  /**
   * Get time ago string
   * @param {Date} date - Date to compare
   * @returns {string} Time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }
}

export default new ActivityAnalyticsService();