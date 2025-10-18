import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';

// Helper function to generate tokens with enhanced security
const generateTokens = (user, req = null) => {
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Log token generation for security monitoring
  logger.info('Tokens generated', {
    userId: user._id,
    email: user.email,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  return { accessToken, refreshToken };
};

// Helper function to send token response with enhanced security
const sendTokenResponse = (user, statusCode, res, req, message = 'Success') => {
  const { accessToken, refreshToken } = generateTokens(user, req);

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
    lastLogin: new Date()
  };

  // Set secure HTTP-only cookie for refresh token (optional, for enhanced security)
  if (process.env.NODE_ENV === 'production') {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh-token'
    });
  }

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d',
        tokenType: 'Bearer'
      }
    }
  });
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

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
  if (!user.isActive) {
    return next(new AppError('Account is deactivated. Please contact support.', 401, 'ACCOUNT_INACTIVE'));
  }

  if (user.accountStatus === 'suspended') {
    return next(new AppError('Account is suspended. Please contact support.', 401, 'ACCOUNT_SUSPENDED'));
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  logger.info('User logged in successfully', {
    userId: user._id,
    email: user.email,
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

  // Try to get refresh token from HTTP-only cookie if not in body
  if (!refreshToken && req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED'));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }

    // Find user and check account status
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive || user.accountStatus !== 'active') {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }

    // Check if account is locked
    if (user.isLocked) {
      return next(new AppError('Account is locked', 423, 'ACCOUNT_LOCKED'));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, req);

    // Update user's last activity
    await User.findByIdAndUpdate(user._id, {
      lastActivity: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set new refresh token cookie if using cookies
    if (process.env.NODE_ENV === 'production' && req.cookies && req.cookies.refreshToken) {
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/api/auth/refresh-token'
      });
    }

    logger.info('Token refreshed successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRE || '7d',
          tokenType: 'Bearer'
        }
      }
    });

  } catch (error) {
    logger.warn('Invalid refresh token attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message
    });
    
    // Clear refresh token cookie if invalid
    if (req.cookies && req.cookies.refreshToken) {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh-token' });
    }
    
    return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
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

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'preferences'];
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