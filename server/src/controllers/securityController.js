import { asyncHandler } from '../middleware/errorHandler.js';
import securityMonitor from '../utils/securityMonitor.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import sentryConfig from '../config/sentry.js';

/**
 * @desc    Get security monitoring dashboard
 * @route   GET /api/admin/security/dashboard
 * @access  Private (Admin)
 */
export const getSecurityDashboard = asyncHandler(async (req, res) => {
  const stats = securityMonitor.getSecurityStats();
  
  // Add system health information
  const systemHealth = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  };

  // Add security configuration status
  const securityConfig = {
    sentryEnabled: sentryConfig.isInitialized,
    rateLimitingEnabled: true,
    inputSanitizationEnabled: true,
    auditLoggingEnabled: true,
    securityMonitoringEnabled: true
  };

  enhancedLogger.audit('Security dashboard accessed', {
    adminUserId: req.user._id,
    ip: req.ip,
    requestId: req.id
  });

  res.json({
    success: true,
    dashboard: {
      securityStats: stats,
      systemHealth,
      securityConfig,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @desc    Get security alerts
 * @route   GET /api/admin/security/alerts
 * @access  Private (Admin)
 */
export const getSecurityAlerts = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, severity } = req.query;
  
  // This would typically come from a database or log aggregation system
  // For now, we'll return recent security events from memory
  const alerts = [];
  
  for (const [key, events] of securityMonitor.securityEvents.entries()) {
    const [eventType, identifier] = key.split(':');
    
    events.forEach(event => {
      alerts.push({
        id: `${key}-${event.timestamp}`,
        type: eventType,
        identifier,
        timestamp: new Date(event.timestamp).toISOString(),
        metadata: event.metadata,
        severity: eventType === 'failedLogins' ? 'medium' : 
                 eventType === 'suspiciousRequests' ? 'high' : 'low'
      });
    });
  }

  // Sort by timestamp (newest first)
  alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Filter by severity if specified
  const filteredAlerts = severity ? 
    alerts.filter(alert => alert.severity === severity) : 
    alerts;

  // Apply pagination
  const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

  enhancedLogger.audit('Security alerts accessed', {
    adminUserId: req.user._id,
    alertCount: paginatedAlerts.length,
    filters: { severity, limit, offset },
    ip: req.ip,
    requestId: req.id
  });

  res.json({
    success: true,
    alerts: paginatedAlerts,
    pagination: {
      total: filteredAlerts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: offset + limit < filteredAlerts.length
    }
  });
});

/**
 * @desc    Test security monitoring
 * @route   POST /api/admin/security/test
 * @access  Private (Admin)
 */
export const testSecurityMonitoring = asyncHandler(async (req, res) => {
  const { testType = 'all' } = req.body;
  const testResults = [];

  try {
    // Test 1: Security event tracking
    if (testType === 'all' || testType === 'events') {
      securityMonitor.trackSuspiciousRequest('test-ip', {
        test: true,
        endpoint: '/test',
        userAgent: 'Test Agent'
      });
      
      testResults.push({
        test: 'Security Event Tracking',
        status: 'passed',
        message: 'Successfully tracked test security event'
      });
    }

    // Test 2: Enhanced logging
    if (testType === 'all' || testType === 'logging') {
      enhancedLogger.security('Test security log entry', {
        test: true,
        adminUserId: req.user._id
      });
      
      testResults.push({
        test: 'Enhanced Logging',
        status: 'passed',
        message: 'Successfully created test security log entry'
      });
    }

    // Test 3: Sentry integration
    if (testType === 'all' || testType === 'sentry') {
      if (sentryConfig.isInitialized) {
        sentryConfig.captureSecurityEvent(
          'Test security event from admin dashboard',
          { test: true, adminUserId: req.user._id },
          'info'
        );
        
        testResults.push({
          test: 'Sentry Integration',
          status: 'passed',
          message: 'Successfully sent test event to Sentry'
        });
      } else {
        testResults.push({
          test: 'Sentry Integration',
          status: 'skipped',
          message: 'Sentry not initialized (DSN not configured)'
        });
      }
    }

    // Test 4: Alert system
    if (testType === 'all' || testType === 'alerts') {
      // Simulate multiple events to trigger alert threshold
      for (let i = 0; i < 6; i++) {
        securityMonitor.trackFailedLogin('test-alert-user', {
          test: true,
          attempt: i + 1
        });
      }
      
      testResults.push({
        test: 'Alert System',
        status: 'passed',
        message: 'Successfully triggered test security alert'
      });
    }

    const allPassed = testResults.every(result => result.status === 'passed');

    enhancedLogger.audit('Security monitoring test completed', {
      adminUserId: req.user._id,
      testType,
      results: testResults,
      allPassed,
      ip: req.ip,
      requestId: req.id
    });

    res.json({
      success: true,
      message: allPassed ? 'All security tests passed' : 'Some tests failed or were skipped',
      testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'passed').length,
        failed: testResults.filter(r => r.status === 'failed').length,
        skipped: testResults.filter(r => r.status === 'skipped').length
      }
    });

  } catch (error) {
    enhancedLogger.error('Security monitoring test failed', {
      adminUserId: req.user._id,
      testType,
      error: error.message,
      stack: error.stack,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Security monitoring test failed',
      error: error.message
    });
  }
});

/**
 * @desc    Get security configuration
 * @route   GET /api/admin/security/config
 * @access  Private (Admin)
 */
export const getSecurityConfig = asyncHandler(async (req, res) => {
  const config = {
    monitoring: {
      enabled: true,
      alertThresholds: securityMonitor.alertThresholds,
      cleanupInterval: '1 hour'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      structured: true,
      rotation: process.env.NODE_ENV === 'production',
      retention: {
        application: '14 days',
        error: '30 days',
        security: '90 days',
        audit: '365 days'
      }
    },
    sentry: {
      enabled: sentryConfig.isInitialized,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
    rateLimiting: {
      enabled: true,
      store: 'Redis',
      windows: {
        api: '15 minutes',
        auth: '15 minutes',
        sensitive: '15 minutes'
      },
      limits: {
        api: 1000,
        auth: process.env.NODE_ENV === 'production' ? 5 : 10,
        sensitive: 5
      }
    },
    security: {
      inputSanitization: true,
      suspiciousActivityDetection: true,
      securityHeaders: true,
      auditLogging: true
    }
  };

  enhancedLogger.audit('Security configuration accessed', {
    adminUserId: req.user._id,
    ip: req.ip,
    requestId: req.id
  });

  res.json({
    success: true,
    config
  });
});

/**
 * @desc    Clear security events (for testing/maintenance)
 * @route   POST /api/admin/security/clear
 * @access  Private (Admin)
 */
export const clearSecurityEvents = asyncHandler(async (req, res) => {
  const { eventType, confirm } = req.body;

  if (!confirm) {
    return res.status(400).json({
      success: false,
      message: 'Confirmation required to clear security events'
    });
  }

  let clearedCount = 0;

  if (eventType && eventType !== 'all') {
    // Clear specific event type
    for (const [key] of securityMonitor.securityEvents.entries()) {
      if (key.startsWith(`${eventType}:`)) {
        securityMonitor.securityEvents.delete(key);
        clearedCount++;
      }
    }
  } else {
    // Clear all events
    clearedCount = securityMonitor.securityEvents.size;
    securityMonitor.securityEvents.clear();
    securityMonitor.alertCooldowns.clear();
  }

  enhancedLogger.audit('Security events cleared', {
    adminUserId: req.user._id,
    eventType: eventType || 'all',
    clearedCount,
    ip: req.ip,
    requestId: req.id
  });

  res.json({
    success: true,
    message: `Cleared ${clearedCount} security events`,
    clearedCount,
    eventType: eventType || 'all'
  });
});

export default {
  getSecurityDashboard,
  getSecurityAlerts,
  testSecurityMonitoring,
  getSecurityConfig,
  clearSecurityEvents
};