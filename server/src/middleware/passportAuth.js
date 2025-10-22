import passport from '../config/passport.js';
import logger from '../utils/logger.js';
import { User } from '../models/index.js';

// Authentication error codes for consistency
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
 * Passport JWT Authentication Middleware
 * Replaces the custom JWT middleware with Passport JWT strategy
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        logger.error('Passport JWT authentication error', {
          error: err.message,
          stack: err.stack,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl
        });

        return res.status(500).json(
          createAuthErrorResponse(AuthErrorCodes.AUTH_SERVICE_ERROR, 'Authentication service error.')
        );
      }

      if (!user) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          logAuthEvent('warn', 'Authentication failed: No token provided', req);
          
          return res.status(401).json(
            createAuthErrorResponse(AuthErrorCodes.NO_TOKEN, 'Access denied. No valid token provided.')
          );
        }

        // Handle specific error messages from Passport strategy
        let errorCode = AuthErrorCodes.INVALID_TOKEN;
        let errorMessage = 'Invalid token.';

        if (info?.message) {
          switch (info.message) {
            case 'Token is too old':
              errorCode = AuthErrorCodes.TOKEN_TOO_OLD;
              errorMessage = 'Token is too old. Please login again.';
              break;
            case 'User not found':
              errorCode = AuthErrorCodes.USER_NOT_FOUND;
              errorMessage = 'Invalid token. User not found.';
              break;
            case 'Account is deactivated':
              errorCode = AuthErrorCodes.ACCOUNT_INACTIVE;
              errorMessage = 'Account is deactivated. Please contact support.';
              break;
            case 'Please verify your email address':
              errorCode = AuthErrorCodes.EMAIL_NOT_VERIFIED;
              errorMessage = 'Please verify your email address to activate your account.';
              break;
            case 'Account is suspended':
              errorCode = AuthErrorCodes.ACCOUNT_SUSPENDED;
              errorMessage = 'Account is suspended. Please contact support.';
              break;
            case 'Account has been closed':
              errorCode = AuthErrorCodes.ACCOUNT_CLOSED;
              errorMessage = 'Account has been closed. Please contact support.';
              break;
            case 'Invalid token payload':
              errorCode = AuthErrorCodes.INVALID_TOKEN_PAYLOAD;
              errorMessage = 'Invalid token payload.';
              break;
            default:
              if (info.message.includes('locked')) {
                errorCode = AuthErrorCodes.ACCOUNT_LOCKED;
                errorMessage = info.message;
              }
          }
        }

        logAuthEvent('warn', `Authentication failed: ${errorMessage}`, req, {
          errorCode,
          infoMessage: info?.message
        });

        const statusCode = errorCode === AuthErrorCodes.ACCOUNT_LOCKED ? 423 : 401;
        const responseData = errorCode === AuthErrorCodes.ACCOUNT_LOCKED && info?.lockUntil ? 
          { lockUntil: info.lockUntil, retryAfter: Math.ceil((info.lockUntil - Date.now()) / 1000) } : 
          {};

        return res.status(statusCode).json(
          createAuthErrorResponse(errorCode, errorMessage, responseData)
        );
      }

      // Update last activity with enhanced tracking
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

      await User.findByIdAndUpdate(user._id, {
        lastActivity: new Date(),
        ipAddress: currentIp,
        userAgent: currentUserAgent
      }, { new: false });

      // Attach user to request with additional security context
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
      req.authContext = user.authContext || {};

      logger.debug('User authenticated successfully via Passport JWT', {
        userId: user._id,
        role: user.role,
        ip: currentIp,
        jti: user.authContext?.jti
      });

      next();

    } catch (error) {
      logger.error('Authentication middleware error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });

      return res.status(500).json(
        createAuthErrorResponse(AuthErrorCodes.AUTH_SERVICE_ERROR, 'Authentication service error.')
      );
    }
  })(req, res, next);
};

/**
 * Passport Local Authentication for Login
 * Used in login endpoints to authenticate with email/password
 */
export const authenticateLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Passport local authentication error', {
        error: err.message,
        stack: err.stack,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(500).json(
        createAuthErrorResponse(AuthErrorCodes.AUTH_SERVICE_ERROR, 'Authentication service error.')
      );
    }

    if (!user) {
      let errorCode = AuthErrorCodes.INVALID_TOKEN;
      let errorMessage = 'Invalid email or password.';
      let statusCode = 401;
      let additionalData = {};

      if (info?.message) {
        if (info.message.includes('locked')) {
          errorCode = AuthErrorCodes.ACCOUNT_LOCKED;
          errorMessage = info.message;
          statusCode = 423;
          if (info.lockUntil) {
            additionalData = {
              lockUntil: info.lockUntil,
              retryAfter: Math.ceil((info.lockUntil - Date.now()) / 1000)
            };
          }
        } else if (info.code) {
          errorCode = info.code;
          errorMessage = info.message;
        }
      }

      logAuthEvent('warn', `Local authentication failed: ${errorMessage}`, req, {
        errorCode,
        email: req.body?.email?.replace(/(.{3}).*(@.*)/, '$1***$2')
      });

      return res.status(statusCode).json(
        createAuthErrorResponse(errorCode, errorMessage, additionalData)
      );
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  })(req, res, next);
};

/**
 * Optional authentication (for routes that work with or without auth)
 * Uses Passport JWT strategy but doesn't fail if no token provided
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without authentication
    return next();
  }

  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err) {
      logger.debug('Optional auth error, continuing without authentication', {
        error: err.message
      });
      return next();
    }

    if (user) {
      // Update last activity for authenticated users
      await User.findByIdAndUpdate(user._id, {
        lastActivity: new Date()
      });

      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
      req.authContext = user.authContext || {};

      logger.debug('Optional authentication successful', {
        userId: user._id,
        role: user.role
      });
    } else {
      logger.debug('Optional auth failed, continuing without authentication', {
        infoMessage: info?.message
      });
    }

    next();
  })(req, res, next);
};

/**
 * Google OAuth Authentication
 */
export const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email']
});

/**
 * Google OAuth Callback
 */
export const authenticateGoogleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Google OAuth error', {
        error: err.message,
        stack: err.stack,
        ip: req.ip
      });
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
    }

    if (!user) {
      logger.warn('Google OAuth failed', {
        infoMessage: info?.message,
        ip: req.ip
      });
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Attach user to request for token generation
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * GitHub OAuth Authentication
 */
export const authenticateGitHub = passport.authenticate('github', {
  scope: ['user:email']
});

/**
 * GitHub OAuth Callback
 */
export const authenticateGitHubCallback = (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('GitHub OAuth error', {
        error: err.message,
        stack: err.stack,
        ip: req.ip
      });
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
    }

    if (!user) {
      logger.warn('GitHub OAuth failed', {
        infoMessage: info?.message,
        ip: req.ip
      });
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Attach user to request for token generation
    req.user = user;
    next();
  })(req, res, next);
};

// Re-export existing middleware functions that don't need changes
export { 
  requireAdmin,
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireOwnershipOrAdmin,
  requireEmailVerification,
  sensitiveOperationLimit,
  apiRateLimit,
  authRateLimit,
  validateAuthInput,
  requireAccountAge,
  loadResource,
  auditSecurityEvent,
  auditSensitiveOperation,
  detectBruteForce,
  validateSession,
  comprehensiveAuth
} from './auth.js';

export default {
  authenticate,
  authenticateLocal,
  optionalAuth,
  authenticateGoogle,
  authenticateGoogleCallback,
  authenticateGitHub,
  authenticateGitHubCallback
};