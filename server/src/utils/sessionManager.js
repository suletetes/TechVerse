import logger from './logger.js';
import sessionConfig from '../config/session.js';

/**
 * Session Management Utility
 * Provides high-level session management functions
 */
class SessionManager {
  constructor() {
    this.isRedisAvailable = false;
    this.sessionStore = null;
  }

  /**
   * Initialize session manager
   */
  async initialize() {
    try {
      // Skip Redis if disabled
      if (process.env.DISABLE_REDIS_SESSIONS === 'true') {
        logger.info('Redis sessions disabled, using memory store');
        this.isRedisAvailable = false;
        return false;
      }
      
      // Try to initialize Redis
      await sessionConfig.initializeRedis();
      this.sessionStore = sessionConfig.createRedisStore();
      this.isRedisAvailable = true;
      
      logger.info('Session manager initialized with Redis store');
      return true;
    } catch (error) {
      logger.warn('Redis unavailable, session manager will use memory store', {
        error: error.message
      });
      this.isRedisAvailable = false;
      return false;
    }
  }

  /**
   * Get session statistics
   */
  async getStats() {
    if (!this.isRedisAvailable) {
      return {
        store: 'memory',
        activeSessions: 'unknown',
        redisAvailable: false,
        message: 'Using in-memory session store'
      };
    }

    try {
      const stats = await sessionConfig.getSessionStats();
      return {
        store: 'redis',
        ...stats,
        redisAvailable: true
      };
    } catch (error) {
      logger.error('Failed to get session stats', {
        error: error.message
      });
      return {
        store: 'redis',
        error: error.message,
        redisAvailable: false
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanup() {
    if (!this.isRedisAvailable) {
      return {
        message: 'Cleanup not available with memory store',
        cleaned: 0
      };
    }

    try {
      const result = await sessionConfig.cleanupSessions();
      logger.info('Session cleanup completed', result);
      return result;
    } catch (error) {
      logger.error('Session cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId) {
    if (!this.isRedisAvailable) {
      return {
        message: 'User session destruction not available with memory store',
        destroyed: 0
      };
    }

    try {
      const destroyed = await sessionConfig.destroyUserSessions(userId);
      logger.info('User sessions destroyed', {
        userId,
        destroyed
      });
      return destroyed;
    } catch (error) {
      logger.error('Failed to destroy user sessions', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate session configuration
   */
  validateConfig() {
    const config = {
      sessionSecret: !!process.env.SESSION_SECRET || !!process.env.JWT_SECRET,
      redisUrl: !!process.env.REDIS_URL,
      nodeEnv: process.env.NODE_ENV,
      sessionName: 'techverse.sid'
    };

    const issues = [];
    
    if (!config.sessionSecret) {
      issues.push('SESSION_SECRET or JWT_SECRET environment variable not set');
    }
    
    if (!config.redisUrl && config.nodeEnv === 'production') {
      issues.push('REDIS_URL not set in production environment');
    }

    return {
      valid: issues.length === 0,
      config,
      issues
    };
  }

  /**
   * Get session manager status
   */
  getStatus() {
    return {
      initialized: true,
      redisAvailable: this.isRedisAvailable,
      store: this.isRedisAvailable ? 'redis' : 'memory',
      features: {
        sessionPersistence: this.isRedisAvailable,
        sessionCleanup: this.isRedisAvailable,
        multiDeviceSupport: true,
        sessionInvalidation: this.isRedisAvailable,
        hybridAuth: true
      }
    };
  }

  /**
   * Test session functionality
   */
  async test(req) {
    const tests = [];

    // Test 1: Session middleware
    tests.push({
      name: 'Session Middleware',
      passed: !!req.session,
      details: req.session ? 'Session object available' : 'No session object'
    });

    // Test 2: Session ID
    tests.push({
      name: 'Session ID Generation',
      passed: !!req.sessionID,
      details: req.sessionID ? `Session ID: ${req.sessionID.substring(0, 8)}...` : 'No session ID'
    });

    // Test 3: Session data
    const testKey = 'test_' + Date.now();
    const testValue = 'test_value';
    
    try {
      req.session[testKey] = testValue;
      const retrieved = req.session[testKey];
      
      tests.push({
        name: 'Session Data Storage',
        passed: retrieved === testValue,
        details: retrieved === testValue ? 'Data stored and retrieved' : 'Data storage failed'
      });
      
      // Cleanup
      delete req.session[testKey];
    } catch (error) {
      tests.push({
        name: 'Session Data Storage',
        passed: false,
        details: `Error: ${error.message}`
      });
    }

    // Test 4: Redis connection (if available)
    if (this.isRedisAvailable) {
      try {
        const stats = await this.getStats();
        tests.push({
          name: 'Redis Connection',
          passed: !stats.error,
          details: stats.error ? `Redis error: ${stats.error}` : 'Redis connected'
        });
      } catch (error) {
        tests.push({
          name: 'Redis Connection',
          passed: false,
          details: `Redis test failed: ${error.message}`
        });
      }
    }

    return {
      allPassed: tests.every(test => test.passed),
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      }
    };
  }

  /**
   * Close session manager
   */
  async close() {
    if (this.isRedisAvailable) {
      try {
        await sessionConfig.close();
        logger.info('Session manager closed');
      } catch (error) {
        logger.error('Error closing session manager', {
          error: error.message
        });
      }
    }
  }
}

// Export singleton instance
export default new SessionManager();