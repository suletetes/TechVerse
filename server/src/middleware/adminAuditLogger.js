import enhancedLogger from '../utils/enhancedLogger.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Enhanced Admin Action Audit Logger
 * Comprehensive logging and tracking of all administrative actions
 */

/**
 * Admin action audit logger middleware
 */
export const auditAdminAction = (action, resourceType = null) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Capture request details
    const auditData = {
      adminUserId: req.user?._id,
      adminEmail: req.user?.email,
      adminRole: req.user?.role,
      action,
      resourceType,
      resourceId: req.params.id || req.body.id || null,
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      requestId: req.id,
      requestBody: sanitizeRequestBody(req.body),
      queryParams: req.query
    };

    // Override response methods to capture response data
    res.send = function(data) {
      auditData.responseTime = Date.now() - startTime;
      auditData.statusCode = res.statusCode;
      auditData.success = res.statusCode < 400;
      
      if (res.statusCode >= 400) {
        auditData.errorMessage = extractErrorMessage(data);
      } else {
        auditData.responseData = sanitizeResponseData(data);
      }
      
      // Log the audit event
      logAuditEvent(auditData);
      
      return originalSend.call(this, data);
    };

    res.json = function(data) {
      auditData.responseTime = Date.now() - startTime;
      auditData.statusCode = res.statusCode;
      auditData.success = res.statusCode < 400;
      
      if (res.statusCode >= 400) {
        auditData.errorMessage = extractErrorMessage(data);
      } else {
        auditData.responseData = sanitizeResponseData(data);
      }
      
      // Log the audit event
      logAuditEvent(auditData);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Log audit event to multiple destinations
 */
const logAuditEvent = async (auditData) => {
  try {
    // Log to enhanced logger (files)
    enhancedLogger.audit('Admin action performed', auditData);
    
    // Save to database for long-term storage and querying
    await saveAuditToDatabase(auditData);
    
    // Send to external monitoring service if configured
    if (process.env.AUDIT_WEBHOOK_URL) {
      await sendToExternalMonitoring(auditData);
    }
    
    // Real-time notifications for critical actions
    if (isCriticalAction(auditData.action)) {
      await sendCriticalActionAlert(auditData);
    }
    
  } catch (error) {
    enhancedLogger.error('Failed to log audit event', {
      error: error.message,
      auditData: auditData.action,
      adminUserId: auditData.adminUserId
    });
  }
};

/**
 * Save audit log to database
 */
const saveAuditToDatabase = async (auditData) => {
  try {
    const auditLog = new AuditLog({
      adminUserId: auditData.adminUserId,
      adminEmail: auditData.adminEmail,
      adminRole: auditData.adminRole,
      action: auditData.action,
      resourceType: auditData.resourceType,
      resourceId: auditData.resourceId,
      endpoint: auditData.endpoint,
      method: auditData.method,
      ip: auditData.ip,
      userAgent: auditData.userAgent,
      requestBody: auditData.requestBody,
      queryParams: auditData.queryParams,
      responseTime: auditData.responseTime,
      statusCode: auditData.statusCode,
      success: auditData.success,
      errorMessage: auditData.errorMessage,
      responseData: auditData.responseData,
      timestamp: auditData.timestamp,
      requestId: auditData.requestId
    });
    
    await auditLog.save();
  } catch (error) {
    enhancedLogger.error('Failed to save audit log to database', {
      error: error.message,
      action: auditData.action,
      adminUserId: auditData.adminUserId
    });
  }
};

/**
 * Send audit data to external monitoring service
 */
const sendToExternalMonitoring = async (auditData) => {
  try {
    const response = await fetch(process.env.AUDIT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUDIT_WEBHOOK_TOKEN}`
      },
      body: JSON.stringify({
        ...auditData,
        source: 'techverse-admin',
        environment: process.env.NODE_ENV
      })
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }
  } catch (error) {
    enhancedLogger.error('Failed to send audit data to external monitoring', {
      error: error.message,
      webhookUrl: process.env.AUDIT_WEBHOOK_URL,
      action: auditData.action
    });
  }
};

/**
 * Send critical action alerts
 */
const sendCriticalActionAlert = async (auditData) => {
  try {
    // Send email alert for critical actions
    if (process.env.ADMIN_ALERT_EMAIL) {
      // Implementation would depend on your email service
      enhancedLogger.security('Critical admin action alert', {
        ...auditData,
        alertLevel: 'CRITICAL',
        requiresReview: true
      });
    }
    
    // Send to Slack/Teams if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await sendSlackAlert(auditData);
    }
  } catch (error) {
    enhancedLogger.error('Failed to send critical action alert', {
      error: error.message,
      action: auditData.action,
      adminUserId: auditData.adminUserId
    });
  }
};

/**
 * Send Slack alert for critical actions
 */
const sendSlackAlert = async (auditData) => {
  try {
    const slackMessage = {
      text: `🚨 Critical Admin Action Alert`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Action', value: auditData.action, short: true },
          { title: 'Admin', value: auditData.adminEmail, short: true },
          { title: 'Resource', value: auditData.resourceType || 'N/A', short: true },
          { title: 'IP Address', value: auditData.ip, short: true },
          { title: 'Timestamp', value: auditData.timestamp.toISOString(), short: false }
        ]
      }]
    };
    
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });
  } catch (error) {
    enhancedLogger.error('Failed to send Slack alert', {
      error: error.message,
      action: auditData.action
    });
  }
};

/**
 * Check if action is critical and requires immediate attention
 */
const isCriticalAction = (action) => {
  const criticalActions = [
    'DELETE_USER',
    'DELETE_PRODUCT',
    'DELETE_ORDER',
    'BULK_DELETE',
    'CHANGE_USER_ROLE',
    'SYSTEM_CONFIGURATION_CHANGE',
    'SECURITY_SETTINGS_CHANGE',
    'DATABASE_OPERATION',
    'EXPORT_USER_DATA',
    'RESET_USER_PASSWORD'
  ];
  
  return criticalActions.includes(action);
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'socialSecurityNumber'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize response data for logging
 */
const sanitizeResponseData = (data) => {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data.substring(0, 500); // Limit string length
    }
  }
  
  if (!data || typeof data !== 'object') return data;
  
  // Limit the size of response data logged
  const stringified = JSON.stringify(data);
  if (stringified.length > 1000) {
    return {
      ...data,
      _truncated: true,
      _originalSize: stringified.length
    };
  }
  
  return data;
};

/**
 * Extract error message from response data
 */
const extractErrorMessage = (data) => {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return data.substring(0, 200);
    }
  }
  
  if (data && typeof data === 'object') {
    return data.message || data.error || 'Unknown error';
  }
  
  return 'Unknown error';
};

/**
 * Specific audit loggers for different admin actions
 */
export const auditUserManagement = auditAdminAction('USER_MANAGEMENT', 'user');
export const auditProductManagement = auditAdminAction('PRODUCT_MANAGEMENT', 'product');
export const auditOrderManagement = auditAdminAction('ORDER_MANAGEMENT', 'order');
export const auditCategoryManagement = auditAdminAction('CATEGORY_MANAGEMENT', 'category');
export const auditSystemConfiguration = auditAdminAction('SYSTEM_CONFIGURATION', 'system');
export const auditSecuritySettings = auditAdminAction('SECURITY_SETTINGS', 'security');
export const auditDataExport = auditAdminAction('DATA_EXPORT', 'data');
export const auditBulkOperation = auditAdminAction('BULK_OPERATION', 'bulk');

/**
 * Audit log query middleware for admin dashboard
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      adminUserId,
      resourceType,
      startDate,
      endDate,
      success
    } = req.query;
    
    const query = {};
    
    if (action) query.action = { $regex: action, $options: 'i' };
    if (adminUserId) query.adminUserId = adminUserId;
    if (resourceType) query.resourceType = resourceType;
    if (success !== undefined) query.success = success === 'true';
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    enhancedLogger.error('Failed to fetch audit logs', {
      error: error.message,
      adminUserId: req.user?._id,
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      code: 'AUDIT_FETCH_ERROR'
    });
  }
};

export default {
  auditAdminAction,
  auditUserManagement,
  auditProductManagement,
  auditOrderManagement,
  auditCategoryManagement,
  auditSystemConfiguration,
  auditSecuritySettings,
  auditDataExport,
  auditBulkOperation,
  getAuditLogs
};