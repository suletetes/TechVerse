import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

// Helper function to generate tokens with enhanced security
const generateTokens = (user, req = null) => {
  // Enhanced payload with security context
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    accountStatus: user.accountStatus,
    // Security context
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString('hex'), // JWT ID for token tracking
    iss: 'techverse-api', // Issuer
    aud: 'techverse-client', // Audience
    // Session context
    sessionId: crypto.randomBytes(32).toString('hex'),
    ipAddress: req?.ip,
    userAgent: req?.get('User-Agent')?.substring(0, 200) // Limit length
  };

  const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: 'HS256'
  });

  const refreshTokenPayload = {
    id: user._id,
    type: 'refresh',
    sessionId: tokenPayload.sessionId,
    jti: crypto.randomBytes(16).toString('hex')
  };

  const refreshToken = jwt.sign(refreshTokenPayload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    algorithm: 'HS256',
    issuer: 'techverse-api',
    audience: 'techverse-client'
  });

  // Log token generation for security monitoring
  logger.info('Tokens generated', {
    userId: user._id,
    email: user.email,
    sessionId: tokenPayload.sessionId,
    jti: tokenPayload.jti,
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

// Helper function to send token response with enhanced security
const sendTokenResponse = (user, statusCode, res, req, message = 'Success') => {
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
    permissions: getUserPermissions(user.role)
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

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken: process.env.NODE_ENV === 'development' ? refreshToken : undefined, // Only send in dev
        expiresIn,
        tokenType: 'Bearer',
        expiresAt: tokenExpiry.toISOString(),
        sessionId
      },
      security: {
        requiresEmailVerification: !user.isEmailVerified,
        accountStatus: user.accountStatus,
        lastPasswordChange: user.passwordChangedAt,
        mfaEnabled: user.mfaEnabled || false
      }
    }
  });
};

// Helper function to get user permissions based on role
const getUserPermissions = (role) => {
  const permissions = {
    user: ['read:profile', 'update:profile', 'read:orders', 'create:orders'],
    admin: [
      'read:profile', 'update:profile', 'read:orders', 'create:orders',
      'read:users', 'update:users', 'delete:users',
      'read:products', 'create:products', 'update:products', 'delete:products',
      'read:analytics', 'manage:sections', 'manage:categories',
      // Admin panel permissions
      'view_admin_panel', 'manage_orders', 'manage_products', 'manage_users',
      'manage_categories', 'manage_analytics', 'manage_settings'
    ]
  };
  return permissions[role] || permissions.user;
};

// Helper function to parse expiry string to milliseconds
const parseExpiryToMs = (expiresIn) => {
  if (typeof expiresIn === 'number') return expiresIn * 1000;

  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000
  };

  return value * multipliers[unit];
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone, referralCode } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400, 'EMAIL_EXISTS'));
  }

  // Handle referral code
  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findByReferralCode(referralCode);
    if (referrer) {
      referredBy = referrer._id;
      // Increment referrer's count
      referrer.referralCount += 1;
      await referrer.save();
    }
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    referredBy,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user, verificationToken);
  } catch (error) {
    logger.error('Failed to send verification email', error);
    // Don't fail registration if email fails
  }

  logger.info('User registered successfully', {
    userId: user._id,
    email: user.email,
    ip: req.ip
  });

  sendTokenResponse(user, 201, res, req, 'Registration successful. Please check your email to verify your account.');
});

// @desc    Login user (now uses Passport Local Strategy)
// @route   POST /api/auth/login
// @access  Public
// Note: This method is called after successful Passport local authentication
export const login = asyncHandler(async (req, res, next) => {
  // User is already authenticated by Passport local strategy at this point
  const user = req.user;

  if (!user) {
    return next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }

  // Add session tracking
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  // Check if user model has addSession method, if not update directly
  try {
    if (typeof user.addSession === 'function') {
      await user.addSession(sessionId, req.ip, req.get('User-Agent'));
    } else {
      // Fallback: update user directly
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  } catch (error) {
    logger.warn('Session tracking failed, continuing with login', {
      userId: user._id,
      error: error.message
    });
  }

  logger.info('User logged in successfully via Passport Local', {
    userId: user._id,
    email: user.email,
    sessionId: sessionId.substring(0, 8) + '...',
    ip: req.ip
  });

  sendTokenResponse(user, 200, res, req, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the logout event and potentially blacklist the token

  if (req.user) {
    logger.info('User logged out', {
      userId: req.user._id,
      email: req.user.email,
      ip: req.ip
    });
  }

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res, next) => {
  let refreshToken = req.body.refreshToken;

  // Prefer HTTP-only cookie over body for security
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED'));
  }

  try {
    // Verify refresh token with enhanced validation
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'techverse-api',
      audience: process.env.JWT_AUDIENCE || 'techverse-client'
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find user and check account status
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    // Enhanced security checks
    if (!user.isActive) {
      throw new Error('Account inactive');
    }

    if (user.accountStatus !== 'active') {
      throw new Error('Account not active');
    }

    if (user.isLocked) {
      return next(new AppError('Account is locked', 423, 'ACCOUNT_LOCKED'));
    }

    // Check for suspicious activity (IP change, etc.)
    const currentIp = req.ip;
    const currentUserAgent = req.get('User-Agent');

    if (user.ipAddress && user.ipAddress !== currentIp) {
      logger.warn('IP address changed during token refresh', {
        userId: user._id,
        oldIp: user.ipAddress,
        newIp: currentIp,
        sessionId: decoded.sessionId
      });
    }

    // Generate new tokens with rotation
    const { accessToken, refreshToken: newRefreshToken, sessionId, expiresIn } = generateTokens(user, req);

    // Update user's last activity and security context
    await User.findByIdAndUpdate(user._id, {
      lastActivity: new Date(),
      ipAddress: currentIp,
      userAgent: currentUserAgent
    });

    // Set new refresh token cookie with enhanced security
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh-token'
    };

    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    logger.info('Token refreshed successfully', {
      userId: user._id,
      email: user.email,
      sessionId,
      oldSessionId: decoded.sessionId,
      ip: currentIp,
      userAgent: currentUserAgent
    });

    // Calculate token expiry
    const expiryMs = parseExpiryToMs(expiresIn);
    const tokenExpiry = new Date(Date.now() + expiryMs);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: process.env.NODE_ENV === 'development' ? newRefreshToken : undefined,
          expiresIn,
          tokenType: 'Bearer',
          expiresAt: tokenExpiry.toISOString(),
          sessionId
        },
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          permissions: getUserPermissions(user.role)
        }
      }
    });

  } catch (error) {
    logger.warn('Invalid refresh token attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
      tokenPresent: !!refreshToken,
      cookiePresent: !!(req.cookies && req.cookies.refreshToken)
    });

    // Clear refresh token cookie if invalid
    if (req.cookies && req.cookies.refreshToken) {
      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh-token',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
      });
    }

    return next(new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    // Don't reveal if email exists or not
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);

    logger.info('Password reset email sent', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });

  } catch (error) {
    // Clear reset token if email fails
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.error('Failed to send password reset email', error);
    return next(new AppError('Failed to send password reset email. Please try again.', 500, 'EMAIL_SEND_ERROR'));
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  // Find user by reset token
  const user = await User.findByPasswordResetToken(token);

  if (!user) {
    return next(new AppError('Invalid or expired password reset token', 400, 'INVALID_RESET_TOKEN'));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Reset login attempts
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  await user.save();

  logger.info('Password reset successfully', {
    userId: user._id,
    email: user.email,
    ip: req.ip
  });

  sendTokenResponse(user, 200, res, req, 'Password reset successful');
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  // Find user by verification token
  const user = await User.findByVerificationToken(token);

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400, 'INVALID_VERIFICATION_TOKEN'));
  }

  // Verify email
  user.isEmailVerified = true;
  user.accountStatus = 'active';
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user);
  } catch (error) {
    logger.error('Failed to send welcome email', error);
  }

  logger.info('Email verified successfully', {
    userId: user._id,
    email: user.email,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. Your account is now active.'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a verification email has been sent.'
    });
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400, 'EMAIL_ALREADY_VERIFIED'));
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  try {
    await emailService.sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email has been sent.'
    });

  } catch (error) {
    logger.error('Failed to resend verification email', error);
    return next(new AppError('Failed to send verification email. Please try again.', 500, 'EMAIL_SEND_ERROR'));
  }
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD'));
  }

  // Set new password
  user.password = newPassword;
  await user.save();

  logger.info('Password changed successfully', {
    userId: user._id,
    email: user.email,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Get current user (me)
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Current user retrieved successfully',
    data: {
      user
    }
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('addresses')
    .populate('paymentMethods')
    .select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Get user permissions based on role
  const permissions = getUserPermissions(user.role);

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user,
      permissions
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'preferences'];
  const updates = {};

  // Only allow specific fields to be updated
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update', 400, 'NO_UPDATE_FIELDS'));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  logger.info('Profile updated successfully', {
    userId: user._id,
    updatedFields: Object.keys(updates),
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});