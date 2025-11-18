/**
 * Cache Middleware
 * Implements in-memory caching for frequently accessed endpoints
 */

// Simple in-memory cache
const cache = new Map();

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Function to generate cache key from request
 * @returns {function} Express middleware
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `${req.originalUrl || req.url}`;

    // Check if cached response exists
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      const { data, timestamp } = cachedResponse;
      const age = (Date.now() - timestamp) / 1000;

      // Check if cache is still valid
      if (age < ttl) {
        console.log(`[CACHE HIT] ${cacheKey} (age: ${age.toFixed(2)}s)`);
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', age.toFixed(2));
        return res.json(data);
      } else {
        // Cache expired, remove it
        cache.delete(cacheKey);
        console.log(`[CACHE EXPIRED] ${cacheKey}`);
      }
    }

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        console.log(`[CACHE SET] ${cacheKey} (TTL: ${ttl}s)`);
        res.setHeader('X-Cache', 'MISS');
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate cache by pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
const invalidateCache = (pattern) => {
  let count = 0;

  if (typeof pattern === 'string') {
    // Exact match
    if (cache.has(pattern)) {
      cache.delete(pattern);
      count = 1;
    }
  } else if (pattern instanceof RegExp) {
    // Pattern match
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        count++;
      }
    }
  }

  console.log(`[CACHE INVALIDATE] Removed ${count} entries matching pattern: ${pattern}`);
  return count;
};

/**
 * Clear all cache
 */
const clearCache = () => {
  const size = cache.size;
  cache.clear();
  console.log(`[CACHE CLEAR] Removed ${size} entries`);
  return size;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      age: (Date.now() - value.timestamp) / 1000
    }))
  };
};

/**
 * Cache key generators for common patterns
 */
const keyGenerators = {
  // Products list with query params
  productsList: (req) => {
    const { category, page, limit, sort } = req.query;
    return `/api/products?category=${category || 'all'}&page=${page || 1}&limit=${limit || 10}&sort=${sort || 'default'}`;
  },

  // Single product by ID
  productById: (req) => {
    return `/api/products/${req.params.id}`;
  },

  // Categories list
  categories: (req) => {
    return '/api/categories';
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
  getCacheStats,
  keyGenerators
};
