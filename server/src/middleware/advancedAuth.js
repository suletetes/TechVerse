import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

// Token blacklist for logout and security
const tokenBlacklist = new Set();
const sessionStore = new Map(); // In production, use Redis

// Advanced JWT token rotation with security enhancements
export class TokenManager {
  constructor() {
    this.refreshTokens = new Map(); // Store refresh tokens with metadata
    this.maxConcurrentSessions = 5; // Maximum concurrent sessions per user
  }

  // Generate token pair with rotation support
  generateTokenPair(user, req = null, sessionId = null) {
    const now = Math.floor(Date.now() / 1000);
    const sessionIdentifier = sessionId || crypto.randomBytes(32).toString('hex');
    
    // Enhanced access token payload
    const accessTokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      sessionId: sessionIdentifier,
      iat: now,
      jti: crypto.randomBytes(16).toString('hex'),
      iss: process.env.JWT_ISSUER || 'techverse-api',
      aud: process.env.JWT_AUDIENCE || 'techverse-client',
      // Security context
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')?.substring(0, 200),
      // Account status at token creation
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      // Token version for invalidation
      tokenVersion: user.tokenVersion || 1
    };

    // Refresh token payload (minimal for security)
    const refreshTokenPayload = {
      id: user._id,
      sessionId: sessionIdentifier,
      type: 'refresh',
      iat: now,
      jti: crypto.randomBytes(16).toString('hex'),
      tokenVersion: user.tokenVersion || 1
    };

    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '15m', // Shorter for security
      algorithm: 'HS256'
    });

    const refreshToken = jwt.sign(refreshTokenPayload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      algorithm: 'HS256'
    });

    // Store refresh token metadata
    this.refreshTokens.set(refreshTokenPayload.jti, {
      userId: user._id,
      sessionId: sessionIdentifier,
      createdAt: new Date(),
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent'),
      isActive: true
    });

    return {
      accessToken,
      refreshToken,
      sessionId: sessionIdentifier,
      expiresIn: process.env.JWT_EXPIRE || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    };
  }

  // Rotate tokens with enhanced security
  async rotateTokens(refreshToken, req = null) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token is blacklisted
      if (tokenBlacklist.has(decoded.jti)) {
        throw new Error('Token has been revoked');
      }

      // Get refresh token metadata
      const tokenMetadata = this.refreshTokens.get(decoded.jti);
      if (!tokenMetadata || !tokenMetadata.isActive) {
        throw new Error('Refresh token not found or inactive');
      }

      // Find user and validate
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Check token version for invalidation
      if (decoded.tokenVersion !== (user.tokenVersion || 1)) {
        throw new Error('Token version mismatch - user tokens invalidated');
      }

      // Security checks
      if (!user.isActive || user.accountStatus !== 'active') {
        throw new Error('Account not active');
      }

      // Check for suspicious activity (IP change)
      if (tokenMetadata.ipAddress && req?.ip && tokenMetadata.ipAddress !== req.ip) {
        logger.warn('IP address changed during token rotation', {
          userId: user._id,
          oldIp: tokenMetadata.ipAddress,
          newIp: req.ip,
          sessionId: decoded.sessionId
        });
        
        // Optionally require re-authentication for IP changes
        if (process.env.STRICT_IP_VALIDATION === 'true') {
          throw new Error('IP address validation failed');
        }
      }

      // Invalidate old refresh token
      this.refreshTokens.set(decoded.jti, { ...tokenMetadata, isActive: false });
      tokenBlacklist.add(decoded.jti);

      // Generate new token pair
      const newTokens = this.generateTokenPair(user, req, decoded.sessionId);

      // Update user activity
      await User.findByIdAndUpdate(user._id, {
        lastActivity: new Date(),
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent')
      });

      logger.info('Tokens rotated successfully', {
        userId: user._id,
        sessionId: decoded.sessionId,
        oldJti: decoded.jti,
        newJti: jwt.decode(newTokens.refreshToken).jti
      });

      return {
        ...newTokens,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus
        }
      };

    } catch (error) {
      logger.warn('Token rotation failed', {
        error: error.message,
        ip: req?.ip,
        userAgent: req?.get('User-Agent')
      });
      throw error;
    }
  }

  // Revoke all tokens for a user
  async revokeAllUserTokens(userId) {
    try {
      // Increment token version to invalidate all existing tokens
      await User.findByIdAndUpdate(userId, {
        $inc: { tokenVersion: 1 }
      });

      // Mark all refresh tokens as inactive
      for (const [jti, metadata] of this.refreshTokens.entries()) {
        if (metadata.userId.toString() === userId.toString()) {
          this.refreshTokens.set(jti, { ...metadata, isActive: false });
          tokenBlacklist.add(jti);
        }
      }

      logger.info('All tokens revoked for user', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to revoke user tokens', { userId, error: error.message });
      throw error;
    }
  }

  // Revoke specific session
  async revokeSession(userId, sessionId) {
    try {
      // Mark refresh tokens for this session as inactive
      for (const [jti, metadata] of this.refreshTokens.entries()) {
        if (metadata.userId.toString() === userId.toString() && 
            metadata.sessionId === sessionId) {
          this.refreshTokens.set(jti, { ...metadata, isActive: false });
          tokenBlacklist.add(jti);
        }
      }

      // Remove from session store
      sessionStore.delete(`${userId}:${sessionId}`);

      logger.info('Session revoked', { userId, sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to revoke session', { userId, sessionId, error: error.message });
      throw error;
    }
  }

  // Get active sessions for user
  getActiveSessions(userId) {
    const sessions = [];
    for (const [jti, metadata] of this.refreshTokens.entries()) {
      if (metadata.userId.toString() === userId.toString() && metadata.isActive) {
        sessions.push({
          sessionId: metadata.sessionId,
          createdAt: metadata.createdAt,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          jti
        });
      }
    }
    return sessions;
  }

  // Generate temporary token for MFA flow
  generateTempToken(userId) {
    const payload = {
      id: userId,
      type: 'temp',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '5m', // 5 minutes for MFA completion
      algorithm: 'HS256'
    });
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    const refreshTokenTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [jti, metadata] of this.refreshTokens.entries()) {
      if (now - metadata.createdAt.getTime() > refreshTokenTTL) {
        this.refreshTokens.delete(jti);
        tokenBlacklist.delete(jti);
      }
    }
  }
}

// Session management with concurrent session limits
export class SessionManager {
  constructor(maxSessions = 5) {
    this.maxSessions = maxSessions;
    this.userSessions = new Map(); // userId -> Set of sessionIds
  }

  // Create new session with limits
  async createSession(userId, sessionId, metadata = {}) {
    try {
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }

      const userSessionSet = this.userSessions.get(userId);

      // Check session limit
      if (userSessionSet.size >= this.maxSessions) {
        // Remove oldest session
        const oldestSession = Array.from(userSessionSet)[0];
        await this.removeSession(userId, oldestSession);
        
        logger.info('Removed oldest session due to limit', {
          userId,
          removedSession: oldestSession,
          limit: this.maxSessions
        });
      }

      // Add new session
      userSessionSet.add(sessionId);
      sessionStore.set(`${userId}:${sessionId}`, {
        ...metadata,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      // Update user's active sessions in database
      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          activeSessions: {
            sessionId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            createdAt: new Date(),
            lastActivity: new Date(),
            isActive: true
          }
        }
      });

      logger.info('Session created', { userId, sessionId, totalSessions: userSessionSet.size });
      return true;
    } catch (error) {
      logger.error('Failed to create session', { userId, sessionId, error: error.message });
      throw error;
    }
  }

  // Remove session
  async removeSession(userId, sessionId) {
    try {
      if (this.userSessions.has(userId)) {
        this.userSessions.get(userId).delete(sessionId);
      }

      sessionStore.delete(`${userId}:${sessionId}`);

      // Update user's active sessions in database
      await User.findByIdAndUpdate(userId, {
        $pull: {
          activeSessions: { sessionId }
        }
      });

      logger.info('Session removed', { userId, sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to remove session', { userId, sessionId, error: error.message });
      throw error;
    }
  }

  // Update session activity
  updateSessionActivity(userId, sessionId) {
    const sessionKey = `${userId}:${sessionId}`;
    const session = sessionStore.get(sessionKey);
    
    if (session) {
      session.lastActivity = new Date();
      sessionStore.set(sessionKey, session);
    }
  }

  // Get user sessions
  getUserSessions(userId) {
    if (!this.userSessions.has(userId)) {
      return [];
    }

    const sessions = [];
    for (const sessionId of this.userSessions.get(userId)) {
      const sessionData = sessionStore.get(`${userId}:${sessionId}`);
      if (sessionData) {
        sessions.push({
          sessionId,
          ...sessionData
        });
      }
    }

    return sessions;
  }

  // Clean up inactive sessions
  cleanupInactiveSessions(inactivityThreshold = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    
    for (const [key, session] of sessionStore.entries()) {
      if (now - session.lastActivity.getTime() > inactivityThreshold) {
        const [userId, sessionId] = key.split(':');
        this.removeSession(userId, sessionId);
      }
    }
  }
}

// Multi-Factor Authentication (MFA) implementation
export class MFAManager {
  // Generate MFA secret for user
  generateMFASecret(user) {
    const secret = speakeasy.generateSecret({
      name: `TechVerse (${user.email})`,
      issuer: 'TechVerse',
      length: 32
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      backupCodes: this.generateBackupCodes()
    };
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Verify MFA token
  verifyMFAToken(secret, token, window = 2) {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window // Allow some time drift
      });
    } catch (error) {
      logger.error('MFA verification error', { error: error.message });
      return false;
    }
  }

  // Verify backup code
  async verifyBackupCode(userId, code) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.backupCodes) {
        return false;
      }

      const codeIndex = user.backupCodes.indexOf(code.toUpperCase());
      if (codeIndex === -1) {
        return false;
      }

      // Remove used backup code
      user.backupCodes.splice(codeIndex, 1);
      await user.save();

      logger.info('Backup code used', { userId, remainingCodes: user.backupCodes.length });
      return true;
    } catch (error) {
      logger.error('Backup code verification error', { userId, error: error.message });
      return false;
    }
  }

  // Enable MFA for user
  async enableMFA(userId, secret, verificationToken) {
    try {
      // Verify the token first
      if (!this.verifyMFAToken(secret, verificationToken)) {
        throw new Error('Invalid verification token');
      }

      const backupCodes = this.generateBackupCodes();

      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: backupCodes,
        mfaEnabledAt: new Date()
      });

      logger.info('MFA enabled for user', { userId });
      return { success: true, backupCodes };
    } catch (error) {
      logger.error('Failed to enable MFA', { userId, error: error.message });
      throw error;
    }
  }

  // Disable MFA for user
  async disableMFA(userId, currentPassword, mfaToken) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Verify MFA token
      if (!this.verifyMFAToken(user.twoFactorSecret, mfaToken)) {
        throw new Error('Invalid MFA token');
      }

      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        backupCodes: undefined,
        mfaDisabledAt: new Date()
      });

      logger.info('MFA disabled for user', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to disable MFA', { userId, error: error.message });
      throw error;
    }
  }
}

// Initialize managers
export const tokenManager = new TokenManager();
export const sessionManager = new SessionManager();
export const mfaManager = new MFAManager();

// Enhanced authentication middleware with MFA support
export const authenticateWithMFA = async (req, res, next) => {
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
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(decoded.jti)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked.',
        code: 'TOKEN_REVOKED'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check token version
    if (decoded.tokenVersion !== (user.tokenVersion || 1)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated.',
        code: 'TOKEN_INVALIDATED'
      });
    }

    // Standard account checks
    if (!user.isActive || user.accountStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if MFA is required for this operation
    const mfaRequiredRoutes = [
      '/api/auth/change-password',
      '/api/users/payment-methods',
      '/api/admin'
    ];

    const requiresMFA = mfaRequiredRoutes.some(route => req.originalUrl.startsWith(route));
    
    if (requiresMFA && user.twoFactorEnabled) {
      const mfaToken = req.header('X-MFA-Token');
      
      if (!mfaToken) {
        return res.status(403).json({
          success: false,
          message: 'MFA token required for this operation.',
          code: 'MFA_REQUIRED'
        });
      }

      // Verify MFA token
      const isMFAValid = mfaManager.verifyMFAToken(user.twoFactorSecret, mfaToken);
      
      if (!isMFAValid) {
        // Check if it's a backup code
        const isBackupCodeValid = await mfaManager.verifyBackupCode(user._id, mfaToken);
        
        if (!isBackupCodeValid) {
          return res.status(403).json({
            success: false,
            message: 'Invalid MFA token.',
            code: 'INVALID_MFA_TOKEN'
          });
        }
      }
    }

    // Update session activity
    if (decoded.sessionId) {
      sessionManager.updateSessionActivity(user._id, decoded.sessionId);
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();

  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      code: 'INVALID_TOKEN'
    });
  }
};

// Cleanup job (run periodically)
export const runCleanupJob = () => {
  tokenManager.cleanupExpiredTokens();
  sessionManager.cleanupInactiveSessions();
  
  // Clean up blacklist (remove very old entries)
  const maxBlacklistSize = 10000;
  if (tokenBlacklist.size > maxBlacklistSize) {
    const entries = Array.from(tokenBlacklist);
    const toRemove = entries.slice(0, entries.length - maxBlacklistSize);
    toRemove.forEach(jti => tokenBlacklist.delete(jti));
  }
};

// Start cleanup job
setInterval(runCleanupJob, 60 * 60 * 1000); // Run every hour

export default {
  TokenManager,
  SessionManager,
  MFAManager,
  tokenManager,
  sessionManager,
  mfaManager,
  authenticateWithMFA,
  runCleanupJob
};