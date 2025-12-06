import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'role_created',
      'role_updated',
      'role_deleted',
      'role_assigned',
      'role_revoked',
      'permission_added',
      'permission_removed',
      'user_created',
      'user_updated',
      'user_deleted',
      'login_success',
      'login_failed',
      'logout',
      'password_changed',
      'password_reset',
      'unauthorized_access'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performer is required']
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  metadata: {
    ip: String,
    userAgent: String,
    reason: String,
    endpoint: String,
    method: String,
    statusCode: Number,
    errorMessage: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Indexes for performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });
auditLogSchema.index({ targetRole: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'metadata.ip': 1 });

// Compound indexes for common queries
auditLogSchema.index({ action: 1, performedBy: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, action: 1, timestamp: -1 });

// Static method to log role creation
auditLogSchema.statics.logRoleCreation = function(roleId, performedBy, metadata = {}) {
  return this.create({
    action: 'role_created',
    performedBy,
    targetRole: roleId,
    metadata,
    timestamp: new Date()
  });
};

// Static method to log role update
auditLogSchema.statics.logRoleUpdate = function(roleId, performedBy, changes, metadata = {}) {
  return this.create({
    action: 'role_updated',
    performedBy,
    targetRole: roleId,
    changes,
    metadata,
    timestamp: new Date()
  });
};

// Static method to log role deletion
auditLogSchema.statics.logRoleDeletion = function(roleId, performedBy, metadata = {}) {
  return this.create({
    action: 'role_deleted',
    performedBy,
    targetRole: roleId,
    metadata,
    timestamp: new Date()
  });
};

// Static method to log role assignment
auditLogSchema.statics.logRoleAssignment = function(userId, roleId, performedBy, changes, metadata = {}) {
  return this.create({
    action: 'role_assigned',
    performedBy,
    targetUser: userId,
    targetRole: roleId,
    changes,
    metadata,
    timestamp: new Date()
  });
};

// Static method to log unauthorized access
auditLogSchema.statics.logUnauthorizedAccess = function(userId, metadata = {}) {
  return this.create({
    action: 'unauthorized_access',
    performedBy: userId,
    metadata,
    timestamp: new Date()
  });
};

// Static method to get logs with filtering
auditLogSchema.statics.getFilteredLogs = function(filters = {}) {
  const query = {};
  
  if (filters.action) {
    query.action = filters.action;
  }
  
  if (filters.performedBy) {
    query.performedBy = filters.performedBy;
  }
  
  if (filters.targetUser) {
    query.targetUser = filters.targetUser;
  }
  
  if (filters.targetRole) {
    query.targetRole = filters.targetRole;
  }
  
  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) {
      query.timestamp.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.timestamp.$lte = new Date(filters.endDate);
    }
  }
  
  return this.find(query)
    .populate('performedBy', 'firstName lastName email')
    .populate('targetUser', 'firstName lastName email')
    .populate('targetRole', 'name displayName')
    .sort({ timestamp: -1 })
    .limit(filters.limit || 100);
};

// Static method to export logs to CSV format
auditLogSchema.statics.exportToCSV = async function(filters = {}) {
  const logs = await this.getFilteredLogs(filters);
  
  const headers = [
    'Timestamp',
    'Action',
    'Performed By',
    'Target User',
    'Target Role',
    'IP Address',
    'Reason'
  ];
  
  const rows = logs.map(log => [
    log.timestamp.toISOString(),
    log.action,
    log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName} (${log.performedBy.email})` : 'N/A',
    log.targetUser ? `${log.targetUser.firstName} ${log.targetUser.lastName} (${log.targetUser.email})` : 'N/A',
    log.targetRole ? log.targetRole.displayName : 'N/A',
    log.metadata?.ip || 'N/A',
    log.metadata?.reason || 'N/A'
  ]);
  
  return [headers, ...rows];
};

// Method to get human-readable description
auditLogSchema.methods.getDescription = function() {
  const actionDescriptions = {
    role_created: 'created a new role',
    role_updated: 'updated role',
    role_deleted: 'deleted role',
    role_assigned: 'assigned role to user',
    role_revoked: 'revoked role from user',
    permission_added: 'added permission',
    permission_removed: 'removed permission',
    unauthorized_access: 'attempted unauthorized access'
  };
  
  return actionDescriptions[this.action] || this.action;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
