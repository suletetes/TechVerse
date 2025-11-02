import { CacheManager, generateCacheKey } from '../utils/performanceOptimizer.js';
import enhancedLogger from '../utils/enhancedLogger.js';

/**
 * Caching Middleware for API responses
 * Provides intelligent caching with Redis fallback to memory cache
 */

// Initialize cache manager (will be set up with Redis client if available)
let cacheManager = null;

/**
 * Initialize cache manager with optional Redis client
 */
export const initializeCacheManager = (redisClient = null) => {
  cacheManager = new CacheManager(redisClient);
  enhancedLogger.info('Cache manager initialized', {
    redisAvailable: !!redisClient
  });
};

/**
 * Generic cache middleware factory
 */
export const createCacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = null,
    skipCache = null,
    onHit = null,
    onMiss = null
  } = options;

  return async (req, res, next) => {
    // Skip caching if no cache manager or skip condition is met
    if (!cacheManager || (skipCache && skipCache(req))) {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? 
      keyGenerator(req) : 
      generateCacheKey(`api:${req.method}:${req.originalUrl}`, req.query);

    try {
      // Try to get cached response
      const cachedResponse = await cacheManager.get(cacheKey);
      
      if (cachedResponse) {
        // Cache hit
        if (onHit) onHit(req, cacheKey);
        
        enhancedLogger.debug('Cache hit', {
          key: cacheKey,
          endpoint: req.originalUrl,
          requestId: req.id
        });

        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cachedResponse);
      }

      // Cache miss - continue to route handler
      if (onMiss) onMiss(req, cacheKey);
      
      enhancedLogger.debug('Cache miss', {
        key: cacheKey,
        endpoint: req.originalUrl,
        requestId: req.id
      });

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheManager.set(cacheKey, data, ttl).catch(error => {
            enhancedLogger.warn('Failed to cache response', {
              key: cacheKey,
              error: error.message,
              requestId: req.id
            });
          });
        }

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      enhancedLogger.error('Cache middleware error', {
        error: error.message,
        endpoint: req.originalUrl,
        requestId: req.id
      });
      
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Product list caching middleware
 */
export const cacheProductList = createCacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => {
    const params = {
      category: req.params.category,
      section: req.query.section,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: req.query.sort,
      search: req.query.search,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      brand: req.query.brand,
      inStock: req.query.inStock
    };
    return generateCacheKey('products:list', params);
  },
  skipCache: (req) => {
    // Skip cache for admin users to ensure fresh data
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Product detail caching middleware
 */
export const cacheProductDetail = createCacheMiddleware({
  ttl: 900, // 15 minutes
  keyGenerator: (req) => {
    return generateCacheKey('products:detail', { id: req.params.id });
  },
  skipCache: (req) => {
    // Skip cache for admin users
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Category list caching middleware
 */
export const cacheCategoryList = createCacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: () => {
    return generateCacheKey('categories:list', {});
  }
});

/**
 * Dashboard analytics caching middleware
 */
export const cacheDashboardAnalytics = createCacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => {
    const params = {
      dateRange: req.query.dateRange,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    return generateCacheKey('admin:dashboard', params);
  },
  skipCache: (req) => {
    // Only cache for admin users
    return !req.user || req.user.role !== 'admin';
  }
});

/**
 * Search results caching middleware
 */
export const cacheSearchResults = createCacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => {
    const params = {
      q: req.query.q,
      category: req.query.category,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: req.query.sort
    };
    return generateCacheKey('search:results', params);
  }
});

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  // Invalidate product-related caches
  invalidateProductCaches: async (productId = null) => {
    if (!cacheManager) return;

    try {
      if (productId) {
        // Invalidate specific product cache
        await cacheManager.delete(generateCacheKey('products:detail', { id: productId }));
      }
      
      // Invalidate product list caches
      await cacheManager.clear('products:list:*');
      await cacheManager.clear('search:results:*');
      
      enhancedLogger.info('Product caches invalidated', { productId });
    } catch (error) {
      enhancedLogger.error('Failed to invalidate product caches', {
        error: error.message,
        productId
      });
    }
  },

  // Invalidate category-related caches
  invalidateCategoryCaches: async () => {
    if (!cacheManager) return;

    try {
      await cacheManager.clear('categories:*');
      await cacheManager.clear('products:list:*');
      
      enhancedLogger.info('Category caches invalidated');
    } catch (error) {
      enhancedLogger.error('Failed to invalidate category caches', {
        error: error.message
      });
    }
  },

  // Invalidate dashboard caches
  invalidateDashboardCaches: async () => {
    if (!cacheManager) return;

    try {
      await cacheManager.clear('admin:dashboard:*');
      
      enhancedLogger.info('Dashboard caches invalidated');
    } catch (error) {
      enhancedLogger.error('Failed to invalidate dashboard caches', {
        error: error.message
      });
    }
  },

  // Invalidate all caches
  invalidateAllCaches: async () => {
    if (!cacheManager) return;

    try {
      await cacheManager.clear();
      
      enhancedLogger.info('All caches invalidated');
    } catch (error) {
      enhancedLogger.error('Failed to invalidate all caches', {
        error: error.message
      });
    }
  }
};

/**
 * Cache statistics middleware
 */
export const cacheStats = (req, res, next) => {
  if (!cacheManager) {
    return next();
  }

  // Add cache statistics to response headers for debugging
  res.on('finish', () => {
    const cacheHeader = res.getHeader('X-Cache');
    if (cacheHeader) {
      enhancedLogger.performance('Cache operation', {
        result: cacheHeader,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        requestId: req.id
      });
    }
  });

  next();
};

/**
 * Cache warming utilities
 */
export const cacheWarming = {
  // Warm up product caches
  warmProductCaches: async () => {
    if (!cacheManager) return;

    try {
      enhancedLogger.info('Starting cache warming for products...');
      
      // This would typically make requests to popular endpoints
      // to pre-populate the cache. Implementation depends on your
      // specific use case and popular routes.
      
      enhancedLogger.info('Product cache warming completed');
    } catch (error) {
      enhancedLogger.error('Failed to warm product caches', {
        error: error.message
      });
    }
  }
};

export default {
  initializeCacheManager,
  createCacheMiddleware,
  cacheProductList,
  cacheProductDetail,
  cacheCategoryList,
  cacheDashboardAnalytics,
  cacheSearchResults,
  cacheInvalidation,
  cacheStats,
  cacheWarming
};