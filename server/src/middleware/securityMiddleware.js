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
    maxRetriesPerRequest: 2,
    lazyConnect: true,
    connectTimeout: 2000,
    commandTimeout: 2000,
    maxLoadingTimeout: 2000
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
  // Return a no-op middleware if rate limiting is disabled
  if (process.env.DISABLE_RATE_LIMITING === 'true') {
    return (req, res, next) => next();
  }
  
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
    // Skip for admin users (no logging to reduce noise)
    return req.user && req.user.role === 'admin';
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

          // Only log high-severity attacks
          if (patternType === 'SQL_INJECTION' || patternType === 'XSS') {
            enhancedLogger.security(`${patternType} attempt detected`, {
              ip: identifier,
              endpoint: req.originalUrl,
              pattern: pattern.toString().substring(0, 50),
              requestId: req.id
            });
          }

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
 * Blob URL and problematic request handler - ELIMINATES LOG SPAM
 */
export const blobUrlHandler = (req, res, next) => {
  const url = req.originalUrl;
  
  // Handle blob URLs and other problematic requests that cause log spam
  if (url.includes('blob:') || 
      url.includes('chrome-extension:') || 
      url.includes('moz-extension:') ||
      url.includes('webkit-fake-url:') ||
      url.includes('capacitor://')) {
    
    // Return 404 immediately without any logging
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      code: 'NOT_FOUND'
    });
  }
  
  next();
};

/**
 * Static asset 404 handler - reduces noise from missing images/assets
 */
export const staticAsset404Handler = (req, res, next) => {
  // Check if this is a request for a static asset
  const isStaticAsset = /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(req.originalUrl);
  
  if (isStaticAsset) {
    // Simple in-memory cache to avoid spam logging (with size limit)
    if (!staticAsset404Handler._loggedAssets) {
      staticAsset404Handler._loggedAssets = new Set();
    }
    
    const assetPath = req.originalUrl;
    const cacheKey = `missing_asset_${assetPath}`;
    
    // Only log first occurrence and limit cache size
    if (!staticAsset404Handler._loggedAssets.has(cacheKey)) {
      // Clear cache if it gets too large (prevent memory leak)
      if (staticAsset404Handler._loggedAssets.size > 100) {
        staticAsset404Handler._loggedAssets.clear();
      }
      
      staticAsset404Handler._loggedAssets.add(cacheKey);
      enhancedLogger.warn('Static asset not found', {
        url: assetPath,
        category: 'static_assets'
      });
    }
    
    // Return 404 for static assets without further processing
    return res.status(404).json({
      success: false,
      message: 'Asset not found',
      code: 'ASSET_NOT_FOUND'
    });
  }
  
  next();
};

/**
 * Suspicious activity detection middleware - REDUCED LOGGING
 */
export const suspiciousActivityDetector = (req, res, next) => {
  const identifier = req.ip;
  const userAgent = req.get('User-Agent');
  const endpoint = req.originalUrl;

  // Skip suspicious activity detection for static assets and common endpoints
  const skipDetection = /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(endpoint) ||
                       endpoint.includes('/health') ||
                       endpoint.includes('/ping') ||
                       endpoint.includes('/api/admin/dashboard');
  
  if (skipDetection) {
    return next();
  }

  // Check for suspicious patterns (only serious ones)
  const suspiciousIndicators = [];

  // Only flag truly suspicious User-Agents
  if (!userAgent) {
    suspiciousIndicators.push('missing_user_agent');
  } else if (/sqlmap|nikto|nmap|masscan|zap|burp/i.test(userAgent)) {
    suspiciousIndicators.push('attack_tool_user_agent');
  }

  // Check for admin endpoint access without authentication (high priority)
  if (endpoint.includes('/admin') && !req.user && req.method !== 'OPTIONS') {
    suspiciousIndicators.push('unauthenticated_admin_access');
  }

  // Only track and log if we have serious indicators (reduced threshold)
  if (suspiciousIndicators.length > 0 && suspiciousIndicators.includes('attack_tool_user_agent')) {
    securityMonitor.trackSuspiciousRequest(identifier, {
      endpoint,
      userAgent,
      indicators: suspiciousIndicators,
      method: req.method,
      userId: req.user?._id
    });

    enhancedLogger.security('High-risk suspicious activity detected', {
      ip: identifier,
      endpoint,
      indicators: suspiciousIndicators,
      method: req.method,
      requestId: req.id
    });
  }

  next();
};

/**
 * Failed authentication tracking middleware - REDUCED LOGGING
 */
export const trackFailedAuth = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Only track actual authentication failures (not general 401s)
    if ((res.statusCode === 401 || res.statusCode === 403) && 
        (req.originalUrl.includes('/auth') || req.originalUrl.includes('/login'))) {
      
      const identifier = req.body?.email || req.ip;

      securityMonitor.trackFailedLogin(identifier, {
        endpoint: req.originalUrl,
        ip: req.ip,
        statusCode: res.statusCode
      });

      // Only log failed login attempts, not all 401s
      enhancedLogger.auth('warn', 'Login attempt failed', {
        identifier: typeof identifier === 'string' && identifier.includes('@') ?
          identifier.replace(/(.{3}).*(@.*)/, '$1***$2') : identifier,
        endpoint: req.originalUrl,
        ip: req.ip,
        requestId: req.id
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security audit logging middleware - REDUCED LOGGING
 */
export const securityAuditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Skip logging for static assets and common non-critical requests
  const skipLogging = (url) => {
    // Skip static assets
    if (/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(url)) {
      return true;
    }
    
    // Skip problematic URLs that cause log spam
    if (url.includes('blob:') || 
        url.includes('chrome-extension:') || 
        url.includes('moz-extension:')) {
      return true;
    }
    
    // Skip health checks and monitoring endpoints
    if (url.includes('/health') || url.includes('/ping') || url.includes('/status')) {
      return true;
    }
    
    // Skip favicon and common browser requests
    if (url.includes('favicon') || 
        url.includes('apple-touch-icon') || 
        url.includes('manifest.json') ||
        url.includes('robots.txt') ||
        url.includes('sitemap.xml')) {
      return true;
    }
    
    // Skip dashboard polling and categories polling (reduces spam)
    if (url.includes('/api/admin/dashboard') || url.includes('/api/admin/categories')) {
      return true;
    }
    
    return false;
  };

  const shouldLog = !skipLogging(req.originalUrl);

  // Only log request start for critical endpoints (auth, admin actions)
  const isCritical = req.originalUrl.includes('/auth') || 
                    req.originalUrl.includes('/admin') || 
                    req.method !== 'GET';

  if (shouldLog && isCritical) {
    enhancedLogger.audit('Request started', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?._id,
      requestId: req.id
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Only log completed requests for errors or critical endpoints
    if ((shouldLog && isCritical) || res.statusCode >= 400) {
      enhancedLogger.audit('Request completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userId: req.user?._id,
        requestId: req.id
      });
    }

    // Track performance issues only for slow requests (10+ seconds)
    if (duration > 10000) {
      enhancedLogger.performance('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration,
        requestId: req.id
      });

      sentryConfig.capturePerformanceIssue(
        `${req.method} ${req.originalUrl}`,
        duration,
        10000,
        {
          ip: req.ip,
          userId: req.user?._id
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
  blobUrlHandler,
  staticAsset404Handler,
  suspiciousActivityDetector,
  trackFailedAuth,
  securityAuditLogger
};