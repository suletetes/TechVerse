import mongoose from 'mongoose';

/**
 * Audit Log Model
 * Stores comprehensive audit trail for all administrative actions
 */

const auditLogSchema = new mongoose.Schema({
  // Admin user information
  adminUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  adminEmail: {
    type: String,
    required: true,
    index: true
  },
  adminRole: {
    type: String,
    required: true,
    enum: ['admin', 'super_admin', 'moderator']
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    index: true,
    enum: [
      // User management actions
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'CHANGE_USER_ROLE',
      'CHANGE_USER_STATUS',
      'RESET_USER_PASSWORD',
      'VIEW_USER_DETAILS',
      'EXPORT_USER_DATA',
      
      // Product management actions
      'CREATE_PRODUCT',
      'UPDATE_PRODUCT',
      'DELETE_PRODUCT',
      'BULK_UPDATE_PRODUCTS',
      'BULK_DELETE_PRODUCTS',
      'UPDATE_PRODUCT_STOCK',
      'UPDATE_PRODUCT_PRICING',
      'PUBLISH_PRODUCT',
      'UNPUBLISH_PRODUCT',
      
      // Order management actions
      'VIEW_ORDER',
      'UPDATE_ORDER_STATUS',
      'CANCEL_ORDER',
      'REFUND_ORDER',
      'EXPORT_ORDER_DATA',
      'BULK_UPDATE_ORDERS',
      
      // Category management actions
      'CREATE_CATEGORY',
      'UPDATE_CATEGORY',
      'DELETE_CATEGORY',
      'REORDER_CATEGORIES',
      
      // System configuration actions
      'UPDATE_SYSTEM_SETTINGS',
      'UPDATE_SECURITY_SETTINGS',
      'UPDATE_EMAIL_SETTINGS',
      'UPDATE_PAYMENT_SETTINGS',
      'BACKUP_DATABASE',
      'RESTORE_DATABASE',
      
      // Security actions
      'LOGIN_ADMIN',
      'LOGOUT_ADMIN',
      'FAILED_LOGIN_ATTEMPT',
      'PASSWORD_CHANGE',
      'SECURITY_ALERT_TRIGGERED',
      'IP_BLOCKED',
      'IP_UNBLOCKED',
      
      // Data operations
      'EXPORT_DATA',
      'IMPORT_DATA',
      'BULK_OPERATION',
      'DATABASE_QUERY',
      
      // General actions
      'VIEW_DASHBOARD',
      'VIEW_ANALYTICS',
      'GENERATE_REPORT',
      'SYSTEM_MAINTENANCE'
    ]
  },
  
  // Resource information
  resourceType: {
    type: String,
    index: true,
    enum: ['user', 'product', 'order', 'category', 'system', 'security', 'data', 'bulk', null]
  },
  resourceId: {
    type: String, // Can be ObjectId or other identifier
    index: true
  },
  
  // Request details
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  
  // Client information
  ip: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  
  // Request/Response data
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  queryParams: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Response details
  statusCode: {
    type: Number,
    required: true,
    index: true
  },
  success: {
    type: Boolean,
    required: true,
    index: true
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  
  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  requestId: {
    type: String,
    required: true,
    index: true
  },
  
  // Additional context
  sessionId: {
    type: String,
    index: true
  },
  correlationId: {
    type: String,
    index: true
  },
  
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  // Compliance and retention
  retentionDate: {
    type: Date,
    index: true
  },
  complianceFlags: [{
    type: String,
    enum: ['GDPR', 'PCI_DSS', 'SOX', 'HIPAA', 'SOC2']
  }],
  
  // Review status
  reviewed: {
    type: Boolean,
    default: false,
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Indexes for efficient querying
auditLogSchema.index({ timestamp: -1 }); // Most recent first
auditLogSchema.index({ adminUserId: 1, timestamp: -1 }); // Admin activity timeline
auditLogSchema.index({ action: 1, timestamp: -1 }); // Action-based queries
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 }); // Resource audit trail
auditLogSchema.index({ ip: 1, timestamp: -1 }); // IP-based analysis
auditLogSchema.index({ success: 1, timestamp: -1 }); // Success/failure analysis
auditLogSchema.index({ riskLevel: 1, timestamp: -1 }); // Risk-based queries
auditLogSchema.index({ reviewed: 1, timestamp: -1 }); // Review status

// Compound indexes for common query patterns
auditLogSchema.index({ 
  adminUserId: 1, 
  action: 1, 
  timestamp: -1 
}); // Admin action history

auditLogSchema.index({ 
  resourceType: 1, 
  success: 1, 
  timestamp: -1 
}); // Resource operation success rates

auditLogSchema.index({ 
  riskLevel: 1, 
  reviewed: 1, 
  timestamp: -1 
}); // High-risk unreviewed actions

// TTL index for automatic cleanup (configurable retention period)
auditLogSchema.index({ 
  retentionDate: 1 
}, { 
  expireAfterSeconds: 0 
});

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for duration in human-readable format
auditLogSchema.virtual('formattedResponseTime').get(function() {
  if (this.responseTime < 1000) {
    return `${this.responseTime}ms`;
  } else if (this.responseTime < 60000) {
    return `${(this.responseTime / 1000).toFixed(2)}s`;
  } else {
    return `${(this.responseTime / 60000).toFixed(2)}m`;
  }
});

// Static methods for common queries
auditLogSchema.statics.findByAdmin = function(adminUserId, options = {}) {
  const { limit = 50, skip = 0, startDate, endDate } = options;
  
  const query = { adminUserId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('adminUserId', 'firstName lastName email')
    .lean();
};

auditLogSchema.statics.findByResource = function(resourceType, resourceId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  return this.find({ resourceType, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('adminUserId', 'firstName lastName email')
    .lean();
};

auditLogSchema.statics.findHighRiskActions = function(options = {}) {
  const { limit = 100, skip = 0, reviewed = false } = options;
  
  return this.find({ 
    riskLevel: { $in: ['HIGH', 'CRITICAL'] },
    reviewed 
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('adminUserId', 'firstName lastName email')
    .lean();
};

auditLogSchema.statics.getActionSummary = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        failureCount: {
          $sum: { $cond: ['$success', 0, 1] }
        },
        avgResponseTime: { $avg: '$responseTime' },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

auditLogSchema.statics.getAdminActivity = function(startDate, endDate) {
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.timestamp = {};
    if (startDate) matchStage.timestamp.$gte = new Date(startDate);
    if (endDate) matchStage.timestamp.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$adminUserId',
        actionCount: { $sum: 1 },
        uniqueActions: { $addToSet: '$action' },
        lastActivity: { $max: '$timestamp' },
        successRate: {
          $avg: { $cond: ['$success', 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'adminInfo'
      }
    },
    {
      $project: {
        actionCount: 1,
        uniqueActionCount: { $size: '$uniqueActions' },
        lastActivity: 1,
        successRate: 1,
        adminEmail: { $arrayElemAt: ['$adminInfo.email', 0] },
        adminName: {
          $concat: [
            { $arrayElemAt: ['$adminInfo.firstName', 0] },
            ' ',
            { $arrayElemAt: ['$adminInfo.lastName', 0] }
          ]
        }
      }
    },
    { $sort: { actionCount: -1 } }
  ]);
};

// Pre-save middleware to set risk level and retention date
auditLogSchema.pre('save', function(next) {
  // Set risk level based on action
  const highRiskActions = [
    'DELETE_USER', 'DELETE_PRODUCT', 'DELETE_ORDER', 'BULK_DELETE_PRODUCTS',
    'BULK_DELETE_ORDERS', 'UPDATE_SECURITY_SETTINGS', 'BACKUP_DATABASE',
    'RESTORE_DATABASE', 'EXPORT_USER_DATA'
  ];
  
  const criticalActions = [
    'UPDATE_SYSTEM_SETTINGS', 'CHANGE_USER_ROLE', 'RESET_USER_PASSWORD',
    'IP_BLOCKED', 'SECURITY_ALERT_TRIGGERED'
  ];
  
  if (criticalActions.includes(this.action)) {
    this.riskLevel = 'CRITICAL';
  } else if (highRiskActions.includes(this.action)) {
    this.riskLevel = 'HIGH';
  } else if (this.action.includes('DELETE') || this.action.includes('BULK')) {
    this.riskLevel = 'MEDIUM';
  } else {
    this.riskLevel = 'LOW';
  }
  
  // Set retention date based on risk level and compliance requirements
  const retentionPeriods = {
    'LOW': 365, // 1 year
    'MEDIUM': 1095, // 3 years
    'HIGH': 2555, // 7 years
    'CRITICAL': 3650 // 10 years
  };
  
  const retentionDays = retentionPeriods[this.riskLevel] || 365;
  this.retentionDate = new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000));
  
  next();
});

// Export the model
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;