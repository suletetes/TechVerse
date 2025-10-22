import { asyncHandler } from '../middleware/errorHandler.js';
import sessionConfig from '../config/session.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get session information
 * @route   GET /api/auth/session
 * @access  Private
 */
export const getSessionInfo = asyncHandler(async (req, res) => {
  const sessionInfo = {
    sessionId: req.sessionID,
    userId: req.session?.userId,
    createdAt: req.session?.createdAt,
    lastAccess: req.session?.lastAccess,
    authMethod: req.authMethod,
    isAuthenticated: !!req.user,
    user: req.user ? {
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    } : null
  };

  res.json({
    success: true,
    session: sessionInfo
  });
});

/**
 * @desc    Get session statistics (admin only)
 * @route   GET /api/auth/session/stats
 * @access  Private (Admin)
 */
export const getSessionStats = asyncHandler(async (req, res) => {
  const stats = await sessionConfig.getSessionStats();
  
  res.json({
    success: true,
    stats
  });
});

/**
 * @desc    Clean up expired sessions (admin only)
 * @route   POST /api/auth/session/cleanup
 * @access  Private (Admin)
 */
export const cleanupSessions = asyncHandler(async (req, res) => {
  const result = await sessionConfig.cleanupSessions();
  
  logger.info('Session cleanup performed', {
    adminUserId: req.user._id,
    result,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Session cleanup completed',
    result
  });
});

/**
 * @desc    Destroy all sessions for current user
 * @route   POST /api/auth/session/destroy-all
 * @access  Private
 */
export const destroyAllUserSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const currentSessionId = req.sessionID;
  
  const destroyed = await sessionConfig.destroyUserSessions(userId);
  
  // Destroy current session as well
  req.session.destroy((err) => {
    if (err) {
      logger.warn('Failed to destroy current session', {
        userId,
        sessionId: currentSessionId,
        error: err.message
      });
    }
  });

  logger.info('All user sessions destroyed', {
    userId,
    sessionsDestroyed: destroyed,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'All sessions destroyed successfully',
    sessionsDestroyed: destroyed
  });
});

/**
 * @desc    Destroy specific user sessions (admin only)
 * @route   POST /api/auth/session/destroy-user/:userId
 * @access  Private (Admin)
 */
export const destroyUserSessions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  const destroyed = await sessionConfig.destroyUserSessions(userId);
  
  logger.info('User sessions destroyed by admin', {
    adminUserId: req.user._id,
    targetUserId: userId,
    sessionsDestroyed: destroyed,
    ip: req.ip
  });

  res.json({
    success: true,
    message: `Destroyed ${destroyed} sessions for user`,
    sessionsDestroyed: destroyed,
    userId
  });
});

/**
 * @desc    Refresh session (extend expiry)
 * @route   POST /api/auth/session/refresh
 * @access  Private
 */
export const refreshSession = asyncHandler(async (req, res) => {
  if (!req.session) {
    return res.status(400).json({
      success: false,
      message: 'No active session to refresh'
    });
  }

  // Update session activity
  req.session.lastAccess = new Date();
  req.session.touch(); // Extend session TTL

  logger.debug('Session refreshed', {
    userId: req.user._id,
    sessionId: req.sessionID,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Session refreshed successfully',
    sessionId: req.sessionID,
    lastAccess: req.session.lastAccess
  });
});

/**
 * @desc    Convert JWT authentication to session
 * @route   POST /api/auth/session/create
 * @access  Private
 */
export const createSessionFromJWT = asyncHandler(async (req, res) => {
  if (req.authMethod === 'session') {
    return res.json({
      success: true,
      message: 'Already using session authentication',
      sessionId: req.sessionID
    });
  }

  if (!req.session) {
    return res.status(500).json({
      success: false,
      message: 'Session management not available'
    });
  }

  // Create session from JWT authentication
  req.session.userId = req.user._id.toString();
  req.session.createdAt = new Date();
  req.session.lastAccess = new Date();

  logger.info('Session created from JWT authentication', {
    userId: req.user._id,
    sessionId: req.sessionID,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Session created successfully',
    sessionId: req.sessionID,
    authMethod: 'session'
  });
});

export default {
  getSessionInfo,
  getSessionStats,
  cleanupSessions,
  destroyAllUserSessions,
  destroyUserSessions,
  refreshSession,
  createSessionFromJWT
};