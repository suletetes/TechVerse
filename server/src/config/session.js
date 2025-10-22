import session from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';
import logger from '../utils/logger.js';

/**
 * Redis Session Configuration
 * Implements hybrid session + JWT authentication approach
 */
class SessionConfig {
  constructor() {
    this.redis = null;
    this.store = null;
    this.sessionConfig = null;
  }

  /**
   * Initialize Redis connection for sessions
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Parse Redis URL for configuration
      const redisConfig = this.parseRedisUrl(redisUrl);
      
      this.redis = new Redis({
        ...redisConfig,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4, // Force IPv4
        // Connection pool settings
        maxLoadingTimeout: 5000,
        // Reconnection settings
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        }
      });

      // Event handlers
      this.redis.on('connect', () => {
        logger.info('Redis session store connected', {
          host: redisConfig.host,
          port: redisConfig.port,
          db: redisConfig.db || 0
        });
      });

      this.redis.on('ready', () => {
        logger.info('Redis session store ready');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis session store error', {
          error: error.message,
          stack: error.stack
        });
      });

      this.redis.on('close', () => {
        logger.warn('Redis session store connection closed');
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis session store reconnecting...');
      });

      // Test connection
      await this.redis.ping();
      logger.info('Redis session store connection test successful');

      return this.redis;
    } catch (error) {
      logger.error('Failed to initialize Redis for sessions', {
        error: error.message,
        stack: error.stack,
        redisUrl: process.env.REDIS_URL ? 'configured' : 'default'
      });
      throw error;
    }
  }

  /**
   * Parse Redis URL into configuration object
   */
  parseRedisUrl(url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || 'localhost',
        port: parseInt(parsed.port) || 6379,
        password: parsed.password || undefined,
        db: parsed.pathname ? parseInt(parsed.pathname.slice(1)) || 0 : 0,
        username: parsed.username || undefined
      };
    } catch (error) {
      logger.warn('Failed to parse Redis URL, using defaults', {
        error: error.message,
        url: url
      });
      return {
        host: 'localhost',
        port: 6379,
        db: 0
      };
    }
  }

  /**
   * Create Redis store for sessions
   */
  createRedisStore() {
    if (!this.redis) {
      throw new Error('Redis connection must be initialized before creating store');
    }

    this.store = new RedisStore({
      client: this.redis,
      prefix: 'techverse:sess:',
      ttl: 24 * 60 * 60, // 24 hours in seconds
      disableTouch: false, // Allow session touch to extend TTL
      disableTTL: false,
      // Serialization options
      serializer: {
        stringify: JSON.stringify,
        parse: JSON.parse
      }
    });

    logger.info('Redis session store created', {
      prefix: 'techverse:sess:',
      ttl: '24 hours'
    });

    return this.store;
  }

  /**
   * Create session configuration
   */
  createSessionConfig() {
    if (!this.store) {
      throw new Error('Redis store must be created before session configuration');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;

    if (!sessionSecret) {
      throw new Error('SESSION_SECRET or JWT_SECRET environment variable is required');
    }

    this.sessionConfig = {
      store: this.store,
      secret: sessionSecret,
      name: 'techverse.sid', // Custom session name
      resave: false, // Don't save session if unmodified
      saveUninitialized: false, // Don't create session until something stored
      rolling: true, // Reset expiry on activity
      cookie: {
        secure: isProduction, // HTTPS only in production
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        sameSite: isProduction ? 'strict' : 'lax' // CSRF protection
      },
      // Custom session ID generator
      genid: () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        return `${timestamp}-${random}`;
      }
    };

    logger.info('Session configuration created', {
      secure: this.sessionConfig.cookie.secure,
      httpOnly: this.sessionConfig.cookie.httpOnly,
      maxAge: '24 hours',
      sameSite: this.sessionConfig.cookie.sameSite,
      store: 'Redis'
    });

    return this.sessionConfig;
  }

  /**
   * Initialize complete session setup
   */
  async initialize() {
    try {
      await this.initializeRedis();
      this.createRedisStore();
      this.createSessionConfig();
      
      logger.info('Session management initialized successfully', {
        store: 'Redis',
        hybrid: 'Session + JWT'
      });

      return session(this.sessionConfig);
    } catch (error) {
      logger.error('Failed to initialize session management', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats() {
    if (!this.redis) {
      return { error: 'Redis not initialized' };
    }

    try {
      const keys = await this.redis.keys('techverse:sess:*');
      const info = await this.redis.info('memory');
      
      return {
        activeSessions: keys.length,
        redisMemory: this.parseRedisMemoryInfo(info),
        uptime: await this.redis.lastsave()
      };
    } catch (error) {
      logger.error('Failed to get session statistics', {
        error: error.message
      });
      return { error: error.message };
    }
  }

  /**
   * Parse Redis memory info
   */
  parseRedisMemoryInfo(info) {
    const lines = info.split('\r\n');
    const memoryInfo = {};
    
    lines.forEach(line => {
      if (line.startsWith('used_memory_human:')) {
        memoryInfo.used = line.split(':')[1];
      }
      if (line.startsWith('used_memory_peak_human:')) {
        memoryInfo.peak = line.split(':')[1];
      }
    });
    
    return memoryInfo;
  }

  /**
   * Clean up expired sessions manually
   */
  async cleanupSessions() {
    if (!this.redis) {
      throw new Error('Redis not initialized');
    }

    try {
      const keys = await this.redis.keys('techverse:sess:*');
      let cleaned = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiry set
          await this.redis.expire(key, 24 * 60 * 60); // Set 24 hour expiry
          cleaned++;
        }
      }

      logger.info('Session cleanup completed', {
        totalSessions: keys.length,
        sessionsUpdated: cleaned
      });

      return { total: keys.length, cleaned };
    } catch (error) {
      logger.error('Session cleanup failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId) {
    if (!this.redis) {
      throw new Error('Redis not initialized');
    }

    try {
      const keys = await this.redis.keys('techverse:sess:*');
      let destroyed = 0;

      for (const key of keys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session.userId === userId.toString()) {
              await this.redis.del(key);
              destroyed++;
            }
          } catch (parseError) {
            // Skip invalid session data
            continue;
          }
        }
      }

      logger.info('User sessions destroyed', {
        userId,
        sessionsDestroyed: destroyed
      });

      return destroyed;
    } catch (error) {
      logger.error('Failed to destroy user sessions', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis session store connection closed');
    }
  }
}

// Export singleton instance
export default new SessionConfig();