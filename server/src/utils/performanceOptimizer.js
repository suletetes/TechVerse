import mongoose from 'mongoose';
import enhancedLogger from './enhancedLogger.js';

/**
 * Performance Optimization Utilities
 * Handles database indexing, query optimization, and performance monitoring
 */

/**
 * Create database indexes for optimal query performance
 */
export const createDatabaseIndexes = async () => {
  try {
    enhancedLogger.info('Creating database indexes for performance optimization...');

    // Users collection indexes
    const User = mongoose.model('User');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ accountStatus: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ createdAt: -1 });

    // Products collection indexes
    const Product = mongoose.model('Product');
    await Product.collection.createIndex({ category: 1, status: 1 });
    await Product.collection.createIndex({ sections: 1 });
    await Product.collection.createIndex({ name: "text", description: "text", brand: "text" });
    await Product.collection.createIndex({ "stock.quantity": 1 });
    await Product.collection.createIndex({ featured: 1, status: 1 });
    await Product.collection.createIndex({ price: 1 });
    await Product.collection.createIndex({ "rating.average": -1 });
    await Product.collection.createIndex({ createdAt: -1 });
    await Product.collection.createIndex({ brand: 1 });
    await Product.collection.createIndex({ tags: 1 });

    // Orders collection indexes
    const Order = mongoose.model('Order');
    await Order.collection.createIndex({ user: 1, createdAt: -1 });
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    await Order.collection.createIndex({ total: -1 });

    // Categories collection indexes
    const Category = mongoose.model('Category');
    await Category.collection.createIndex({ name: 1 }, { unique: true });
    await Category.collection.createIndex({ slug: 1 }, { unique: true });
    await Category.collection.createIndex({ isActive: 1 });

    // Cart collection indexes (if exists)
    try {
      const Cart = mongoose.model('Cart');
      await Cart.collection.createIndex({ user: 1 }, { unique: true });
      await Cart.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
      await Cart.collection.createIndex({ updatedAt: -1 });
    } catch (error) {
      // Cart model might not exist yet
      enhancedLogger.info('Cart model not found, skipping cart indexes');
    }

    // Wishlist collection indexes (if exists)
    try {
      const Wishlist = mongoose.model('Wishlist');
      await Wishlist.collection.createIndex({ user: 1 }, { unique: true });
      await Wishlist.collection.createIndex({ updatedAt: -1 });
    } catch (error) {
      // Wishlist model might not exist yet
      enhancedLogger.info('Wishlist model not found, skipping wishlist indexes');
    }

    // Reviews collection indexes (if exists)
    try {
      const Review = mongoose.model('Review');
      await Review.collection.createIndex({ product: 1, createdAt: -1 });
      await Review.collection.createIndex({ user: 1, createdAt: -1 });
      await Review.collection.createIndex({ rating: -1 });
      await Review.collection.createIndex({ isApproved: 1 });
    } catch (error) {
      // Review model might not exist yet
      enhancedLogger.info('Review model not found, skipping review indexes');
    }

    enhancedLogger.info('Database indexes created successfully');
    return { success: true, message: 'Database indexes created successfully' };
  } catch (error) {
    enhancedLogger.error('Failed to create database indexes', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

/**
 * Query performance monitoring middleware
 */
export const queryPerformanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Override mongoose query execution to monitor performance
  const originalExec = mongoose.Query.prototype.exec;
  
  mongoose.Query.prototype.exec = function() {
    const queryStartTime = Date.now();
    const query = this;
    
    return originalExec.call(this).then(result => {
      const queryDuration = Date.now() - queryStartTime;
      
      // Log slow queries (over 100ms)
      if (queryDuration > 100) {
        enhancedLogger.performance('Slow database query detected', {
          collection: query.model.collection.name,
          operation: query.op,
          duration: queryDuration,
          filter: JSON.stringify(query.getFilter()),
          requestId: req.id,
          endpoint: req.originalUrl
        });
      }
      
      return result;
    }).catch(error => {
      const queryDuration = Date.now() - queryStartTime;
      
      enhancedLogger.error('Database query failed', {
        collection: query.model.collection.name,
        operation: query.op,
        duration: queryDuration,
        error: error.message,
        filter: JSON.stringify(query.getFilter()),
        requestId: req.id,
        endpoint: req.originalUrl
      });
      
      throw error;
    });
  };
  
  next();
};

/**
 * Optimize product queries with proper population and selection
 */
export const optimizeProductQuery = (query, options = {}) => {
  const {
    includeCategory = true,
    includeReviews = false,
    limit = 20,
    sort = { createdAt: -1 },
    select = null
  } = options;

  // Select only necessary fields to reduce data transfer
  if (select) {
    query = query.select(select);
  } else {
    // Default selection for product lists
    query = query.select('name price comparePrice images stock category brand rating featured status shortDescription');
  }

  // Populate category information efficiently
  if (includeCategory) {
    query = query.populate('category', 'name slug');
  }

  // Add sorting and pagination
  query = query.sort(sort).limit(limit);

  return query;
};

/**
 * Cache key generator for consistent caching
 */
export const generateCacheKey = (prefix, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  const paramString = JSON.stringify(sortedParams);
  return `${prefix}:${Buffer.from(paramString).toString('base64')}`;
};

/**
 * Memory-based caching for when Redis is not available
 */
class MemoryCache {
  constructor(maxSize = 1000, ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value, customTtl = null) {
    const expiresAt = Date.now() + (customTtl || this.ttl);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create memory cache instance
const memoryCache = new MemoryCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  memoryCache.cleanup();
}, 300000);

/**
 * Unified caching interface that works with or without Redis
 */
export class CacheManager {
  constructor(redisClient = null) {
    this.redisClient = redisClient;
    this.memoryCache = memoryCache;
    this.isRedisAvailable = false;
    
    if (redisClient) {
      this.checkRedisConnection();
    }
  }

  async checkRedisConnection() {
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        this.isRedisAvailable = true;
        enhancedLogger.info('Redis cache is available and connected');
      }
    } catch (error) {
      this.isRedisAvailable = false;
      enhancedLogger.warn('Redis cache is not available, falling back to memory cache', {
        error: error.message
      });
    }
  }

  async set(key, value, ttl = 300) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.setex(key, ttl, JSON.stringify(value));
      } else {
        this.memoryCache.set(key, value, ttl * 1000);
      }
    } catch (error) {
      enhancedLogger.warn('Cache set operation failed', {
        key,
        error: error.message,
        fallback: 'memory'
      });
      
      // Fallback to memory cache
      this.memoryCache.set(key, value, ttl * 1000);
    }
  }

  async get(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryCache.get(key);
      }
    } catch (error) {
      enhancedLogger.warn('Cache get operation failed', {
        key,
        error: error.message,
        fallback: 'memory'
      });
      
      // Fallback to memory cache
      return this.memoryCache.get(key);
    }
  }

  async delete(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      enhancedLogger.warn('Cache delete operation failed', {
        key,
        error: error.message
      });
    }
  }

  async clear(pattern = null) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        if (pattern) {
          const keys = await this.redisClient.keys(pattern);
          if (keys.length > 0) {
            await this.redisClient.del(...keys);
          }
        } else {
          await this.redisClient.flushdb();
        }
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      enhancedLogger.warn('Cache clear operation failed', {
        pattern,
        error: error.message
      });
    }
  }
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  // Track API response times
  trackResponseTime: (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log slow responses (over 1 second)
      if (duration > 1000) {
        enhancedLogger.performance('Slow API response detected', {
          method: req.method,
          url: req.originalUrl,
          duration,
          statusCode: res.statusCode,
          requestId: req.id
        });
      }
      
      // Track response time metrics
      enhancedLogger.metrics('API response time', {
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        requestId: req.id
      });
    });
    
    next();
  },

  // Monitor memory usage
  trackMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    enhancedLogger.metrics('Memory usage', memUsageMB);
    
    // Alert if memory usage is high
    if (memUsageMB.heapUsed > 500) { // 500MB threshold
      enhancedLogger.warn('High memory usage detected', memUsageMB);
    }
    
    return memUsageMB;
  }
};

export default {
  createDatabaseIndexes,
  queryPerformanceMonitor,
  optimizeProductQuery,
  generateCacheKey,
  CacheManager,
  performanceMonitor
};