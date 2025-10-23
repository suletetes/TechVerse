import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';

/**
 * Sentry Configuration for Error Tracking and Security Monitoring
 */
class SentryConfig {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize Sentry with comprehensive monitoring
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    const dsn = process.env.SENTRY_DSN;
    const environment = process.env.NODE_ENV || 'development';
    const release = process.env.npm_package_version || '1.0.0';

    if (!dsn) {
      logger.warn('Sentry DSN not configured, skipping Sentry initialization');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release: `techverse-server@${release}`,
        
        // Performance monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        
        // Integrations
        integrations: [
          // Enable HTTP instrumentation
          new Sentry.Integrations.Http({ tracing: true }),
          // Enable Express instrumentation
          new Sentry.Integrations.Express({ app: null }),
          // Enable MongoDB instrumentation
          new Sentry.Integrations.Mongo(),
          // Enable Redis instrumentation
          new Sentry.Integrations.Redis(),
        ],

        // Security and privacy settings
        beforeSend(event, hint) {
          // Filter sensitive data
          if (event.request) {
            // Remove sensitive headers
            const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
            if (event.request.headers) {
              sensitiveHeaders.forEach(header => {
                if (event.request.headers[header]) {
                  event.request.headers[header] = '[Filtered]';
                }
              });
            }

            // Remove sensitive query parameters
            if (event.request.query_string) {
              event.request.query_string = event.request.query_string
                .replace(/password=[^&]*/gi, 'password=[Filtered]')
                .replace(/token=[^&]*/gi, 'token=[Filtered]');
            }
          }

          // Filter sensitive data from extra context
          if (event.extra) {
            Object.keys(event.extra).forEach(key => {
              if (key.toLowerCase().includes('password') || 
                  key.toLowerCase().includes('token') ||
                  key.toLowerCase().includes('secret')) {
                event.extra[key] = '[Filtered]';
              }
            });
          }

          return event;
        },

        // Error filtering
        beforeSendTransaction(event) {
          // Filter out health check transactions in production
          if (environment === 'production' && 
              event.transaction && 
              event.transaction.includes('/health')) {
            return null;
          }
          return event;
        },

        // Additional options
        attachStacktrace: true,
        sendDefaultPii: false, // Don't send personally identifiable information
        maxBreadcrumbs: 50,
        debug: environment === 'development',
      });

      this.isInitialized = true;
      logger.info('Sentry initialized successfully', {
        environment,
        release: `techverse-server@${release}`,
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0
      });

    } catch (error) {
      logger.error('Failed to initialize Sentry', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Capture security event
   */
  captureSecurityEvent(message, extra = {}, level = 'warning') {
    if (!this.isInitialized) {
      return;
    }

    Sentry.withScope(scope => {
      scope.setTag('category', 'security');
      scope.setLevel(level);
      
      // Add security-specific context
      scope.setContext('security', {
        timestamp: new Date().toISOString(),
        ...extra
      });

      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Capture authentication event
   */
  captureAuthEvent(event, user, extra = {}) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.withScope(scope => {
      scope.setTag('category', 'authentication');
      scope.setUser({
        id: user?.id || user?._id,
        email: user?.email,
        role: user?.role
      });
      
      scope.setContext('auth_event', {
        event,
        timestamp: new Date().toISOString(),
        ...extra
      });

      Sentry.captureMessage(`Authentication event: ${event}`, 'info');
    });
  }

  /**
   * Capture performance issue
   */
  capturePerformanceIssue(operation, duration, threshold, extra = {}) {
    if (!this.isInitialized) {
      return;
    }

    if (duration > threshold) {
      Sentry.withScope(scope => {
        scope.setTag('category', 'performance');
        scope.setContext('performance', {
          operation,
          duration,
          threshold,
          timestamp: new Date().toISOString(),
          ...extra
        });

        Sentry.captureMessage(
          `Performance issue: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
          'warning'
        );
      });
    }
  }

  /**
   * Start transaction for performance monitoring
   */
  startTransaction(name, op = 'http') {
    if (!this.isInitialized) {
      return null;
    }

    return Sentry.startTransaction({
      name,
      op,
      tags: {
        category: 'performance'
      }
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  }

  /**
   * Set user context
   */
  setUser(user) {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser({
      id: user?.id || user?._id,
      email: user?.email,
      role: user?.role,
      ip_address: user?.ipAddress
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser(null);
  }

  /**
   * Get Sentry request handler for Express
   */
  getRequestHandler() {
    if (!this.isInitialized) {
      return (req, res, next) => next();
    }

    return Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'role'],
      request: ['method', 'url', 'headers', 'query_string'],
      serverName: false
    });
  }

  /**
   * Get Sentry tracing handler for Express
   */
  getTracingHandler() {
    if (!this.isInitialized) {
      return (req, res, next) => next();
    }

    return Sentry.Handlers.tracingHandler();
  }

  /**
   * Get Sentry error handler for Express
   */
  getErrorHandler() {
    if (!this.isInitialized) {
      return (error, req, res, next) => next(error);
    }

    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Only send 4xx and 5xx errors to Sentry
        return error.status >= 400;
      }
    });
  }

  /**
   * Flush Sentry events (useful for graceful shutdown)
   */
  async flush(timeout = 2000) {
    if (!this.isInitialized) {
      return true;
    }

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      logger.error('Failed to flush Sentry events', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Close Sentry client
   */
  async close(timeout = 2000) {
    if (!this.isInitialized) {
      return true;
    }

    try {
      return await Sentry.close(timeout);
    } catch (error) {
      logger.error('Failed to close Sentry client', {
        error: error.message
      });
      return false;
    }
  }
}

// Export singleton instance
export default new SentryConfig();