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
  // Handle case where cookies might not be parsed
  const cookieToken = req.cookies ? req.cookies['csrf-token'] : null;
  const headerToken = req.headers['x-csrf-token'] || 
                     req.headers['csrf-token'] ||
                     req.body._csrf ||
                     req.query._csrf;
  
  // Check session token as well (for backward compatibility)
  const sessionToken = req.session ? req.session.csrfToken : null;

  // Method 1: Double-submit cookie pattern (primary method)
  const doubleSubmitValid = cookieToken && headerToken && cookieToken === headerToken;
  
  // Method 2: Session-based validation (for authenticated endpoints)
  const sessionValid = sessionToken && headerToken && sessionToken === headerToken;
  
  return doubleSubmitValid || sessionValid;
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
    
    // Initialize session if not exists
    if (!req.session) {
      console.warn('⚠️ Session not initialized, creating minimal session');
      req.session = {};
    }
    
    // Set token in session and cookie
    req.session.csrfToken = token;
    res.cookie('csrf-token', token, {
      httpOnly: false, // Needs to be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000 // 1 hour
    });
    
    // Simple console logging instead of enhanced logger
    console.log('✅ CSRF token generated for user:', req.user?._id || 'anonymous');

    res.json({
      success: true,
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('❌ Failed to generate CSRF token:', error.message);
    console.error('Stack trace:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      code: 'CSRF_TOKEN_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    '/api/auth/logout',
    '/api/auth/refresh',
    '/api/auth/profile',
    '/api/users/profile',
    '/api/admin/profile',
    '/api/cart', // Cart API endpoints
    '/api/wishlist', // Wishlist API endpoints
    '/api/reviews', // Review API endpoints
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

  const cookieToken = req.cookies ? req.cookies['csrf-token'] : null;
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