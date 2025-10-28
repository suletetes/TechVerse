import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  getMe,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import {
  googleCallback,
  githubCallback,
  linkGoogleAccount,
  linkGitHubAccount,
  unlinkSocialAccount
} from '../controllers/oauthController.js';
import {
  getSessionInfo,
  getSessionStats,
  cleanupSessions,
  destroyAllUserSessions,
  destroyUserSessions,
  refreshSession,
  createSessionFromJWT
} from '../controllers/sessionController.js';
import {
  getSessionStatus,
  testSessionFunctionality,
  forceSessionCleanup,
  getActiveSessionsCount
} from '../controllers/sessionManagementController.js';
import {
  authenticate,
  authenticateLocal,
  authenticateGoogle,
  authenticateGoogleCallback,
  authenticateGitHub,
  authenticateGitHubCallback,
  requireAdmin,
  sensitiveOperationLimit,
  authRateLimit,
  validateAuthInput
} from '../middleware/passportAuth.js';
import { hybridAuth, sessionAuth, logout as hybridLogout } from '../middleware/hybridAuth.js';
import { validate } from '../middleware/validation.js';
// import { activityTrackers } from '../middleware/activityTracker.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
];

// Public routes with enhanced security
router.post('/register', authRateLimit, registerValidation, validate, register);
router.post('/login', authRateLimit, loginValidation, validate, authenticateLocal, login);
router.post('/logout', logout);
router.post('/refresh-token', authRateLimit, refreshToken);
router.post('/forgot-password', authRateLimit, validateAuthInput, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', authRateLimit, validateAuthInput, resetPasswordValidation, validate, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authRateLimit, validateAuthInput, forgotPasswordValidation, validate, resendVerification);

// OAuth routes
router.get('/google', authenticateGoogle);
router.get('/google/callback', authenticateGoogleCallback, googleCallback);
router.get('/github', authenticateGitHub);
router.get('/github/callback', authenticateGitHubCallback, githubCallback);

// Protected routes
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfileValidation, validate, updateProfile);
router.post('/change-password', authenticate, changePasswordValidation, validate, sensitiveOperationLimit, changePassword);

// OAuth account management routes
router.post('/link/google', authenticate, linkGoogleAccount);
router.post('/link/github', authenticate, linkGitHubAccount);
router.delete('/unlink/:provider', authenticate, unlinkSocialAccount);

// Session management routes
router.get('/session', hybridAuth, getSessionInfo);
router.post('/session/refresh', hybridAuth, refreshSession);
router.post('/session/create', authenticate, createSessionFromJWT);
router.post('/session/destroy-all', hybridAuth, destroyAllUserSessions);
router.post('/logout-all', hybridAuth, destroyAllUserSessions); // Alias for destroy-all

// Admin session management routes
router.get('/session/stats', hybridAuth, requireAdmin, getSessionStats);
router.post('/session/cleanup', sessionAuth, requireAdmin, cleanupSessions);
router.post('/session/destroy-user/:userId', sessionAuth, requireAdmin, destroyUserSessions);

// Enhanced session management endpoints
router.get('/session/status', hybridAuth, requireAdmin, getSessionStatus);
router.post('/session/test', hybridAuth, requireAdmin, testSessionFunctionality);
router.post('/session/force-cleanup', sessionAuth, requireAdmin, forceSessionCleanup);
router.get('/session/count', hybridAuth, requireAdmin, getActiveSessionsCount);

// Enhanced logout route
router.post('/logout-hybrid', hybridAuth, hybridLogout);

export default router;