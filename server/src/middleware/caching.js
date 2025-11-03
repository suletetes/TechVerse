import Redis from 'ioredis';
import logger from '../utils/logger.js';

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.initializeRedis();
  }

  // Initialize Redis connection
  initializeRedis() {
    try {
      if (!process.env.REDIS_URL) {
        logger.warn('Redis URL not provided. Caching will use in-memory fallback.');
        this.cache = new Map();
        return;
      }

      this.redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 2,
        lazyConnect: true,
        connectTimeout: 2000,
        commandTimeout: 2000,
        maxLoadingTimeout: 2000
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error:', error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.cache = new Map();
    }
  }

  // Get cached data
  async get(key) {
    try {
      if (this.isConnected && this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to in-memory cache
        const cached = this.cache?.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        }
        return null;
      }
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data
  async set(key, data, ttl = 3600) {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(data));
      } else {
        // Fallback to in-memory cache
        if (this.cache) {
          this.cache.set(key, {
            data,
            expiry: Date.now() + (ttl * 1000)
          });
        }
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  // Delete cached data
  async del(key) {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
      } else {
        if (this.cache) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      if (this.isConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        if (this.cache) {
          for (const key of this.cache.keys()) {
            if (key.includes(pattern.replace('*', ''))) {
              this.cache.delete(key);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
    }
  }

  // Get multiple keys
  async mget(keys) {
    try {
      if (this.isConnected && this.redis) {
        const results = await this.redis.mget(...keys);
        return results.map(result => result ? JSON.parse(result) : null);
      } else {
        if (this.cache) {
          return keys.map(key => {
            const cached = this.cache.get(key);
            if (cached && cached.expiry > Date.now()) {
              return cached.data;
            }
            return null;
          });
        }
        return keys.map(() => null);
      }
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  // Set multiple keys
  async mset(keyValuePairs, ttl = 3600) {
    try {
      if (this.isConnected && this.redis) {
        const pipeline = this.redis.pipeline();
        
        for (const [key, value] of keyValuePairs) {
          pipeline.setex(key, ttl, JSON.stringify(value));
        }
        
        await pipeline.exec();
      } else {
        if (this.cache) {
          const expiry = Date.now() + (ttl * 1000);
          for (const [key, value] of keyValuePairs) {
            this.cache.set(key, { data: value, expiry });
          }
        }
      }
    } catch (error) {
      logger.error('Cache mset error:', error);
    }
  }

  // Increment counter
  async incr(key, ttl = 3600) {
    try {
      if (this.isConnected && this.redis) {
        const result = await this.redis.incr(key);
        if (result === 1) {
          await this.redis.expire(key, ttl);
        }
        return result;
      } else {
        if (this.cache) {
          const cached = this.cache.get(key);
          const current = (cached && cached.expiry > Date.now()) ? cached.data : 0;
          const newValue = current + 1;
          this.cache.set(key, {
            data: newValue,
            expiry: Date.now() + (ttl * 1000)
          });
          return newValue;
        }
        return 1;
      }
    } catch (error) {
      logger.error('Cache incr error:', error);
      return 1;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (this.isConnected && this.redis) {
        return await this.redis.exists(key);
      } else {
        if (this.cache) {
          const cached = this.cache.get(key);
          return cached && cached.expiry > Date.now();
        }
        return false;
      }
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }
}

// Create cache service instance
const cacheService = new CacheService();

// Cache middleware factory
export const cache = (options = {}) => {
  const {
    ttl = 3600, // 1 hour default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    condition = () => true,
    skipCache = (req) => false
  } = options;

  return async (req, res, next) => {
    // Skip caching for certain conditions
    if (!condition(req) || skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey });
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      logger.debug('Cache miss', { key: cacheKey });

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl).catch(error => {
            logger.error('Failed to cache response:', error);
          });
        }
        
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to invalidate cache after successful operations
    const invalidateAfterResponse = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns
        patterns.forEach(pattern => {
          cacheService.clearPattern(pattern).catch(error => {
            logger.error('Failed to invalidate cache pattern:', error);
          });
        });
      }
      return data;
    };

    res.json = function(data) {
      const result = originalJson.call(this, data);
      invalidateAfterResponse(data);
      return result;
    };

    res.send = function(data) {
      const result = originalSend.call(this, data);
      invalidateAfterResponse(data);
      return result;
    };

    next();
  };
};

// Rate limiting with cache
export const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    const key = `rate_limit:${keyGenerator(req)}`;
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;

    try {
      const current = await cacheService.incr(windowKey, Math.ceil(windowMs / 1000));
      
      if (current > max) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - current),
        'X-RateLimit-Reset': new Date(windowStart + windowMs)
      });

      next();

    } catch (error) {
      logger.error('Rate limit error:', error);
      next();
    }
  };
};

// Cache warming utility
export const warmCache = async (routes = []) => {
  logger.info('Starting cache warming...');
  
  for (const route of routes) {
    try {
      const { key, data, ttl = 3600 } = route;
      await cacheService.set(key, data, ttl);
      logger.debug('Cache warmed', { key });
    } catch (error) {
      logger.error('Cache warming failed', { route, error });
    }
  }
  
  logger.info('Cache warming completed');
};

// Export cache service and middleware
export { cacheService };
export default cacheService;