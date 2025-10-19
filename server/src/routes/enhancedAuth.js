import express from 'express';
import { body, param } from 'express-validator';
import {
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
} from '../controllers/enhancedAuthController.js';
import { 
  authenticateWithMFA
} from '../middleware/advancedAuth.js';
import {
  authRateLimit,
  sensitiveOperationLimit,
  validateAuthInput
} from '../middleware/auth.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Enhanced login validation
const enhancedLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('mfaToken')
    .optional()
    .isLength({ min: 6, max: 8 })
    .withMessage('MFA token must be 6-8 characters'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
];

// MFA setup validation
const mfaSetupValidation = [
  body('secret')
    .isLength({ min: 16, max: 64 })
    .withMessage('Invalid secret format'),
  body('verificationToken')
    .isLength({ min: 6, max: 8 })
    .isNumeric()
    .withMessage('Verification token must be 6-8 digits')
];

// MFA disable validation
const mfaDisableValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('mfaToken')
    .isLength({ min: 6, max: 8 })
    .withMessage('MFA token must be 6-8 characters')
];

// Backup codes validation
const backupCodesValidation = [
  body('mfaToken')
    .isLength({ min: 6, max: 8 })
    .withMessage('MFA token must be 6-8 characters')
];

// Session ID validation
const sessionIdValidation = [
  param('sessionId')
    .isLength({ min: 32, max: 128 })
    .matches(/^[a-f0-9]+$/i)
    .withMessage('Invalid session ID format')
];

// Enhanced authentication routes with rate limiting
router.post('/enhanced-login', 
  authRateLimit, 
  validateAuthInput, 
  enhancedLoginValidation, 
  validate, 
  enhancedLogin
);

router.post('/enhanced-refresh', 
  authRateLimit, 
  enhancedRefreshToken
);

router.post('/enhanced-logout', 
  authenticate, 
  enhancedLogout
);

// MFA management routes
router.post('/mfa/setup', 
  authenticate, 
  setupMFA
);

router.post('/mfa/enable', 
  authenticate, 
  sensitiveOperationLimit,
  mfaSetupValidation, 
  validate, 
  enableMFA
);

router.post('/mfa/disable', 
  authenticate, 
  sensitiveOperationLimit,
  mfaDisableValidation, 
  validate, 
  disableMFA
);

router.post('/mfa/backup-codes', 
  authenticate, 
  sensitiveOperationLimit,
  backupCodesValidation, 
  validate, 
  generateBackupCodes
);

// Session management routes
router.get('/sessions', 
  authenticate, 
  getActiveSessions
);

router.delete('/sessions/:sessionId', 
  authenticate, 
  sessionIdValidation, 
  validate, 
  revokeSession
);

router.post('/sessions/revoke-all', 
  authenticate, 
  sensitiveOperationLimit,
  revokeAllOtherSessions
);

// Security overview
router.get('/security', 
  authenticate, 
  getSecurityOverview
);

export default router;