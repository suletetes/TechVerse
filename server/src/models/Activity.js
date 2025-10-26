import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'profile_update',
      'password_change',
      'product_view',
      'product_search',
      'cart_add',
      'cart_remove',
      'cart_update',
      'wishlist_add',
      'wishlist_remove',
      'order_create',
      'order_update',
      'review_create',
      'address_add',
      'address_update',
      'address_delete',
      'payment_method_add',
      'payment_method_delete'
    ],
    index: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'activities'
});

// Indexes for performance
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });

// TTL index to automatically delete old activities (90 days)
activitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to log activity
activitySchema.statics.logActivity = async function(userId, type, description, metadata = {}, req = null) {
  try {
    const activityData = {
      user: userId,
      type,
      description,
      metadata,
      ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      sessionId: req?.sessionID || req?.session?.id || null
    };

    const activity = new this(activityData);
    await activity.save();
    
    return activity;
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid breaking main functionality
    return null;
  }
};

// Static method to get user activities
activitySchema.statics.getUserActivities = async function(userId, options = {}) {
  const {
    type = null,
    limit = 50,
    skip = 0,
    startDate = null,
    endDate = null
  } = options;

  const query = { user: userId };
  
  if (type) {
    query.type = type;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get activity statistics
activitySchema.statics.getActivityStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return stats;
};

export default mongoose.model('Activity', activitySchema);