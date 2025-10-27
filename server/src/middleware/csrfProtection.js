import crypto from 'crypto';
import logger from '../utils/logger.js';
import enhancedLogger from '../utils/enhancedLogger.js';

/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection for state-changing operations
 */

/**
 * Custom CSRF protection implementation
 * Uses double-submit cookie pattern for better SPA compatibility
 */

// Generate CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate CSRF token
const validateCSRFToken = (req) => {
  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] || 
                     req.headers['csrf-token'] ||
                     req.body._csrf ||
                     req.query._csrf;

  return cookieToken && headerToken && cookieToken === headerToken;
};

// CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (!validateCSRFToken(req)) {
    const error = new Error('Invalid CSRF token');
    error.code = 'EBADCSRFTOKEN';
    return next(error);
  }

  next();
};

// CSRF token middleware - adds csrfToken method to request
export const addCSRFToken = (req, res, next) => {
  req.csrfToken = () => {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken();
    }
    return req.session.csrfToken;
  };
  next();
};

/**
 * CSRF token endpoint middleware
 * Provides CSRF tokens to authenticated clients
 */
export const csrfTokenEndpoint = (req, res, next) => {
  try {
    // Generate CSRF token
    const token = generateCSRFToken();
    
    // Set token in session and cookie
    req.session.csrfToken = token;
    res.cookie('csrf-token', token, {
      httpOnly: false, // Needs to be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000 // 1 hour
    });
    
    enhancedLogger.security('CSRF token generated', {
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    });

    res.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    enhancedLogger.error('Failed to generate CSRF token', {
      error: error.message,
      userId: req.user?._id,
      ip: req.ip,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      code: 'CSRF_TOKEN_ERROR'
    });
  }
};

/**
 * CSRF error handler
 * Handles CSRF token validation errors
 */
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    enhancedLogger.security('CSRF token validation failed', {
      error: err.message,
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      providedToken: req.body._csrf || req.headers['csrf-token'] || 'none',
      requestId: req.id
    });

    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'INVALID_CSRF_TOKEN'
    });
  }
  next(err);
};

/**
 * Conditional CSRF protection
 * Applies CSRF protection only to state-changing operations
 */
export const conditionalCSRF = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints that use other authentication methods
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/webhook' // Webhook endpoints
  ];

  const shouldSkip = skipPaths.some(path => req.originalUrl.startsWith(path));
  if (shouldSkip) {
    return next();
  }

  // Apply CSRF protection
  csrfProtection(req, res, next);
};

/**
 * CSRF protection for admin operations
 * Stricter CSRF protection for administrative functions
 */
export const adminCSRFProtection = (req, res, next) => {
  // Always require CSRF for admin operations (except GET)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Enhanced logging for admin operations
  const originalNext = next;
  next = (err) => {
    if (err && err.code === 'EBADCSRFTOKEN') {
      enhancedLogger.security('Admin CSRF validation failed', {
        adminUserId: req.user?._id,
        adminEmail: req.user?.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        severity: 'HIGH',
        requestId: req.id
      });
    }
    originalNext(err);
  };

  csrfProtection(req, res, next);
};

/**
 * Double-submit cookie pattern for SPA applications
 * Alternative CSRF protection for single-page applications
 */
export const doubleSubmitCookie = (req, res, next) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    enhancedLogger.security('Double-submit CSRF validation failed', {
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken,
      tokensMatch: cookieToken === headerToken,
      requestId: req.id
    });

    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }

  next();
};

/**
 * Set CSRF cookie for double-submit pattern
 */
export const setCSRFCookie = (req, res, next) => {
  if (req.user) {
    const token = require('crypto').randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false, // Needs to be accessible to JavaScript for double-submit
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000 // 1 hour
    });
  }
  next();
};

export default {
  csrfProtection,
  conditionalCSRF,
  adminCSRFProtection,
  doubleSubmitCookie,
  setCSRFCookie,
  csrfTokenEndpoint,
  csrfErrorHandler
};