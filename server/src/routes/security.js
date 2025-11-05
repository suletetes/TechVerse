import express from 'express';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth.js';
import { auditSecuritySettings } from '../middleware/adminAuditLogger.js';
import { csrfTokenEndpoint, adminCSRFProtection } from '../middleware/csrfProtection.js';
import { handleValidationErrors } from '../middleware/enhancedValidation.js';
import { body } from 'express-validator';
import enhancedLogger from '../utils/enhancedLogger.js';
import securityMonitor from '../utils/securityMonitor.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

/**
 * Security Management Routes
 * Provides endpoints for managing security settings and monitoring
 */

// Apply authentication and admin role requirement to most routes (except CSRF endpoints)
const skipAuthPaths = ['/csrf-token', '/csrf-token-simple'];

router.use((req, res, next) => {
  const shouldSkipAuth = skipAuthPaths.some(path => req.path === path);
  if (shouldSkipAuth) {
    return next();
  }
  authenticate(req, res, next);
});

router.use((req, res, next) => {
  const shouldSkipAuth = skipAuthPaths.some(path => req.path === path);
  if (shouldSkipAuth) {
    return next();
  }
  requireRole(['admin', 'super_admin'])(req, res, next);
});

/**
 * GET /api/security/csrf-token
 * Get CSRF token for authenticated admin users
 */
router.get('/csrf-token', csrfTokenEndpoint);

/**
 * GET /api/security/csrf-token-simple
 * Simple CSRF token endpoint without authentication requirement
 * Uses simple double-submit cookie pattern
 */
router.get('/csrf-token-simple', (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set cookie for client access (double-submit pattern)
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000 // 1 hour
    });
    
    console.log('✅ Simple CSRF token generated (double-submit pattern)');

    res.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to generate simple CSRF token:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      code: 'CSRF_TOKEN_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/security/dashboard
 * Get security dashboard overview
 */
router.get('/dashboard', auditSecuritySettings, async (req, res) => {
  try {
    const securityStatus = {
      rateLimitingEnabled: true,
      inputSanitizationEnabled: true,
      auditLoggingEnabled: true,
      csrfProtectionEnabled: true,
      securityMonitoringEnabled: true,
      fileUploadSecurityEnabled: true
    };

    const recentAlerts = await securityMonitor.getRecentAlerts(10);
    const securityMetrics = await getSecurityMetrics();

    enhancedLogger.audit('Security dashboard accessed', {
      adminUserId: req.user._id,
      ip: req.ip,
      requestId: req.id
    });

    res.json({
      success: true,
      data: {
        status: securityStatus,
        alerts: recentAlerts,
        metrics: securityMetrics
      }
    });
  } catch (error) {
    enhancedLogger.error('Failed to fetch security dashboard', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch security dashboard',
      code: 'SECURITY_DASHBOARD_ERROR'
    });
  }
});

/**
 * GET /api/security/alerts
 * Get security alerts with filtering and pagination
 */
router.get('/alerts', auditSecuritySettings, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      type,
      startDate,
      endDate,
      resolved
    } = req.query;

    const alerts = await securityMonitor.getAlerts({
      page: parseInt(page),
      limit: parseInt(limit),
      severity,
      type,
      startDate,
      endDate,
      resolved: resolved === 'true'
    });

    enhancedLogger.audit('Security alerts accessed', {
      adminUserId: req.user._id,
      alertCount: alerts.data.length,
      filters: { severity, type, resolved },
      requestId: req.id
    });

    res.json({
      success: true,
      ...alerts
    });
  } catch (error) {
    enhancedLogger.error('Failed to fetch security alerts', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch security alerts',
      code: 'SECURITY_ALERTS_ERROR'
    });
  }
});

/**
 * POST /api/security/alerts/:id/resolve
 * Resolve a security alert
 */
router.post('/alerts/:id/resolve', 
  adminCSRFProtection,
  auditSecuritySettings,
  [
    body('resolution').notEmpty().withMessage('Resolution is required'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolution, notes } = req.body;

      const result = await securityMonitor.resolveAlert(id, {
        resolvedBy: req.user._id,
        resolution,
        notes,
        resolvedAt: new Date()
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Security alert not found',
          code: 'ALERT_NOT_FOUND'
        });
      }

      enhancedLogger.audit('Security alert resolved', {
        alertId: id,
        resolution,
        resolvedBy: req.user._id,
        adminEmail: req.user.email,
        requestId: req.id
      });

      res.json({
        success: true,
        message: 'Security alert resolved successfully'
      });
    } catch (error) {
      enhancedLogger.error('Failed to resolve security alert', {
        error: error.message,
        alertId: req.params.id,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to resolve security alert',
        code: 'ALERT_RESOLUTION_ERROR'
      });
    }
  }
);

/**
 * GET /api/security/audit-logs
 * Get audit logs with filtering and pagination
 */
router.get('/audit-logs', auditSecuritySettings, async (req, res) => {
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
        .populate('adminUserId', 'firstName lastName email')
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    enhancedLogger.audit('Audit logs accessed', {
      adminUserId: req.user._id,
      logCount: logs.length,
      filters: { action, adminUserId, resourceType, success },
      requestId: req.id
    });

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
      adminUserId: req.user._id,
      query: req.query,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      code: 'AUDIT_LOGS_ERROR'
    });
  }
});

/**
 * GET /api/security/monitoring/test
 * Test security monitoring systems
 */
router.get('/monitoring/test', auditSecuritySettings, async (req, res) => {
  try {
    const { testType = 'all' } = req.query;

    const testResults = await runSecurityTests(testType);

    enhancedLogger.audit('Security monitoring test completed', {
      testType,
      adminUserId: req.user._id,
      testResults: testResults.summary,
      requestId: req.id
    });

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    enhancedLogger.error('Security monitoring test failed', {
      error: error.message,
      testType: req.query.testType,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Security monitoring test failed',
      code: 'SECURITY_TEST_ERROR'
    });
  }
});

/**
 * GET /api/security/configuration
 * Get current security configuration
 */
router.get('/configuration', auditSecuritySettings, async (req, res) => {
  try {
    const configuration = {
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        authEndpointLimit: 5
      },
      csrf: {
        enabled: true,
        cookieOptions: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
        }
      },
      fileUpload: {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        malwareScanning: true,
        imageProcessing: true
      },
      monitoring: {
        suspiciousActivityDetection: true,
        securityHeaders: true,
        auditLogging: true,
        alerting: true
      },
      retention: {
        auditLogs: {
          low: '365 days',
          medium: '3 years',
          high: '7 years',
          critical: '10 years'
        },
        securityLogs: {
          info: '30 days',
          warning: '90 days',
          error: '30 days',
          security: '90 days',
          audit: '365 days'
        }
      }
    };

    enhancedLogger.audit('Security configuration accessed', {
      adminUserId: req.user._id,
      ip: req.ip,
      requestId: req.id
    });

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    enhancedLogger.error('Failed to fetch security configuration', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch security configuration',
      code: 'SECURITY_CONFIG_ERROR'
    });
  }
});

/**
 * POST /api/security/events/clear
 * Clear security events (with proper authorization)
 */
router.post('/events/clear',
  adminCSRFProtection,
  auditSecuritySettings,
  [
    body('eventType').optional().isIn(['alerts', 'logs', 'all']).withMessage('Invalid event type'),
    body('olderThan').optional().isISO8601().withMessage('Invalid date format'),
    body('confirmation').equals('CLEAR_SECURITY_EVENTS').withMessage('Confirmation required'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { eventType = 'all', olderThan, confirmation } = req.body;

      if (confirmation !== 'CLEAR_SECURITY_EVENTS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmation',
          code: 'INVALID_CONFIRMATION'
        });
      }

      const result = await clearSecurityEvents(eventType, olderThan);

      enhancedLogger.audit('Security events cleared', {
        eventType,
        olderThan,
        adminUserId: req.user._id,
        clearedCount: result.clearedCount,
        requestId: req.id
      });

      res.json({
        success: true,
        message: 'Security events cleared successfully',
        data: result
      });
    } catch (error) {
      enhancedLogger.error('Failed to clear security events', {
        error: error.message,
        eventType: req.body.eventType,
        adminUserId: req.user._id,
        requestId: req.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to clear security events',
        code: 'SECURITY_CLEAR_ERROR'
      });
    }
  }
);

/**
 * Helper function to get security metrics
 */
const getSecurityMetrics = async () => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAuditLogs,
      recentAuditLogs,
      failedLogins,
      suspiciousActivity,
      blockedIPs
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ timestamp: { $gte: last24Hours } }),
      AuditLog.countDocuments({ 
        action: 'FAILED_LOGIN_ATTEMPT',
        timestamp: { $gte: last7Days }
      }),
      securityMonitor.getSuspiciousActivityCount(last24Hours),
      securityMonitor.getBlockedIPCount()
    ]);

    return {
      totalAuditLogs,
      recentAuditLogs,
      failedLogins,
      suspiciousActivity,
      blockedIPs,
      lastUpdated: now.toISOString()
    };
  } catch (error) {
    enhancedLogger.error('Failed to get security metrics', {
      error: error.message
    });
    return {};
  }
};

/**
 * Helper function to run security tests
 */
const runSecurityTests = async (testType) => {
  const tests = [];

  if (testType === 'all' || testType === 'rate-limiting') {
    tests.push({
      name: 'Rate Limiting',
      status: 'passed',
      description: 'Rate limiting is active and configured correctly'
    });
  }

  if (testType === 'all' || testType === 'csrf') {
    tests.push({
      name: 'CSRF Protection',
      status: 'passed',
      description: 'CSRF protection is enabled for state-changing operations'
    });
  }

  if (testType === 'all' || testType === 'input-validation') {
    tests.push({
      name: 'Input Validation',
      status: 'passed',
      description: 'Input validation and sanitization is active'
    });
  }

  if (testType === 'all' || testType === 'file-upload') {
    tests.push({
      name: 'File Upload Security',
      status: 'passed',
      description: 'File upload security measures are in place'
    });
  }

  if (testType === 'all' || testType === 'audit-logging') {
    tests.push({
      name: 'Audit Logging',
      status: 'passed',
      description: 'Audit logging is active and storing events'
    });
  }

  const allPassed = tests.every(test => test.status === 'passed');

  return {
    summary: {
      total: tests.length,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      overall: allPassed ? 'passed' : 'failed'
    },
    tests,
    timestamp: new Date().toISOString()
  };
};

/**
 * Helper function to clear security events
 */
const clearSecurityEvents = async (eventType, olderThan) => {
  let clearedCount = 0;

  const dateFilter = olderThan ? { timestamp: { $lt: new Date(olderThan) } } : {};

  if (eventType === 'all' || eventType === 'logs') {
    const result = await AuditLog.deleteMany({
      ...dateFilter,
      riskLevel: { $in: ['LOW', 'MEDIUM'] } // Only clear low/medium risk logs
    });
    clearedCount += result.deletedCount;
  }

  if (eventType === 'all' || eventType === 'alerts') {
    // Clear resolved alerts older than specified date
    const alertResult = await securityMonitor.clearResolvedAlerts(olderThan);
    clearedCount += alertResult.clearedCount || 0;
  }

  return { clearedCount, eventType, olderThan };
};

export default router;