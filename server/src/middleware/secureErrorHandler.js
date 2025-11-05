import enhancedLogger from '../utils/enhancedLogger.js';

/**
 * Secure Error Handler Middleware
 * Prevents information leakage while providing proper error responses
 */

/**
 * Security-focused error handler that prevents information disclosure
 */
export const secureErrorHandler = (err, req, res, next) => {
  // Log the full error details for debugging
  enhancedLogger.error('Application error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    requestId: req.id,
    body: req.body ? JSON.stringify(req.body).substring(0, 500) : null,
    query: req.query,
    params: req.params
  });

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = 'An error occurred';
  let code = 'INTERNAL_ERROR';
  let details = null;

  // Handle specific error types securely
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    
    // Only include validation details in development
    if (process.env.NODE_ENV === 'development') {
      details = Object.values(err.errors).map(e => e.message);
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
    code = 'INVALID_FORMAT';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    code = 'TOKEN_EXPIRED';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = 'File upload error';
    }
  } else if (err.message && err.message.includes('ENOENT')) {
    statusCode = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (err.message && err.message.includes('EACCES')) {
    statusCode = 403;
    message = 'Access denied';
    code = 'ACCESS_DENIED';
  } else if (statusCode === 404) {
    message = 'Resource not found';
    code = 'NOT_FOUND';
  } else if (statusCode === 403) {
    message = 'Access forbidden';
    code = 'FORBIDDEN';
  } else if (statusCode === 401) {
    message = 'Authentication required';
    code = 'UNAUTHORIZED';
  } else if (statusCode >= 400 && statusCode < 500) {
    message = 'Bad request';
    code = 'BAD_REQUEST';
  }

  // Security logging for suspicious errors
  if (statusCode === 403 || statusCode === 401) {
    enhancedLogger.security('Access control violation', {
      statusCode,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id,
      requestId: req.id
    });
  }

  // Rate limit error responses to prevent information gathering
  if (req.rateLimit && req.rateLimit.remaining < 5) {
    enhancedLogger.security('High error rate detected', {
      ip: req.ip,
      remaining: req.rateLimit.remaining,
      url: req.originalUrl,
      requestId: req.id
    });
  }

  // Prepare response
  const errorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  // Only include error details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = err.message;
    if (details) {
      errorResponse.details = details;
    }
    // Include stack trace only for 500 errors in development
    if (statusCode >= 500) {
      errorResponse.stack = err.stack;
    }
  }

  // Send secure error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler that doesn't leak path information - REDUCED LOGGING
 */
export const secureNotFoundHandler = (req, res, next) => {
  const url = req.originalUrl;
  
  // Skip logging for problematic URLs that spam the logs
  const shouldSkipLogging = 
    url.includes('blob:') ||                           // Blob URLs from frontend
    url.includes('chrome-extension:') ||               // Browser extension requests
    url.includes('moz-extension:') ||                  // Firefox extension requests
    /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(url) || // Static assets
    url.includes('favicon') ||                         // Favicon requests
    url.includes('apple-touch-icon') ||                // iOS icon requests
    url.includes('manifest.json') ||                   // PWA manifest
    url.includes('robots.txt') ||                      // SEO files
    url.includes('sitemap.xml');                       // SEO files

  // Only log legitimate 404s that might indicate real issues
  if (!shouldSkipLogging) {
    // Use a simple cache to avoid logging the same 404 repeatedly
    if (!secureNotFoundHandler._logged404s) {
      secureNotFoundHandler._logged404s = new Set();
    }
    
    const cacheKey = `${req.method}:${url}`;
    if (!secureNotFoundHandler._logged404s.has(cacheKey)) {
      // Clear cache if it gets too large
      if (secureNotFoundHandler._logged404s.size > 50) {
        secureNotFoundHandler._logged404s.clear();
      }
      
      secureNotFoundHandler._logged404s.add(cacheKey);
      enhancedLogger.warn('Route not found', {
        url: url,
        method: req.method,
        ip: req.ip,
        requestId: req.id
      });
    }
  }

  res.status(404).json({
    success: false,
    message: 'Resource not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
};

/**
 * Async error wrapper to catch unhandled promise rejections
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global unhandled error handlers
 */
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    enhancedLogger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
      pid: process.pid
    });

    // Graceful shutdown
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    enhancedLogger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
      pid: process.pid
    });

    // Graceful shutdown
    process.exit(1);
  });

  // Handle SIGTERM gracefully
  process.on('SIGTERM', () => {
    enhancedLogger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  // Handle SIGINT gracefully
  process.on('SIGINT', () => {
    enhancedLogger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
};

/**
 * Request sanitization middleware to prevent XSS and injection
 */
export const sanitizeRequest = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key name
    const sanitizedKey = sanitizeValue(key);
    
    // Recursively sanitize value
    sanitized[sanitizedKey] = sanitizeObject(value);
  }

  return sanitized;
};

/**
 * Sanitize individual values
 */
const sanitizeValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove potentially dangerous characters and patterns
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Security headers middleware enhancement
 */
export const enhancedSecurityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

export default {
  secureErrorHandler,
  secureNotFoundHandler,
  asyncErrorHandler,
  setupGlobalErrorHandlers,
  sanitizeRequest,
  enhancedSecurityHeaders
};