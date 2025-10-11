import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and exclude sensitive fields
    const user = await User.findById(decoded.id)
      .select('-password -emailVerificationToken -passwordResetToken')
      .lean();
    
    if (!user) {
      logger.warn('Authentication failed: User not found', { userId: decoded.id });
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check account status
    if (!user.isActive) {
      logger.warn('Authentication failed: Account inactive', { userId: user._id });
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      logger.warn('Authentication failed: Account locked', { userId: user._id });
      return res.status(401).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      logger.warn('Authentication failed: Account suspended', { userId: user._id });
      return res.status(401).json({
        success: false,
        message: 'Account is suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    if (user.accountStatus === 'pending') {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address to activate your account.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Update last activity
    await User.findByIdAndUpdate(user._id, { 
      lastActivity: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    logger.debug('User authenticated successfully', { userId: user._id });
    next();
    
  } catch (error) {
    logger.error('Authentication error', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

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
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Role access denied', { 
        userId: req.user._id, 
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl 
      });
      
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        code: 'INSUFFICIENT_ROLE'
      });
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

// Rate limiting for sensitive operations
export const sensitiveOperationLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use combination of IP and user ID for authenticated requests
    return req.user ? `${req.ip}-${req.user._id}` : req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn('Sensitive operation rate limit reached', {
      ip: req.ip,
      userId: req.user?._id,
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations. Please try again in 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
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

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Authentication rate limit reached', {
      ip: req.ip,
      endpoint: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

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
  sensitiveOperationLimit,
  apiRateLimit,
  authRateLimit,
  requireAccountAge,
  loadResource
};