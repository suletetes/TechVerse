import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import securityMonitor from '../utils/securityMonitor.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import sentryConfig from '../config/sentry.js';

/**
 * Enhanced Security Middleware with Redis-based rate limiting and monitoring
 */

// Redis client for rate limiting
let redisClient = null;
try {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  redisClient = new Redis(redisUrl, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  });

  redisClient.on('error', (error) => {
    enhancedLogger.warn('Redis rate limit store error', {
      error: error.message,
      category: 'security'
    });
  });
} catch (error) {
  enhancedLogger.warn('Failed to initialize Redis for rate limiting', {
    error: error.message,
    category: 'security'
  });
}

/**
 * Enhanced rate limiting with security monitoring
 */
export const createSecureRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => {
      // Use combination of IP and user ID for authenticated requests
      const baseKey = req.user ? `${req.ip}-${req.user._id}` : req.ip;
      const endpoint = req.route?.path || req.originalUrl;
      return `rate_limit:${baseKey}:${endpoint}`;
    },
    // Use Redis store if available
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:'
    }) : undefined,
    handler: (req, res, next) => {
      const identifier = req.ip;
      const endpoint = req.originalUrl;

      // Track rate limit hit
      securityMonitor.trackRateLimitHit(identifier, {
        endpoint,
        userAgent: req.get('User-Agent'),
        userId: req.user?._id,
        method: req.method
      });

      enhancedLogger.security('Rate limit exceeded', {
        ip: identifier,
        endpoint,
        userAgent: req.get('User-Agent'),
        userId: req.user?._id,
        method: req.method,
        requestId: req.id
      });

      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(options.windowMs / 1000) || 900
      });
    },
    onLimitReached: (req, res, options) => {
      const identifier = req.ip;

      enhancedLogger.security('Rate limit threshold reached', {
        ip: identifier,
        endpoint: req.originalUrl,
        limit: options.max,
        windowMs: options.windowMs,
        requestId: req.id
      });

      // Send to Sentry
      sentryConfig.captureSecurityEvent(
        'Rate limit threshold reached',
        {
          ip: identifier,
          endpoint: req.originalUrl,
          limit: options.max,
          windowMs: options.windowMs
        },
        'warning'
      );
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = createSecureRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const limits = {
      '/login': process.env.NODE_ENV === 'production' ? 5 : 10,
      '/register': process.env.NODE_ENV === 'production' ? 3 : 5,
      '/forgot-password': process.env.NODE_ENV === 'production' ? 3 : 5,
      '/reset-password': process.env.NODE_ENV === 'production' ? 5 : 10
    };

    const endpoint = req.originalUrl.split('?')[0];
    for (const [path, limit] of Object.entries(limits)) {
      if (endpoint.includes(path)) return limit;
    }

    return process.env.NODE_ENV === 'production' ? 10 : 20;
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const endpoint = req.originalUrl.split('?')[0];
    const userIdentifier = req.body?.email || req.ip;
    return `auth_rate_limit:${req.ip}:${userIdentifier}:${endpoint}`;
  }
});

/**
 * API rate limiting
 */
export const apiRateLimit = createSecureRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for general API usage
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Sensitive operations rate limiting
 */
export const sensitiveRateLimit = createSecureRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => {
    const baseKey = req.user ? `${req.ip}-${req.user._id}` : req.ip;
    return `sensitive:${baseKey}`;
  },
  skip: (req) => {
    // Skip for admin users but still log
    if (req.user && req.user.role === 'admin') {
      enhancedLogger.info('Admin bypassed sensitive rate limit', {
        userId: req.user._id,
        ip: req.ip,
        endpoint: req.originalUrl,
        requestId: req.id
      });
      return true;
    }
    return false;
  }
});

/**
 * Security headers middleware
 */
export const securityHeaders = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server information
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Input validation and sanitization middleware
 */
export const inputSanitization = (req, res, next) => {
  // Skip sanitization for all API endpoints - they have their own validation
  // Only apply to non-API routes (like static file uploads, etc.)
  if (req.originalUrl.startsWith('/api/')) {
    return next();
  }

  const suspiciousPatterns = [
    // SQL injection-ish tokens (single regex, case-insensitive)
    /\b(?:union|select|insert|delete|update|drop|create|alter|exec|execute)\b/i,
    /'|;|\\;/,                      // single-quote or semicolon or escaped-semicolon (loose check)
    /--/,                            // SQL comment token
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,                   // event handlers like onmouseover=
    // Path traversal
    /\.\.\//g,
    /\.\.\\/g,
    // Command injection / shell metacharacters (removed ! to allow in passwords)
    /[;&|`$(){}\[\]]/g
  ];

  const checkForSuspiciousContent = (obj, path = '') => {
    if (typeof obj === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(obj)) {
          const identifier = req.ip;
          const patternType = pattern.toString().includes('union|select') ? 'SQL_INJECTION' :
            pattern.toString().includes('script') ? 'XSS' : 'SUSPICIOUS_INPUT';

          enhancedLogger.security(`${patternType} attempt detected`, {
            ip: identifier,
            userAgent: req.get('User-Agent'),
            endpoint: req.originalUrl,
            path,
            pattern: pattern.toString(),
            content: obj.substring(0, 100),
            userId: req.user?._id,
            requestId: req.id
          });

          // Track specific attack types
          if (patternType === 'SQL_INJECTION') {
            securityMonitor.trackSQLInjectionAttempt(identifier, {
              endpoint: req.originalUrl,
              userAgent: req.get('User-Agent'),
              pattern: pattern.toString()
            });
          } else if (patternType === 'XSS') {
            securityMonitor.trackXSSAttempt(identifier, {
              endpoint: req.originalUrl,
              userAgent: req.get('User-Agent'),
              pattern: pattern.toString()
            });
          }

          return res.status(400).json({
            success: false,
            message: 'Invalid input detected',
            code: 'INVALID_INPUT'
          });
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const result = checkForSuspiciousContent(value, `${path}.${key}`);
        if (result) return result;
      }
    }
    return null;
  };

  // Check request body
  if (req.body) {
    const result = checkForSuspiciousContent(req.body, 'body');
    if (result) return result;
  }

  // Check query parameters
  if (req.query) {
    const result = checkForSuspiciousContent(req.query, 'query');
    if (result) return result;
  }

  // Check URL parameters
  if (req.params) {
    const result = checkForSuspiciousContent(req.params, 'params');
    if (result) return result;
  }

  next();
};

/**
 * Suspicious activity detection middleware
 */
export const suspiciousActivityDetector = (req, res, next) => {
  const identifier = req.ip;
  const userAgent = req.get('User-Agent');
  const endpoint = req.originalUrl;

  // Check for suspicious patterns
  const suspiciousIndicators = [];

  // Missing or suspicious User-Agent
  if (!userAgent || userAgent.length < 10 ||
    /bot|crawler|spider|scraper/i.test(userAgent)) {
    suspiciousIndicators.push('suspicious_user_agent');
  }

  // Unusual request patterns
  if (req.method === 'POST' && !req.body) {
    suspiciousIndicators.push('empty_post_body');
  }

  // Suspicious headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
  const headerCount = suspiciousHeaders.filter(header => req.get(header)).length;
  if (headerCount > 2) {
    suspiciousIndicators.push('multiple_proxy_headers');
  }

  // Check for admin endpoint access without authentication
  if (endpoint.includes('/admin') && !req.user) {
    suspiciousIndicators.push('unauthenticated_admin_access');
  }

  // Track suspicious activity
  if (suspiciousIndicators.length > 0) {
    securityMonitor.trackSuspiciousRequest(identifier, {
      endpoint,
      userAgent,
      indicators: suspiciousIndicators,
      method: req.method,
      userId: req.user?._id
    });

    enhancedLogger.security('Suspicious activity detected', {
      ip: identifier,
      endpoint,
      userAgent,
      indicators: suspiciousIndicators,
      method: req.method,
      userId: req.user?._id,
      requestId: req.id
    });
  }

  next();
};

/**
 * Failed authentication tracking middleware
 */
export const trackFailedAuth = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Check if this is a failed authentication response
    if (res.statusCode === 401 || res.statusCode === 403) {
      const identifier = req.body?.email || req.ip;

      securityMonitor.trackFailedLogin(identifier, {
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        method: req.method,
        statusCode: res.statusCode
      });

      enhancedLogger.auth('warn', 'Authentication failed', {
        identifier: typeof identifier === 'string' && identifier.includes('@') ?
          identifier.replace(/(.{3}).*(@.*)/, '$1***$2') : identifier,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        statusCode: res.statusCode,
        requestId: req.id
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security audit logging middleware
 */
export const securityAuditLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request start
  enhancedLogger.audit('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    enhancedLogger.audit('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?._id,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });

    // Track performance issues
    if (duration > 5000) { // 5 seconds threshold
      enhancedLogger.performance('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration,
        threshold: 5000,
        requestId: req.id
      });

      sentryConfig.capturePerformanceIssue(
        `${req.method} ${req.originalUrl}`,
        duration,
        5000,
        {
          ip: req.ip,
          userId: req.user?._id,
          userAgent: req.get('User-Agent')
        }
      );
    }

    return originalEnd.apply(this, args);
  };

  next();
};

export default {
  createSecureRateLimit,
  authRateLimit,
  apiRateLimit,
  sensitiveRateLimit,
  securityHeaders,
  inputSanitization,
  suspiciousActivityDetector,
  trackFailedAuth,
  securityAuditLogger
};