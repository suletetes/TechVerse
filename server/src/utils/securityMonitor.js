import logger from './logger.js';
import sentryConfig from '../config/sentry.js';

/**
 * Security Monitoring and Alert System
 */
class SecurityMonitor {
  constructor() {
    this.alertThresholds = {
      failedLogins: {
        count: 5,
        window: 15 * 60 * 1000 // 15 minutes
      },
      suspiciousRequests: {
        count: 50,
        window: 5 * 60 * 1000 // 5 minutes
      },
      rateLimitHits: {
        count: 10,
        window: 10 * 60 * 1000 // 10 minutes
      },
      validationFailures: {
        count: 10,
        window: 15 * 60 * 1000 // 15 minutes
      }
    };

    this.securityEvents = new Map();
    this.alertCooldowns = new Map();
  }

  /**
   * Track security event
   */
  trackEvent(eventType, identifier, metadata = {}) {
    const now = Date.now();
    const key = `${eventType}:${identifier}`;
    
    if (!this.securityEvents.has(key)) {
      this.securityEvents.set(key, []);
    }

    const events = this.securityEvents.get(key);
    events.push({ timestamp: now, metadata });

    // Clean old events
    const threshold = this.alertThresholds[eventType];
    if (threshold) {
      const cutoff = now - threshold.window;
      const recentEvents = events.filter(event => event.timestamp > cutoff);
      this.securityEvents.set(key, recentEvents);

      // Check if threshold exceeded
      if (recentEvents.length >= threshold.count) {
        this.triggerAlert(eventType, identifier, recentEvents, metadata);
      }
    }

    // Log the event
    logger.warn(`Security event: ${eventType}`, {
      identifier,
      eventCount: events.length,
      metadata,
      timestamp: new Date(now).toISOString()
    });
  }

  /**
   * Trigger security alert
   */
  triggerAlert(eventType, identifier, events, metadata = {}) {
    const alertKey = `${eventType}:${identifier}`;
    const now = Date.now();
    
    // Check cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlert = this.alertCooldowns.get(alertKey);
      if (now - lastAlert < 30 * 60 * 1000) { // 30 minute cooldown
        return;
      }
    }

    this.alertCooldowns.set(alertKey, now);

    const alertData = {
      eventType,
      identifier,
      eventCount: events.length,
      timeWindow: this.alertThresholds[eventType]?.window,
      firstEvent: new Date(events[0].timestamp).toISOString(),
      lastEvent: new Date(events[events.length - 1].timestamp).toISOString(),
      metadata
    };

    // Log critical alert
    logger.error(`SECURITY ALERT: ${eventType} threshold exceeded`, alertData);

    // Send to Sentry
    sentryConfig.captureSecurityEvent(
      `Security alert: ${eventType} threshold exceeded`,
      alertData,
      'error'
    );

    // In production, you might want to send to external alerting systems
    if (process.env.NODE_ENV === 'production') {
      this.sendExternalAlert(eventType, alertData);
    }
  }

  /**
   * Send alert to external systems (webhook, email, etc.)
   */
  async sendExternalAlert(eventType, alertData) {
    try {
      // Example: Send to webhook
      if (process.env.SECURITY_WEBHOOK_URL) {
        const response = await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SECURITY_WEBHOOK_TOKEN}`
          },
          body: JSON.stringify({
            alert: 'security_threshold_exceeded',
            severity: 'high',
            eventType,
            ...alertData,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`);
        }

        logger.info('Security alert sent to external webhook', {
          eventType,
          webhookStatus: response.status
        });
      }

      // Example: Send email alert
      if (process.env.SECURITY_EMAIL_ENABLED === 'true') {
        // Implementation would depend on your email service
        logger.info('Security email alert would be sent here', { eventType });
      }

    } catch (error) {
      logger.error('Failed to send external security alert', {
        eventType,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Track failed login attempt
   */
  trackFailedLogin(identifier, metadata = {}) {
    this.trackEvent('failedLogins', identifier, {
      ...metadata,
      type: 'authentication_failure'
    });
  }

  /**
   * Track suspicious request
   */
  trackSuspiciousRequest(identifier, metadata = {}) {
    this.trackEvent('suspiciousRequests', identifier, {
      ...metadata,
      type: 'suspicious_activity'
    });
  }

  /**
   * Track rate limit hit
   */
  trackRateLimitHit(identifier, metadata = {}) {
    this.trackEvent('rateLimitHits', identifier, {
      ...metadata,
      type: 'rate_limit_exceeded'
    });
  }

  /**
   * Track SQL injection attempt
   */
  trackSQLInjectionAttempt(identifier, metadata = {}) {
    // Immediate alert for SQL injection attempts
    logger.error('SQL injection attempt detected', {
      identifier,
      metadata,
      timestamp: new Date().toISOString()
    });

    sentryConfig.captureSecurityEvent(
      'SQL injection attempt detected',
      { identifier, ...metadata },
      'error'
    );
  }

  /**
   * Track XSS attempt
   */
  trackXSSAttempt(identifier, metadata = {}) {
    // Immediate alert for XSS attempts
    logger.error('XSS attempt detected', {
      identifier,
      metadata,
      timestamp: new Date().toISOString()
    });

    sentryConfig.captureSecurityEvent(
      'XSS attempt detected',
      { identifier, ...metadata },
      'error'
    );
  }

  /**
   * Track privilege escalation attempt
   */
  trackPrivilegeEscalation(identifier, metadata = {}) {
    // Immediate alert for privilege escalation
    logger.error('Privilege escalation attempt detected', {
      identifier,
      metadata,
      timestamp: new Date().toISOString()
    });

    sentryConfig.captureSecurityEvent(
      'Privilege escalation attempt detected',
      { identifier, ...metadata },
      'error'
    );
  }

  /**
   * Track unusual access pattern
   */
  trackUnusualAccess(identifier, metadata = {}) {
    this.trackEvent('suspiciousRequests', identifier, {
      ...metadata,
      type: 'unusual_access_pattern'
    });
  }

  /**
   * Get validation failures for an identifier
   */
  getValidationFailures(identifier) {
    const key = `validationFailures:${identifier}`;
    const events = this.securityEvents.get(key) || [];
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    const recentEvents = events.filter(event => now - event.timestamp < windowMs);
    
    return {
      count: recentEvents.length,
      events: recentEvents,
      lastFailure: recentEvents.length > 0 ? recentEvents[recentEvents.length - 1] : null
    };
  }

  /**
   * Track validation failure
   */
  trackValidationFailure(identifier, metadata = {}) {
    this.trackEvent('validationFailures', identifier, {
      ...metadata,
      type: 'validation_failure'
    });
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const stats = {
      totalEvents: 0,
      eventsByType: {},
      recentAlerts: [],
      activeThreats: 0
    };

    // Count events by type
    for (const [key, events] of this.securityEvents.entries()) {
      const [eventType] = key.split(':');
      stats.totalEvents += events.length;
      
      if (!stats.eventsByType[eventType]) {
        stats.eventsByType[eventType] = 0;
      }
      stats.eventsByType[eventType] += events.length;

      // Check for active threats (recent events above threshold)
      const threshold = this.alertThresholds[eventType];
      if (threshold) {
        const now = Date.now();
        const recentEvents = events.filter(
          event => now - event.timestamp < threshold.window
        );
        
        if (recentEvents.length >= threshold.count) {
          stats.activeThreats++;
        }
      }
    }

    return stats;
  }

  /**
   * Clear old events (cleanup)
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, events] of this.securityEvents.entries()) {
      const recentEvents = events.filter(
        event => now - event.timestamp < maxAge
      );
      
      if (recentEvents.length === 0) {
        this.securityEvents.delete(key);
      } else {
        this.securityEvents.set(key, recentEvents);
      }
    }

    // Clear old alert cooldowns
    for (const [key, timestamp] of this.alertCooldowns.entries()) {
      if (now - timestamp > 60 * 60 * 1000) { // 1 hour
        this.alertCooldowns.delete(key);
      }
    }

    logger.debug('Security monitor cleanup completed', {
      activeEvents: this.securityEvents.size,
      activeCooldowns: this.alertCooldowns.size
    });
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    logger.info('Security monitor cleanup scheduled');
  }
}

// Export singleton instance
export default new SecurityMonitor();