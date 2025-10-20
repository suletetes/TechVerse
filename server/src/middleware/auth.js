import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Authentication error codes for consistency with frontend
export const AuthErrorCodes = {
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_NOT_ACTIVE: 'TOKEN_NOT_ACTIVE',
  TOKEN_TOO_OLD: 'TOKEN_TOO_OLD',
  INVALID_AUDIENCE: 'INVALID_AUDIENCE',
  INVALID_ISSUER: 'INVALID_ISSUER',
  INVALID_TOKEN_PAYLOAD: 'INVALID_TOKEN_PAYLOAD',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_CLOSED: 'ACCOUNT_CLOSED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  ADMIN_REQUIRED: 'ADMIN_REQUIRED',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  OWNERSHIP_REQUIRED: 'OWNERSHIP_REQUIRED',
  EMAIL_VERIFICATION_REQUIRED: 'EMAIL_VERIFICATION_REQUIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTH_RATE_LIMIT_EXCEEDED: 'AUTH_RATE_LIMIT_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  ACCOUNT_TOO_NEW: 'ACCOUNT_TOO_NEW',
  AUTH_SERVICE_ERROR: 'AUTH_SERVICE_ERROR'
};

// User roles for consistency
export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Security configuration
const SECURITY_CONFIG = {
  MAX_TOKEN_AGE_DAYS: 30,
  CLOCK_TOLERANCE_SECONDS: 30,
  MIN_TOKEN_LENGTH: 10,
  ACCOUNT_LOCK_DURATION: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  MIN_ACCOUNT_AGE_HOURS: 24
};

/**
 * Enhanced authentication logging with consistent format
 */
const logAuthEvent = (level, message, req, additionalData = {}) => {
  const logData = {
    message,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: {
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    },
    ...additionalData
  };

  logger[level](logData);
};

/**
 * Create consistent error response
 */
const createAuthErrorResponse = (code, message, additionalData = {}) => ({
  success: false,
  message,
  code,
  timestamp: new Date().toISOString(),
  ...additionalData
});

// Enhanced JWT token verification with security improvements
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided', { 
        ip: req.ip, 
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.',
        code: AuthErrorCodes.NO_TOKEN,
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Check token format and length
    if (token.length < SECURITY_CONFIG.MIN_TOKEN_LENGTH) {
      logger.warn('Authentication failed: Invalid token format', { 
        ip: req.ip,
        tokenLength: token.length,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.',
        code: AuthErrorCodes.INVALID_TOKEN,
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify token with enhanced error handling and security validation
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER || 'techverse-api',
        audience: process.env.JWT_AUDIENCE || 'techverse-client',
        clockTolerance: SECURITY_CONFIG.CLOCK_TOLERANCE_SECONDS
      });
    } catch (jwtError) {
      logger.warn('JWT verification failed', { 
        error: jwtError.name,
        message: jwtError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        tokenLength: token.length
      });
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
          code: AuthErrorCodes.TOKEN_EXPIRED,
          expiredAt: jwtError.expiredAt,
          canRefresh: true,
          timestamp: new Date().toISOString()
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format.',
          code: AuthErrorCodes.INVALID_TOKEN,
          timestamp: new Date().toISOString()
        });
      }
      
      if (jwtError.name === 'NotBeforeError') {
        return res.status(401).json({
          success: false,
          message: 'Token not active yet.',
          code: AuthErrorCodes.TOKEN_NOT_ACTIVE,
          timestamp: new Date().toISOString()
        });
      }

      if (jwtError.name === 'InvalidAudienceError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token audience.',
          code: AuthErrorCodes.INVALID_AUDIENCE,
          timestamp: new Date().toISOString()
        });
      }

      if (jwtError.name === 'InvalidIssuerError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token issuer.',
          code: AuthErrorCodes.INVALID_ISSUER,
          timestamp: new Date().toISOString()
        });
      }
      
      throw jwtError;
    }
    
    // Enhanced token payload validation
    if (!decoded.id || !decoded.email || !decoded.role) {
      logger.warn('Authentication failed: Invalid token payload', { 
        userId: decoded.id,
        hasEmail: !!decoded.email,
        hasRole: !!decoded.role,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    // Validate token age (prevent very old tokens)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxTokenAge = SECURITY_CONFIG.MAX_TOKEN_AGE_DAYS * 24 * 60 * 60; // Convert days to seconds
    
    if (tokenAge > maxTokenAge) {
      logger.warn('Authentication failed: Token too old', { 
        userId: decoded.id,
        tokenAge: Math.floor(tokenAge / 86400), // days
        maxAge: SECURITY_CONFIG.MAX_TOKEN_AGE_DAYS,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token is too old. Please login again.',
        code: AuthErrorCodes.TOKEN_TOO_OLD,
        timestamp: new Date().toISOString()
      });
    }
    
    // Find user and exclude sensitive fields
    const user = await User.findById(decoded.id)
      .select('-password -emailVerificationToken -passwordResetToken')
      .lean();
    
    if (!user) {
      logger.warn('Authentication failed: User not found', { 
        userId: decoded.id,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Enhanced account status checks
    if (!user.isActive) {
      logger.warn('Authentication failed: Account inactive', { 
        userId: user._id,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      logger.warn('Authentication failed: Account locked', { 
        userId: user._id,
        lockUntil: user.lockUntil,
        ip: req.ip 
      });
      
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil,
        retryAfter: lockTimeRemaining * 60
      });
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      logger.warn('Authentication failed: Account suspended', { 
        userId: user._id,
        suspensionReason: user.suspensionReason,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Account is suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED',
        reason: user.suspensionReason
      });
    }

    if (user.accountStatus === 'pending') {
      logger.warn('Authentication failed: Email not verified', { 
        userId: user._id,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address to activate your account.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    if (user.accountStatus === 'closed') {
      logger.warn('Authentication failed: Account closed', { 
        userId: user._id,
        ip: req.ip 
      });
      
      return res.status(401).json({
        success: false,
        message: 'Account has been closed. Please contact support.',
        code: 'ACCOUNT_CLOSED'
      });
    }

    // Security: Check for suspicious activity
    const currentIp = req.ip;
    const currentUserAgent = req.get('User-Agent');
    
    // Log if IP or User-Agent changed (for security monitoring)
    if (user.ipAddress && user.ipAddress !== currentIp) {
      logger.info('IP address changed for user', {
        userId: user._id,
        oldIp: user.ipAddress,
        newIp: currentIp,
        userAgent: currentUserAgent
      });
    }

    // Update last activity with enhanced tracking
    await User.findByIdAndUpdate(user._id, { 
      lastActivity: new Date(),
      ipAddress: currentIp,
      userAgent: currentUserAgent
    }, { 
      new: false // Don't return the updated document for performance
    });

    // Attach user to request with additional security context
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.authContext = {
      tokenIssuedAt: new Date(decoded.iat * 1000),
      tokenExpiresAt: new Date(decoded.exp * 1000),
      ipAddress: currentIp,
      userAgent: currentUserAgent
    };
    
    logger.debug('User authenticated successfully', { 
      userId: user._id,
      role: user.role,
      ip: currentIp 
    });
    
    next();
    
  } catch (error) {
    logger.error('Authentication service error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });

    return res.status(500).json({
      success: false,
      message: 'Authentication service error.',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', { 
      userId: req.user._id, 
      role: req.user.role,
      endpoint: req.originalUrl 
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  logger.debug('Admin access granted', { userId: req.user._id });
  next();
};

// Check if user has specific role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.AUTH_REQUIRED, 'Authentication required.')
      );
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logAuthEvent('warn', 'Role access denied', req, {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      
      return res.status(403).json(
        createAuthErrorResponse(
          AuthErrorCodes.INSUFFICIENT_ROLE,
          `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
          { requiredRoles: allowedRoles, userRole: req.user.role }
        )
      );
    }
    
    next();
  };
};

// Check if user has specific permissions
export const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.AUTH_REQUIRED, 'Authentication required.')
      );
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    const userPermissions = req.user.permissions || [];
    
    // Admin users have all permissions
    if (req.user.role === UserRoles.ADMIN || req.user.role === UserRoles.SUPER_ADMIN) {
      return next();
    }
    
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      logAuthEvent('warn', 'Permission access denied', req, {
        userId: req.user._id,
        userRole: req.user.role,
        userPermissions,
        requiredPermissions
      });
      
      return res.status(403).json(
        createAuthErrorResponse(
          AuthErrorCodes.INSUFFICIENT_PERMISSIONS,
          `Access denied. Required permissions: ${requiredPermissions.join(' or ')}.`,
          { 
            requiredPermissions, 
            userPermissions,
            userRole: req.user.role 
          }
        )
      );
    }
    
    next();
  };
};

// Check if user has all specified permissions
export const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.AUTH_REQUIRED, 'Authentication required.')
      );
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    const userPermissions = req.user.permissions || [];
    
    // Admin users have all permissions
    if (req.user.role === UserRoles.ADMIN || req.user.role === UserRoles.SUPER_ADMIN) {
      return next();
    }
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission => 
        !userPermissions.includes(permission)
      );
      
      logAuthEvent('warn', 'Insufficient permissions', req, {
        userId: req.user._id,
        userRole: req.user.role,
        userPermissions,
        requiredPermissions,
        missingPermissions
      });
      
      return res.status(403).json(
        createAuthErrorResponse(
          AuthErrorCodes.INSUFFICIENT_PERMISSIONS,
          `Access denied. Missing permissions: ${missingPermissions.join(', ')}.`,
          { 
            requiredPermissions, 
            missingPermissions,
            userPermissions,
            userRole: req.user.role 
          }
        )
      );
    }
    
    next();
  };
};

// Optional authentication (for routes that work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id)
          .select('-password -emailVerificationToken -passwordResetToken')
          .lean();
        
        if (user && user.isActive && user.accountStatus === 'active' && 
            (!user.lockUntil || user.lockUntil <= Date.now())) {
          req.user = user;
          req.userId = user._id;
          
          // Update last activity for authenticated users
          await User.findByIdAndUpdate(user._id, { 
            lastActivity: new Date() 
          });
        }
      } catch (tokenError) {
        // Invalid token, but continue without auth for optional routes
        logger.debug('Optional auth failed, continuing without authentication', {
          error: tokenError.message
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication error', error);
    // Continue without authentication for optional auth
    next();
  }
};

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (resourceUserField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource user ID from various sources
      let resourceUserId = null;
      
      if (req.resource && req.resource[resourceUserField]) {
        resourceUserId = req.resource[resourceUserField].toString();
      } else if (req.params.userId) {
        resourceUserId = req.params.userId;
      } else if (req.body.userId) {
        resourceUserId = req.body.userId;
      } else if (req.params.id && resourceUserField === 'user') {
        // For routes like /users/:id, the :id is the user ID
        resourceUserId = req.params.id;
      }

      // Check ownership
      if (resourceUserId && req.user._id.toString() === resourceUserId.toString()) {
        return next();
      }

      logger.warn('Ownership access denied', {
        userId: req.user._id,
        resourceUserId,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        code: 'OWNERSHIP_REQUIRED'
      });
      
    } catch (error) {
      logger.error('Ownership check error', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization service error.',
        code: 'AUTH_SERVICE_ERROR'
      });
    }
  };
};

// Email verification required
export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to access this resource.',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }

  next();
};

// Enhanced rate limiting for sensitive operations
export const sensitiveOperationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use combination of IP and user ID for authenticated requests
    const baseKey = req.user ? `${req.ip}-${req.user._id}` : req.ip;
    const endpoint = req.route?.path || req.originalUrl;
    return `sensitive:${baseKey}:${endpoint}`;
  },
  skip: (req) => {
    // Skip rate limiting for admin users (but still log the attempt)
    if (req.user && req.user.role === 'admin') {
      logger.info('Admin bypassed rate limit', {
        userId: req.user._id,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      return true;
    }
    return false;
  },
  handler: (req, res) => {
    logger.warn('Sensitive operation rate limit exceeded', {
      ip: req.ip,
      userId: req.user?._id,
      endpoint: req.originalUrl,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations. Please try again in 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
      windowMs: 15 * 60 * 1000
    });
  },
  // onLimitReached removed in express-rate-limit v7
  // Logging is now handled in the handler function
});

// API rate limiting (general)
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

// Enhanced strict rate limiting for auth endpoints with progressive penalties
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on endpoint and environment
    const limits = {
      '/login': process.env.NODE_ENV === 'production' ? 5 : 10,
      '/register': process.env.NODE_ENV === 'production' ? 3 : 5,
      '/forgot-password': process.env.NODE_ENV === 'production' ? 3 : 5,
      '/reset-password': process.env.NODE_ENV === 'production' ? 5 : 10,
      '/refresh-token': process.env.NODE_ENV === 'production' ? 10 : 20
    };
    
    const endpoint = req.originalUrl.split('?')[0];
    for (const [path, limit] of Object.entries(limits)) {
      if (endpoint.includes(path)) return limit;
    }
    
    return process.env.NODE_ENV === 'production' ? 10 : 20; // Default
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Include endpoint and user identifier for more granular limiting
    const endpoint = req.originalUrl.split('?')[0];
    const userIdentifier = req.body?.email || req.ip;
    return `auth:${req.ip}:${userIdentifier}:${endpoint}`;
  },
  handler: (req, res) => {
    const endpoint = req.originalUrl.split('?')[0];
    const userIdentifier = req.body?.email || 'unknown';
    
    logger.warn('Authentication rate limit exceeded', {
      ip: req.ip,
      endpoint: endpoint,
      userIdentifier: userIdentifier.replace(/(.{3}).*(@.*)/, '$1***$2'), // Mask email
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      headers: {
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP')
      }
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
      endpoint: endpoint,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced input validation for authentication endpoints
export const validateAuthInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
    
    // Check for suspicious email patterns
    const suspiciousPatterns = [
      /(.)\1{4,}/, // Repeated characters
      /^[0-9]+@/, // Starts with numbers only
      /@[0-9]+\.[0-9]+$/ // IP address domain
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(email))) {
      logger.warn('Suspicious email pattern detected', {
        email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  }

  // Password validation for registration/reset
  if (password && (req.originalUrl.includes('/register') || req.originalUrl.includes('/reset-password'))) {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }
  }

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /('|\\')|(;|\\;)|(--)|(\s*(union|select|insert|delete|update|drop|create|alter|exec|execute)\s*)/i
  ];
  
  const checkSqlInjection = (value) => {
    return sqlInjectionPatterns.some(pattern => pattern.test(value));
  };

  Object.values(req.body).forEach(value => {
    if (typeof value === 'string' && checkSqlInjection(value)) {
      logger.warn('Potential SQL injection attempt detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      errors.push('Invalid input detected');
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

// Check if user can perform action based on account age
export const requireAccountAge = (minDays = 1) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const accountAge = (Date.now() - new Date(req.user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    
    if (accountAge < minDays) {
      return res.status(403).json({
        success: false,
        message: `Account must be at least ${minDays} day(s) old to perform this action.`,
        code: 'ACCOUNT_TOO_NEW'
      });
    }

    next();
  };
};

// Middleware to load resource for ownership checks
export const loadResource = (Model, paramName = 'id', populateFields = '') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `${paramName} parameter is required.`,
          code: 'MISSING_PARAMETER'
        });
      }

      let query = Model.findById(resourceId);
      
      if (populateFields) {
        query = query.populate(populateFields);
      }

      const resource = await query;
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      req.resource = resource;
      next();
      
    } catch (error) {
      logger.error('Load resource error', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid resource ID format.',
          code: 'INVALID_ID_FORMAT'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error loading resource.',
        code: 'RESOURCE_LOAD_ERROR'
      });
    }
  };
};

export default {
  authenticate,
  requireAdmin,
  requireRole,
  optionalAuth,
  requireOwnershipOrAdmin,
  requireEmailVerification,
  validateAuthInput,
  sensitiveOperationLimit,
  apiRateLimit,
  authRateLimit,
  requireAccountAge,
  loadResource
};
/
/ Security audit and monitoring
export const auditSecurityEvent = (eventType, req, additionalData = {}) => {
  const auditData = {
    eventType,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl,
    method: req.method,
    userId: req.user?._id,
    userRole: req.user?.role,
    sessionId: req.authContext?.sessionId,
    headers: {
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    },
    ...additionalData
  };

  // Log to security audit log
  logger.info('Security audit event', auditData);

  // In production, you might want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production' && process.env.SECURITY_WEBHOOK_URL) {
    // Send to security monitoring service (implement as needed)
    // sendToSecurityMonitoring(auditData);
  }

  return auditData;
};

// Enhanced middleware for sensitive operations with audit trail
export const auditSensitiveOperation = (operationType) => {
  return (req, res, next) => {
    // Audit the operation attempt
    auditSecurityEvent('SENSITIVE_OPERATION_ATTEMPT', req, {
      operationType,
      requestBody: req.method === 'POST' || req.method === 'PUT' ? 
        JSON.stringify(req.body).substring(0, 500) : undefined // Limit body size in logs
    });

    // Continue with the request
    next();
  };
};

// Middleware to detect and prevent brute force attacks
export const detectBruteForce = (req, res, next) => {
  const clientId = req.ip;
  const endpoint = req.originalUrl.split('?')[0];
  
  // This is a simplified implementation
  // In production, you'd want to use Redis or a proper rate limiting service
  if (!req.app.locals.bruteForceAttempts) {
    req.app.locals.bruteForceAttempts = new Map();
  }

  const key = `${clientId}:${endpoint}`;
  const attempts = req.app.locals.bruteForceAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  
  // Reset counter if window has passed
  if (Date.now() - attempts.firstAttempt > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
    attempts.count = 0;
    attempts.firstAttempt = Date.now();
  }

  attempts.count++;
  req.app.locals.bruteForceAttempts.set(key, attempts);

  // Check for suspicious patterns
  if (attempts.count > 20) { // More lenient than rate limiting
    logAuthEvent('warn', 'Potential brute force attack detected', req, {
      attempts: attempts.count,
      timeWindow: SECURITY_CONFIG.RATE_LIMIT_WINDOW,
      clientId
    });

    auditSecurityEvent('BRUTE_FORCE_DETECTED', req, {
      attempts: attempts.count,
      timeWindow: SECURITY_CONFIG.RATE_LIMIT_WINDOW
    });
  }

  next();
};

// Enhanced session validation middleware
export const validateSession = async (req, res, next) => {
  if (!req.user || !req.authContext) {
    return next();
  }

  try {
    // Check if session is still valid in database
    const user = await User.findById(req.user._id).select('lastActivity sessionVersion').lean();
    
    if (!user) {
      logAuthEvent('warn', 'Session validation failed: User not found', req, {
        userId: req.user._id
      });
      
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, 'Session invalid. Please login again.')
      );
    }

    // Check if user has been inactive for too long
    const inactivityLimit = 24 * 60 * 60 * 1000; // 24 hours
    if (user.lastActivity && Date.now() - new Date(user.lastActivity).getTime() > inactivityLimit) {
      logAuthEvent('warn', 'Session expired due to inactivity', req, {
        userId: req.user._id,
        lastActivity: user.lastActivity
      });
      
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.TOKEN_EXPIRED, 'Session expired due to inactivity. Please login again.')
      );
    }

    // Check session version (for forced logouts)
    if (user.sessionVersion && req.authContext.sessionVersion && 
        user.sessionVersion !== req.authContext.sessionVersion) {
      logAuthEvent('warn', 'Session invalidated by server', req, {
        userId: req.user._id,
        userSessionVersion: user.sessionVersion,
        tokenSessionVersion: req.authContext.sessionVersion
      });
      
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.TOKEN_EXPIRED, 'Session has been invalidated. Please login again.')
      );
    }

    next();
  } catch (error) {
    logger.error('Session validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    
    return res.status(500).json(
      createAuthErrorResponse(AuthErrorCodes.AUTH_SERVICE_ERROR, 'Session validation error.')
    );
  }
};

// Comprehensive authentication middleware that combines all checks
export const comprehensiveAuth = [
  detectBruteForce,
  authenticate,
  validateSession
];

// Export all middleware functions with consistent naming
export default {
  // Core authentication
  authenticate,
  comprehensiveAuth,
  optionalAuth,
  
  // Role and permission checks
  requireAdmin,
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireOwnershipOrAdmin,
  requireEmailVerification,
  requireAccountAge,
  
  // Rate limiting
  apiRateLimit,
  authRateLimit,
  sensitiveOperationLimit,
  
  // Validation and security
  validateAuthInput,
  validateSession,
  detectBruteForce,
  auditSensitiveOperation,
  
  // Utilities
  loadResource,
  auditSecurityEvent,
  
  // Constants
  AuthErrorCodes,
  UserRoles,
  SECURITY_CONFIG
};