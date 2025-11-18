import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Helper function to generate tokens with enhanced security
 */
const generateTokens = (user, req = null) => {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const jti = crypto.randomBytes(16).toString('hex');
  
  // Enhanced payload with security context
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    accountStatus: user.accountStatus,
    // Session context
    sessionId: sessionId,
    ipAddress: req?.ip,
    userAgent: req?.get('User-Agent')?.substring(0, 200) // Limit length
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: 'HS256',
    issuer: process.env.JWT_ISSUER || 'techverse-api',
    audience: process.env.JWT_AUDIENCE || 'techverse-client',
    jwtid: jti
  });

  const refreshTokenPayload = {
    id: user._id,
    type: 'refresh',
    sessionId: sessionId
  };

  const refreshToken = jwt.sign(refreshTokenPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    algorithm: 'HS256',
    issuer: process.env.JWT_ISSUER || 'techverse-api',
    audience: process.env.JWT_AUDIENCE || 'techverse-client',
    jwtid: crypto.randomBytes(16).toString('hex')
  });

  // Log token generation for security monitoring
  logger.info('OAuth tokens generated', {
    userId: user._id,
    email: user.email,
    sessionId: sessionId,
    jti: jti,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  return {
    accessToken,
    refreshToken,
    sessionId: tokenPayload.sessionId,
    expiresIn: process.env.JWT_EXPIRE || '7d'
  };
};

/**
 * Helper function to get user permissions based on role
 */
const getUserPermissions = (role) => {
  const permissions = {
    user: ['read:profile', 'update:profile', 'create:order', 'read:order'],
    admin: ['*'], // All permissions
    super_admin: ['*'] // All permissions
  };

  return permissions[role] || permissions.user;
};

/**
 * Helper function to parse expiry string to milliseconds
 */
const parseExpiryToMs = (expiry) => {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
};

/**
 * @desc    Handle successful Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user; // Set by Passport strategy

  if (!user) {
    logger.warn('Google OAuth callback: No user found', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  try {
    const { accessToken, refreshToken, sessionId, expiresIn } = generateTokens(user, req);

    // Remove sensitive data and add security fields
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      lastLogin: new Date(),
      permissions: getUserPermissions(user.role),
      avatar: user.avatar
    };

    // Set secure HTTP-only cookie for refresh token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh-token'
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Calculate token expiry timestamp
    const expiryMs = parseExpiryToMs(expiresIn);
    const tokenExpiry = new Date(Date.now() + expiryMs);

    logger.info('Google OAuth login successful', {
      userId: user._id,
      email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      sessionId: sessionId.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Redirect to frontend with token in URL (for SPA)
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&success=true`;
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error('Google OAuth callback error', {
      error: error.message,
      stack: error.stack,
      userId: user._id,
      ip: req.ip
    });

    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
  }
});

/**
 * @desc    Handle successful GitHub OAuth callback
 * @route   GET /api/auth/github/callback
 * @access  Public
 */
export const githubCallback = asyncHandler(async (req, res) => {
  const user = req.user; // Set by Passport strategy

  if (!user) {
    logger.warn('GitHub OAuth callback: No user found', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  try {
    const { accessToken, refreshToken, sessionId, expiresIn } = generateTokens(user, req);

    // Remove sensitive data and add security fields
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      lastLogin: new Date(),
      permissions: getUserPermissions(user.role),
      avatar: user.avatar
    };

    // Set secure HTTP-only cookie for refresh token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh-token'
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Calculate token expiry timestamp
    const expiryMs = parseExpiryToMs(expiresIn);
    const tokenExpiry = new Date(Date.now() + expiryMs);

    logger.info('GitHub OAuth login successful', {
      userId: user._id,
      email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      sessionId: sessionId.substring(0, 8) + '...',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Redirect to frontend with token in URL (for SPA)
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&success=true`;
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error('GitHub OAuth callback error', {
      error: error.message,
      stack: error.stack,
      userId: user._id,
      ip: req.ip
    });

    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
  }
});

/**
 * @desc    Link Google account to existing user
 * @route   POST /api/auth/link/google
 * @access  Private
 */
export const linkGoogleAccount = asyncHandler(async (req, res) => {
  // This would be implemented if you want to allow linking accounts
  // after the user is already logged in
  res.status(501).json({
    success: false,
    message: 'Account linking not yet implemented'
  });
});

/**
 * @desc    Link GitHub account to existing user
 * @route   POST /api/auth/link/github
 * @access  Private
 */
export const linkGitHubAccount = asyncHandler(async (req, res) => {
  // This would be implemented if you want to allow linking accounts
  // after the user is already logged in
  res.status(501).json({
    success: false,
    message: 'Account linking not yet implemented'
  });
});

/**
 * @desc    Unlink social account
 * @route   DELETE /api/auth/unlink/:provider
 * @access  Private
 */
export const unlinkSocialAccount = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const user = req.user;

  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid provider. Supported providers: google, github'
    });
  }

  // Check if user has a password set (so they can still login)
  const userWithPassword = await User.findById(user._id).select('+password');
  
  if (!userWithPassword.password && 
      ((provider === 'google' && !userWithPassword.githubId) || 
       (provider === 'github' && !userWithPassword.googleId))) {
    return res.status(400).json({
      success: false,
      message: 'Cannot unlink the only authentication method. Please set a password first.'
    });
  }

  // Unlink the account
  const updateField = provider === 'google' ? 'googleId' : 'githubId';
  await User.findByIdAndUpdate(user._id, {
    $unset: { [updateField]: 1 }
  });

  logger.info('Social account unlinked', {
    userId: user._id,
    provider,
    ip: req.ip
  });

  res.json({
    success: true,
    message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`
  });
});

export default {
  googleCallback,
  githubCallback,
  linkGoogleAccount,
  linkGitHubAccount,
  unlinkSocialAccount
};