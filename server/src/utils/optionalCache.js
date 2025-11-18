import Redis from 'ioredis';
import enhancedLogger from './enhancedLogger.js';

/**
 * Optional Caching System
 * Provides caching functionality with Redis when available, falls back to in-memory cache
 */

class OptionalCache {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.isRedisAvailable = false;
    this.maxMemoryCacheSize = 1000; // Maximum items in memory cache
    this.defaultTTL = 300; // 5 minutes default TTL
    
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection if available
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT;
      const redisPassword = process.env.REDIS_PASSWORD;

      // Only attempt Redis connection if configuration is provided
      if (redisUrl || (redisHost && redisPort)) {
        const redisConfig = {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          connectTimeout: 2000,
          commandTimeout: 2000,
          maxLoadingTimeout: 2000
        };

        if (redisUrl) {
          this.redisClient = new Redis(redisUrl, redisConfig);
        } else {
          this.redisClient = new Redis({
            host: redisHost,
            port: parseInt(redisPort),
            password: redisPassword,
            ...redisConfig
          });
        }

        // Test Redis connection
        await this.redisClient.ping();
        this.isRedisAvailable = true;

        enhancedLogger.info('Redis cache initialized successfully', {
          host: redisHost || 'from URL',
          port: redisPort || 'from URL'
        });

        // Handle Redis connection events
        this.redisClient.on('error', (error) => {
          enhancedLogger.warn('Redis connection error, falling back to memory cache', {
            error: error.message
          });
          this.isRedisAvailable = false;
        });

        this.redisClient.on('connect', () => {
          enhancedLogger.info('Redis reconnected');
          this.isRedisAvailable = true;
        });

        this.redisClient.on('close', () => {
          enhancedLogger.warn('Redis connection closed, using memory cache');
          this.isRedisAvailable = false;
        });

      } else {
        enhancedLogger.info('No Redis configuration found, using memory cache only');
      }
    } catch (error) {
      enhancedLogger.warn('Failed to initialize Redis, using memory cache', {
        error: error.message
      });
      this.isRedisAvailable = false;
    }
  }

  /**
   * Set cache value with optional TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000 // Convert to milliseconds
      });

      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.setex(key, ttl, serializedValue);
        return true;
      } else {
        // Use memory cache as fallback
        this.setMemoryCache(key, serializedValue, ttl);
        return true;
      }
    } catch (error) {
      enhancedLogger.error('Cache set error', {
        error: error.message,
        key: key.substring(0, 50),
        fallbackToMemory: !this.isRedisAvailable
      });

      // Fallback to memory cache on Redis error
      if (this.isRedisAvailable) {
        this.setMemoryCache(key, JSON.stringify({ data: value, timestamp: Date.now(), ttl: ttl * 1000 }), ttl);
      }
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    try {
      let serializedValue = null;

      if (this.isRedisAvailable && this.redisClient) {
        serializedValue = await this.redisClient.get(key);
      } else {
        serializedValue = this.getMemoryCache(key);
      }

      if (!serializedValue) {
        return null;
      }

      const cachedItem = JSON.parse(serializedValue);
      
      // Check if item has expired (for memory cache)
      if (!this.isRedisAvailable) {
        const now = Date.now();
        if (now - cachedItem.timestamp > cachedItem.ttl) {
          this.delete(key);
          return null;
        }
      }

      return cachedItem.data;
    } catch (error) {
      enhancedLogger.error('Cache get error', {
        error: error.message,
        key: key.substring(0, 50)
      });
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      enhancedLogger.error('Cache delete error', {
        error: error.message,
        key: key.substring(0, 50)
      });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const result = await this.redisClient.exists(key);
        return result === 1;
      } else {
        return this.memoryCache.has(key);
      }
    } catch (error) {
      enhancedLogger.error('Cache exists check error', {
        error: error.message,
        key: key.substring(0, 50)
      });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.flushdb();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      enhancedLogger.error('Cache clear error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const stats = {
        type: this.isRedisAvailable ? 'Redis' : 'Memory',
        isRedisAvailable: this.isRedisAvailable,
        memoryItems: this.memoryCache.size
      };

      if (this.isRedisAvailable && this.redisClient) {
        const info = await this.redisClient.info('memory');
        const keyspace = await this.redisClient.info('keyspace');
        
        stats.redisMemory = this.parseRedisInfo(info);
        stats.redisKeyspace = this.parseRedisInfo(keyspace);
      }

      return stats;
    } catch (error) {
      enhancedLogger.error('Cache stats error', {
        error: error.message
      });
      return {
        type: 'Memory',
        isRedisAvailable: false,
        memoryItems: this.memoryCache.size,
        error: error.message
      };
    }
  }

  /**
   * Memory cache operations
   */
  setMemoryCache(key, value, ttl) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, value);

    // Set expiration timer for memory cache
    setTimeout(() => {
      this.memoryCache.delete(key);
    }, ttl * 1000);
  }

  getMemoryCache(key) {
    return this.memoryCache.get(key) || null;
  }

  /**
   * Parse Redis info response
   */
  parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Cache wrapper for functions
   */
  async wrap(key, fn, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn();
      await this.set(key, result, ttl);
      
      return result;
    } catch (error) {
      enhancedLogger.error('Cache wrap error', {
        error: error.message,
        key: key.substring(0, 50)
      });
      
      // Execute function without caching on error
      return await fn();
    }
  }

  /**
   * Batch operations
   */
  async mget(keys) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const values = await this.redisClient.mget(keys);
        return values.map(value => {
          if (!value) return null;
          try {
            const parsed = JSON.parse(value);
            return parsed.data;
          } catch {
            return null;
          }
        });
      } else {
        return keys.map(key => {
          const value = this.getMemoryCache(key);
          if (!value) return null;
          try {
            const parsed = JSON.parse(value);
            const now = Date.now();
            if (now - parsed.timestamp > parsed.ttl) {
              this.memoryCache.delete(key);
              return null;
            }
            return parsed.data;
          } catch {
            return null;
          }
        });
      }
    } catch (error) {
      enhancedLogger.error('Cache mget error', {
        error: error.message,
        keyCount: keys.length
      });
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const pipeline = this.redisClient.pipeline();
        
        for (const [key, value] of keyValuePairs) {
          const serializedValue = JSON.stringify({
            data: value,
            timestamp: Date.now(),
            ttl: ttl * 1000
          });
          pipeline.setex(key, ttl, serializedValue);
        }
        
        await pipeline.exec();
      } else {
        for (const [key, value] of keyValuePairs) {
          const serializedValue = JSON.stringify({
            data: value,
            timestamp: Date.now(),
            ttl: ttl * 1000
          });
          this.setMemoryCache(key, serializedValue, ttl);
        }
      }
      return true;
    } catch (error) {
      enhancedLogger.error('Cache mset error', {
        error: error.message,
        pairCount: keyValuePairs.length
      });
      return false;
    }
  }

  /**
   * Close connections
   */
  async close() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      this.memoryCache.clear();
    } catch (error) {
      enhancedLogger.error('Cache close error', {
        error: error.message
      });
    }
  }
}

// Create singleton instance
const optionalCache = new OptionalCache();

export default optionalCache;