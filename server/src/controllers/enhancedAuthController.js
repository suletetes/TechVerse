import { User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { tokenManager, sessionManager, mfaManager } from '../middleware/advancedAuth.js';
import logger from '../utils/logger.js';

// @desc    Enhanced login with session management and MFA
// @route   POST /api/auth/enhanced-login
// @access  Public
export const enhancedLogin = asyncHandler(async (req, res, next) => {
  const { email, password, mfaToken, rememberMe = false } = req.body;

  // Find user and include password for comparison
  const user = await User.findByEmail(email).select('+password');

  if (!user) {
    return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
  }

  // Check if account is locked
  if (user.isLocked) {
    await user.incLoginAttempts();
    const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
    return next(new AppError(
      `Account locked due to too many failed login attempts. Try again in ${lockTimeRemaining} minutes.`,
      423,
      'ACCOUNT_LOCKED'
    ));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incLoginAttempts();
    return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
  }

  // Check account status
  if (!user.isActive || user.accountStatus !== 'active') {
    return next(new AppError('Account is not active', 401, 'ACCOUNT_INACTIVE'));
  }

  // MFA verification if enabled
  if (user.twoFactorEnabled) {
    if (!mfaToken) {
      return res.status(200).json({
        success: true,
        message: 'MFA token required',
        requiresMFA: true,
        data: {
          tempToken: tokenManager.generateTempToken(user._id),
          backupCodesAvailable: user.backupCodes && user.backupCodes.length > 0
        }
      });
    }

    // Verify MFA token
    const isMFAValid = mfaManager.verifyMFAToken(user.twoFactorSecret, mfaToken);
    
    if (!isMFAValid) {
      // Check if it's a backup code
      const isBackupCodeValid = await mfaManager.verifyBackupCode(user._id, mfaToken);
      
      if (!isBackupCodeValid) {
        return next(new AppError('Invalid MFA token', 401, 'INVALID_MFA_TOKEN'));
      }
    }
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate tokens with session management
  const tokens = tokenManager.generateTokenPair(user, req);
  
  // Create session with metadata
  await sessionManager.createSession(user._id, tokens.sessionId, {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    rememberMe,
    loginMethod: user.twoFactorEnabled ? 'password+mfa' : 'password'
  });

  // Update user login info
  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
    lastActivity: new Date(),
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  logger.info('Enhanced login successful', {
    userId: user._id,
    email: user.email,
    sessionId: tokens.sessionId,
    mfaUsed: !!user.twoFactorEnabled,
    ip: req.ip
  });

  // Set secure HTTP-only cookie for refresh token
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth'
  };

  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        accountStatus: user.accountStatus,
        mfaEnabled: user.twoFactorEnabled
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
        sessionId: tokens.sessionId
      },
      session: {
        maxConcurrentSessions: sessionManager.maxSessions,
        currentSessions: sessionManager.getUserSessions(user._id).length
      }
    }
  });
});

// @desc    Enhanced token refresh with rotation
// @route   POST /api/auth/enhanced-refresh
// @access  Public
export const enhancedRefreshToken = asyncHandler(async (req, res, next) => {
  let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED'));
  }

  try {
    const result = await tokenManager.rotateTokens(refreshToken, req);

    // Update cookie with new refresh token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    };

    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          tokenType: 'Bearer',
          sessionId: result.sessionId
        },
        user: result.user
      }
    });

  } catch (error) {
    // Clear invalid refresh token cookie
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return next(new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
});

// @desc    Setup MFA for user
// @route   POST /api/auth/mfa/setup
// @access  Private
export const setupMFA = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  if (user.twoFactorEnabled) {
    return next(new AppError('MFA is already enabled', 400, 'MFA_ALREADY_ENABLED'));
  }

  // Generate MFA secret and QR code
  const mfaSetup = mfaManager.generateMFASecret(user);

  res.status(200).json({
    success: true,
    message: 'MFA setup initiated',
    data: {
      secret: mfaSetup.secret,
      qrCode: mfaSetup.qrCode,
      manualEntryKey: mfaSetup.secret,
      instructions: 'Scan the QR code with your authenticator app or enter the manual key'
    }
  });
});

// @desc    Enable MFA for user
// @route   POST /api/auth/mfa/enable
// @access  Private
export const enableMFA = asyncHandler(async (req, res, next) => {
  const { secret, verificationToken } = req.body;

  if (!secret || !verificationToken) {
    return next(new AppError('Secret and verification token are required', 400, 'MISSING_MFA_DATA'));
  }

  try {
    const result = await mfaManager.enableMFA(req.user._id, secret, verificationToken);

    logger.info('MFA enabled for user', { userId: req.user._id });

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
      data: {
        backupCodes: result.backupCodes,
        warning: 'Store these backup codes in a safe place. They can be used to access your account if you lose your authenticator device.'
      }
    });

  } catch (error) {
    return next(new AppError(error.message, 400, 'MFA_ENABLE_FAILED'));
  }
});

// @desc    Disable MFA for user
// @route   POST /api/auth/mfa/disable
// @access  Private
export const disableMFA = asyncHandler(async (req, res, next) => {
  const { currentPassword, mfaToken } = req.body;

  if (!currentPassword || !mfaToken) {
    return next(new AppError('Current password and MFA token are required', 400, 'MISSING_CREDENTIALS'));
  }

  try {
    await mfaManager.disableMFA(req.user._id, currentPassword, mfaToken);

    logger.info('MFA disabled for user', { userId: req.user._id });

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });

  } catch (error) {
    return next(new AppError(error.message, 400, 'MFA_DISABLE_FAILED'));
  }
});

// @desc    Generate new backup codes
// @route   POST /api/auth/mfa/backup-codes
// @access  Private
export const generateBackupCodes = asyncHandler(async (req, res, next) => {
  const { mfaToken } = req.body;

  if (!mfaToken) {
    return next(new AppError('MFA token is required', 400, 'MFA_TOKEN_REQUIRED'));
  }

  const user = await User.findById(req.user._id);

  if (!user.twoFactorEnabled) {
    return next(new AppError('MFA is not enabled', 400, 'MFA_NOT_ENABLED'));
  }

  // Verify MFA token
  const isMFAValid = mfaManager.verifyMFAToken(user.twoFactorSecret, mfaToken);
  
  if (!isMFAValid) {
    return next(new AppError('Invalid MFA token', 401, 'INVALID_MFA_TOKEN'));
  }

  // Generate new backup codes
  const backupCodes = mfaManager.generateBackupCodes();

  await User.findByIdAndUpdate(req.user._id, {
    backupCodes: backupCodes
  });

  logger.info('New backup codes generated', { userId: req.user._id });

  res.status(200).json({
    success: true,
    message: 'New backup codes generated',
    data: {
      backupCodes,
      warning: 'These codes replace your previous backup codes. Store them safely.'
    }
  });
});

// @desc    Get active sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getActiveSessions = asyncHandler(async (req, res, next) => {
  const sessions = sessionManager.getUserSessions(req.user._id);
  const tokenSessions = tokenManager.getActiveSessions(req.user._id);

  // Merge session data
  const combinedSessions = sessions.map(session => {
    const tokenSession = tokenSessions.find(ts => ts.sessionId === session.sessionId);
    return {
      ...session,
      ...tokenSession,
      isCurrent: session.sessionId === req.sessionId
    };
  });

  res.status(200).json({
    success: true,
    message: 'Active sessions retrieved',
    data: {
      sessions: combinedSessions,
      totalSessions: combinedSessions.length,
      maxSessions: sessionManager.maxSessions
    }
  });
});

// @desc    Revoke specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
export const revokeSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  if (sessionId === req.sessionId) {
    return next(new AppError('Cannot revoke current session', 400, 'CANNOT_REVOKE_CURRENT_SESSION'));
  }

  try {
    await sessionManager.removeSession(req.user._id, sessionId);
    await tokenManager.revokeSession(req.user._id, sessionId);

    logger.info('Session revoked', { userId: req.user._id, sessionId });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    return next(new AppError('Failed to revoke session', 500, 'SESSION_REVOKE_FAILED'));
  }
});

// @desc    Revoke all other sessions
// @route   POST /api/auth/sessions/revoke-all
// @access  Private
export const revokeAllOtherSessions = asyncHandler(async (req, res, next) => {
  try {
    const allSessions = sessionManager.getUserSessions(req.user._id);
    
    // Revoke all sessions except current
    for (const session of allSessions) {
      if (session.sessionId !== req.sessionId) {
        await sessionManager.removeSession(req.user._id, session.sessionId);
        await tokenManager.revokeSession(req.user._id, session.sessionId);
      }
    }

    logger.info('All other sessions revoked', { 
      userId: req.user._id, 
      revokedCount: allSessions.length - 1 
    });

    res.status(200).json({
      success: true,
      message: 'All other sessions revoked successfully',
      data: {
        revokedSessions: allSessions.length - 1
      }
    });

  } catch (error) {
    return next(new AppError('Failed to revoke sessions', 500, 'SESSIONS_REVOKE_FAILED'));
  }
});

// @desc    Enhanced logout with session cleanup
// @route   POST /api/auth/enhanced-logout
// @access  Private
export const enhancedLogout = asyncHandler(async (req, res, next) => {
  const { logoutAll = false } = req.body;

  try {
    if (logoutAll) {
      // Revoke all user tokens and sessions
      await tokenManager.revokeAllUserTokens(req.user._id);
      
      const allSessions = sessionManager.getUserSessions(req.user._id);
      for (const session of allSessions) {
        await sessionManager.removeSession(req.user._id, session.sessionId);
      }

      logger.info('User logged out from all sessions', { userId: req.user._id });
    } else {
      // Revoke current session only
      if (req.sessionId) {
        await sessionManager.removeSession(req.user._id, req.sessionId);
        await tokenManager.revokeSession(req.user._id, req.sessionId);
      }

      logger.info('User logged out from current session', { 
        userId: req.user._id, 
        sessionId: req.sessionId 
      });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', { 
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });

    res.status(200).json({
      success: true,
      message: logoutAll ? 'Logged out from all sessions' : 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error', { userId: req.user._id, error: error.message });
    return next(new AppError('Logout failed', 500, 'LOGOUT_FAILED'));
  }
});

// @desc    Get security overview
// @route   GET /api/auth/security
// @access  Private
export const getSecurityOverview = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('twoFactorEnabled backupCodes lastLogin lastActivity passwordChangedAt createdAt');

  const sessions = sessionManager.getUserSessions(req.user._id);
  const recentActivity = sessions.map(session => ({
    sessionId: session.sessionId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    isCurrent: session.sessionId === req.sessionId
  }));

  res.status(200).json({
    success: true,
    message: 'Security overview retrieved',
    data: {
      mfa: {
        enabled: user.twoFactorEnabled,
        backupCodesCount: user.backupCodes ? user.backupCodes.length : 0
      },
      sessions: {
        active: sessions.length,
        maximum: sessionManager.maxSessions,
        recentActivity
      },
      account: {
        lastLogin: user.lastLogin,
        lastActivity: user.lastActivity,
        passwordLastChanged: user.passwordChangedAt,
        accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))
      }
    }
  });
});

export default {
  enhancedLogin,
  enhancedRefreshToken,
  setupMFA,
  enableMFA,
  disableMFA,
  generateBackupCodes,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  enhancedLogout,
  getSecurityOverview
};