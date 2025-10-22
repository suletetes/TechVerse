import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import sessionConfig from '../config/session.js';

/**
 * Hybrid Authentication Middleware
 * Supports both session-based and JWT-based authentication
 */

// Authentication error codes
export const AuthErrorCodes = {
  NO_AUTH: 'NO_AUTH',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_CLOSED: 'ACCOUNT_CLOSED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_SERVICE_ERROR: 'AUTH_SERVICE_ERROR'
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
 * Enhanced authentication logging
 */
const logAuthEvent = (level, message, req, additionalData = {}) => {
  const logData = {
    message,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl,
    method: req.method,
    sessionId: req.sessionID,
    timestamp: new Date().toISOString(),
    ...additionalData
  };

  logger[level](logData);
};

/**
 * Extract JWT token from request
 */
const extractJWTToken = (req) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  return null;
};

/**
 * Verify JWT token
 */
const verifyJWTToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'techverse-api',
      audience: process.env.JWT_AUDIENCE || 'techverse-client'
    });
    return { success: true, payload: decoded };
  } catch (error) {
    return { success: false, error: error.message, name: error.name };
  }
};

/**
 * Load user from database
 */
const loadUser = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken')
      .lean();
    return user;
  } catch (error) {
    logger.error('Failed to load user', {
      userId,
      error: error.message
    });
    return null;
  }
};

/**
 * Validate user account status
 */
const validateUserAccount = (user) => {
  if (!user.isActive) {
    return {
      valid: false,
      code: AuthErrorCodes.ACCOUNT_INACTIVE,
      message: 'Account is deactivated. Please contact support.'
    };
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
    return {
      valid: false,
      code: AuthErrorCodes.ACCOUNT_LOCKED,
      message: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
      lockUntil: user.lockUntil,
      retryAfter: lockTimeRemaining * 60
    };
  }

  if (user.accountStatus === 'suspended') {
    return {
      valid: false,
      code: AuthErrorCodes.ACCOUNT_SUSPENDED,
      message: 'Account is suspended. Please contact support.',
      reason: user.suspensionReason
    };
  }

  if (user.accountStatus === 'pending') {
    return {
      valid: false,
      code: AuthErrorCodes.EMAIL_NOT_VERIFIED,
      message: 'Please verify your email address to activate your account.'
    };
  }

  if (user.accountStatus === 'closed') {
    return {
      valid: false,
      code: AuthErrorCodes.ACCOUNT_CLOSED,
      message: 'Account has been closed. Please contact support.'
    };
  }

  return { valid: true };
};

/**
 * Update user activity
 */
const updateUserActivity = async (userId, req) => {
  try {
    await User.findByIdAndUpdate(userId, {
      lastActivity: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }, { new: false });
  } catch (error) {
    logger.warn('Failed to update user activity', {
      userId,
      error: error.message
    });
  }
};

/**
 * Hybrid Authentication Middleware
 * Tries session first, then JWT, supports both
 */
export const hybridAuth = async (req, res, next) => {
  try {
    let user = null;
    let authMethod = null;
    let authContext = {};

    // Method 1: Check session authentication
    if (req.session && req.session.userId) {
      user = await loadUser(req.session.userId);
      if (user) {
        authMethod = 'session';
        authContext = {
          sessionId: req.sessionID,
          sessionCreated: req.session.createdAt,
          sessionLastAccess: req.session.lastAccess
        };

        // Update session activity
        req.session.lastAccess = new Date();

        logAuthEvent('debug', 'Session authentication successful', req, {
          userId: user._id,
          authMethod,
          sessionId: req.sessionID
        });
      } else {
        // Invalid user in session, destroy it
        req.session.destroy((err) => {
          if (err) {
            logger.warn('Failed to destroy invalid session', {
              sessionId: req.sessionID,
              error: err.message
            });
          }
        });
      }
    }

    // Method 2: Check JWT authentication (if session auth failed)
    if (!user) {
      const token = extractJWTToken(req);
      if (token) {
        const jwtResult = await verifyJWTToken(token);
        
        if (jwtResult.success) {
          user = await loadUser(jwtResult.payload.id);
          if (user) {
            authMethod = 'jwt';
            authContext = {
              tokenIssuedAt: new Date(jwtResult.payload.iat * 1000),
              tokenExpiresAt: new Date(jwtResult.payload.exp * 1000),
              sessionId: jwtResult.payload.sessionId,
              jti: jwtResult.payload.jti
            };

            logAuthEvent('debug', 'JWT authentication successful', req, {
              userId: user._id,
              authMethod,
              jti: jwtResult.payload.jti
            });
          }
        } else {
          // Handle JWT errors
          let errorCode = AuthErrorCodes.INVALID_TOKEN;
          let errorMessage = 'Invalid token.';

          if (jwtResult.name === 'TokenExpiredError') {
            errorCode = AuthErrorCodes.TOKEN_EXPIRED;
            errorMessage = 'Token has expired. Please login again.';
          }

          logAuthEvent('warn', `JWT authentication failed: ${errorMessage}`, req, {
            error: jwtResult.error,
            tokenLength: token.length
          });

          return res.status(401).json(
            createAuthErrorResponse(errorCode, errorMessage)
          );
        }
      }
    }

    // No authentication found
    if (!user) {
      logAuthEvent('warn', 'No authentication provided', req);
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.NO_AUTH, 'Authentication required.')
      );
    }

    // Validate user account
    const validation = validateUserAccount(user);
    if (!validation.valid) {
      logAuthEvent('warn', `Authentication failed: ${validation.message}`, req, {
        userId: user._id,
        validationCode: validation.code
      });

      const statusCode = validation.code === AuthErrorCodes.ACCOUNT_LOCKED ? 423 : 401;
      return res.status(statusCode).json(
        createAuthErrorResponse(validation.code, validation.message, {
          lockUntil: validation.lockUntil,
          retryAfter: validation.retryAfter,
          reason: validation.reason
        })
      );
    }

    // Update user activity
    await updateUserActivity(user._id, req);

    // Attach user and auth context to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.authMethod = authMethod;
    req.authContext = authContext;

    // Create session if authenticated via JWT (for future requests)
    if (authMethod === 'jwt' && req.session && !req.session.userId) {
      req.session.userId = user._id.toString();
      req.session.createdAt = new Date();
      req.session.lastAccess = new Date();
      
      logAuthEvent('info', 'Session created from JWT authentication', req, {
        userId: user._id,
        sessionId: req.sessionID
      });
    }

    logAuthEvent('debug', 'Hybrid authentication successful', req, {
      userId: user._id,
      authMethod,
      role: user.role
    });

    next();

  } catch (error) {
    logger.error('Hybrid authentication error', {
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
};

/**
 * Optional hybrid authentication (doesn't fail if no auth provided)
 */
export const optionalHybridAuth = async (req, res, next) => {
  try {
    let user = null;
    let authMethod = null;
    let authContext = {};

    // Method 1: Check session authentication
    if (req.session && req.session.userId) {
      user = await loadUser(req.session.userId);
      if (user) {
        authMethod = 'session';
        authContext = {
          sessionId: req.sessionID,
          sessionCreated: req.session.createdAt,
          sessionLastAccess: req.session.lastAccess
        };
        req.session.lastAccess = new Date();
      }
    }

    // Method 2: Check JWT authentication (if session auth failed)
    if (!user) {
      const token = extractJWTToken(req);
      if (token) {
        const jwtResult = await verifyJWTToken(token);
        
        if (jwtResult.success) {
          user = await loadUser(jwtResult.payload.id);
          if (user) {
            authMethod = 'jwt';
            authContext = {
              tokenIssuedAt: new Date(jwtResult.payload.iat * 1000),
              tokenExpiresAt: new Date(jwtResult.payload.exp * 1000),
              sessionId: jwtResult.payload.sessionId,
              jti: jwtResult.payload.jti
            };
          }
        }
      }
    }

    // If user found, validate and attach to request
    if (user) {
      const validation = validateUserAccount(user);
      if (validation.valid) {
        await updateUserActivity(user._id, req);
        
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
        req.authMethod = authMethod;
        req.authContext = authContext;

        // Create session if authenticated via JWT
        if (authMethod === 'jwt' && req.session && !req.session.userId) {
          req.session.userId = user._id.toString();
          req.session.createdAt = new Date();
          req.session.lastAccess = new Date();
        }

        logAuthEvent('debug', 'Optional hybrid authentication successful', req, {
          userId: user._id,
          authMethod,
          role: user.role
        });
      }
    }

    next();

  } catch (error) {
    logger.error('Optional hybrid authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    // Continue without authentication for optional routes
    next();
  }
};

/**
 * Session-only authentication (for admin or sensitive operations)
 */
export const sessionAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      logAuthEvent('warn', 'Session authentication required but not found', req);
      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.NO_AUTH, 'Session authentication required.')
      );
    }

    const user = await loadUser(req.session.userId);
    if (!user) {
      // Invalid user in session, destroy it
      req.session.destroy((err) => {
        if (err) {
          logger.warn('Failed to destroy invalid session', {
            sessionId: req.sessionID,
            error: err.message
          });
        }
      });

      return res.status(401).json(
        createAuthErrorResponse(AuthErrorCodes.USER_NOT_FOUND, 'Invalid session. Please login again.')
      );
    }

    // Validate user account
    const validation = validateUserAccount(user);
    if (!validation.valid) {
      const statusCode = validation.code === AuthErrorCodes.ACCOUNT_LOCKED ? 423 : 401;
      return res.status(statusCode).json(
        createAuthErrorResponse(validation.code, validation.message)
      );
    }

    // Update session activity
    req.session.lastAccess = new Date();
    await updateUserActivity(user._id, req);

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.authMethod = 'session';
    req.authContext = {
      sessionId: req.sessionID,
      sessionCreated: req.session.createdAt,
      sessionLastAccess: req.session.lastAccess
    };

    logAuthEvent('debug', 'Session authentication successful', req, {
      userId: user._id,
      sessionId: req.sessionID
    });

    next();

  } catch (error) {
    logger.error('Session authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    return res.status(500).json(
      createAuthErrorResponse(AuthErrorCodes.AUTH_SERVICE_ERROR, 'Authentication service error.')
    );
  }
};

/**
 * Logout helper - destroys both session and invalidates JWT
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.sessionID;

    // Destroy session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Failed to destroy session during logout', {
            userId,
            sessionId,
            error: err.message
          });
        }
      });
    }

    // Clear session cookie
    res.clearCookie('techverse.sid');

    logAuthEvent('info', 'User logged out', req, {
      userId,
      sessionId,
      authMethod: req.authMethod
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id
    });

    return res.status(500).json(
      createAuthErrorResponse(AuthErrorCodes.AUTH_SERVICE_ERROR, 'Logout failed.')
    );
  }
};

export default {
  hybridAuth,
  optionalHybridAuth,
  sessionAuth,
  logout
};