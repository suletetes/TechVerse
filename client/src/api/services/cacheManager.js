/**
 * Intelligent Cache Manager
 * Implements smart caching strategies for different data types and endpoints
 * with automatic invalidation, prefetching, and memory management.
 */

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.metadata = new Map();
    this.config = {
      maxSize: options.maxSize || 500,
      defaultTtl: options.defaultTtl || 5 * 60 * 1000, // 5 minutes
      cleanupInterval: options.cleanupInterval || 2 * 60 * 1000, // 2 minutes
      enableLogging: options.enableLogging || false,
      strategies: {
        products: { ttl: 10 * 60 * 1000, priority: 'high' }, // 10 minutes
        categories: { ttl: 30 * 60 * 1000, priority: 'high' }, // 30 minutes
        search: { ttl: 2 * 60 * 1000, priority: 'medium' }, // 2 minutes
        profile: { ttl: 15 * 60 * 1000, priority: 'high' }, // 15 minutes
        dashboard: { ttl: 1 * 60 * 1000, priority: 'low' }, // 1 minute
        analytics: { ttl: 5 * 60 * 1000, priority: 'low' }, // 5 minutes
        default: { ttl: 5 * 60 * 1000, priority: 'medium' }
      },
      ...options
    };
    
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from request parameters
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @param {Object} data - Request body data
   * @returns {string} Cache key
   */
  generateCacheKey(method, url, params = {}, data = null) {
    const normalizedUrl = this.normalizeUrl(url);
    const sortedParams = this.sortObject(params);
    const dataHash = data ? this.hashData(data) : '';
    
    return `${method.toUpperCase()}:${normalizedUrl}:${JSON.stringify(sortedParams)}:${dataHash}`;
  }

  /**
   * Normalize URL for consistent caching
   * @param {string} url - Original URL
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname;
    } catch (error) {
      return url.replace(/^\/+/, '/');
    }
  }

  /**
   * Sort object keys for consistent serialization
   * @param {Object} obj - Object to sort
   * @returns {Object} Sorted object
   */
  sortObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Hash data for cache key generation
   * @param {*} data - Data to hash
   * @returns {string} Hash string
   */
  hashData(data) {
    try {
      return this.simpleHash(JSON.stringify(data));
    } catch (error) {
      return this.simpleHash(String(data));
    }
  }

  /**
   * Simple hash function
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Determine cache strategy based on endpoint
   * @param {string} url - Request URL
   * @returns {Object} Cache strategy
   */
  getCacheStrategy(url) {
    // Match URL patterns to strategies
    const patterns = {
      products: /\/products/,
      categories: /\/categories/,
      search: /\/search/,
      profile: /\/profile/,
      dashboard: /\/dashboard/,
      analytics: /\/analytics/
    };

    for (const [strategy, pattern] of Object.entries(patterns)) {
      if (pattern.test(url)) {
        return this.config.strategies[strategy];
      }
    }

    return this.config.strategies.default;
  }

  /**
   * Check if request should be cached
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} options - Cache options
   * @returns {boolean} Whether to cache
   */
  shouldCache(method, url, options = {}) {
    const { cache = true, noCache = false } = options;
    
    if (noCache || !cache) return false;
    
    // Only cache GET requests by default
    if (method.toUpperCase() !== 'GET') return false;
    
    // Don't cache authentication endpoints
    if (/\/auth\//.test(url)) return false;
    
    // Don't cache upload endpoints
    if (/\/upload/.test(url)) return false;
    
    // Don't cache real-time data endpoints
    if (/\/realtime|\/live|\/stream/.test(url)) return false;
    
    return true;
  }

  /**
   * Get cached data if available and valid
   * @param {string} cacheKey - Cache key
   * @returns {*} Cached data or null
   */
  get(cacheKey) {
    const entry = this.cache.get(cacheKey);
    const meta = this.metadata.get(cacheKey);
    
    if (!entry || !meta) {
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() > meta.expiresAt) {
      this.delete(cacheKey);
      return null;
    }
    
    // Update access time for LRU
    meta.lastAccessed = Date.now();
    meta.accessCount++;
    
    if (this.config.enableLogging) {
      console.log('📦 Cache hit:', {
        key: cacheKey.substring(0, 50) + '...',
        age: Date.now() - meta.createdAt,
        accessCount: meta.accessCount
      });
    }
    
    return entry.data;
  }

  /**
   * Store data in cache
   * @param {string} cacheKey - Cache key
   * @param {*} data - Data to cache
   * @param {Object} options - Cache options
   */
  set(cacheKey, data, options = {}) {
    const strategy = this.getCacheStrategy(options.url || '');
    const ttl = options.ttl || strategy.ttl || this.config.defaultTtl;
    
    const entry = {
      data: this.cloneData(data),
      size: this.estimateSize(data)
    };
    
    const metadata = {
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      accessCount: 1,
      priority: strategy.priority || 'medium',
      url: options.url || '',
      ttl: ttl,
      size: entry.size
    };
    
    // Check if we need to make space
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(cacheKey, entry);
    this.metadata.set(cacheKey, metadata);
    
    if (this.config.enableLogging) {
      console.log('💾 Cache set:', {
        key: cacheKey.substring(0, 50) + '...',
        ttl: ttl,
        priority: metadata.priority,
        size: entry.size,
        cacheSize: this.cache.size
      });
    }
  }

  /**
   * Delete entry from cache
   * @param {string} cacheKey - Cache key
   */
  delete(cacheKey) {
    const deleted = this.cache.delete(cacheKey);
    this.metadata.delete(cacheKey);
    
    if (deleted && this.config.enableLogging) {
      console.log('🗑️ Cache deleted:', {
        key: cacheKey.substring(0, 50) + '...'
      });
    }
  }

  /**
   * Invalidate cache entries by pattern
   * @param {string|RegExp} pattern - Pattern to match
   */
  invalidate(pattern) {
    let invalidated = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const [key, meta] of this.metadata.entries()) {
      if (regex.test(key) || regex.test(meta.url)) {
        this.delete(key);
        invalidated++;
      }
    }
    
    if (this.config.enableLogging && invalidated > 0) {
      console.log('🔄 Cache invalidated:', {
        pattern: pattern.toString(),
        entriesRemoved: invalidated
      });
    }
    
    return invalidated;
  }

  /**
   * Prefetch data for given URLs
   * @param {Array} urls - URLs to prefetch
   * @param {Function} fetchFn - Function to fetch data
   */
  async prefetch(urls, fetchFn) {
    const prefetchPromises = urls.map(async (url) => {
      try {
        const cacheKey = this.generateCacheKey('GET', url);
        
        // Don't prefetch if already cached
        if (this.get(cacheKey)) {
          return;
        }
        
        const data = await fetchFn(url);
        this.set(cacheKey, data, { url });
        
        if (this.config.enableLogging) {
          console.log('🚀 Prefetched:', { url });
        }
      } catch (error) {
        if (this.config.enableLogging) {
          console.warn('⚠️ Prefetch failed:', { url, error: error.message });
        }
      }
    });
    
    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Evict least recently used entries
   */
  evictLeastUsed() {
    const entries = Array.from(this.metadata.entries());
    
    // Sort by priority and last accessed time
    entries.sort((a, b) => {
      const [, metaA] = a;
      const [, metaB] = b;
      
      // Priority order: low < medium < high
      const priorityOrder = { low: 1, medium: 2, high: 3 };
      const priorityDiff = priorityOrder[metaA.priority] - priorityOrder[metaB.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff; // Lower priority gets evicted first
      }
      
      // If same priority, evict least recently accessed
      return metaA.lastAccessed - metaB.lastAccessed;
    });
    
    // Remove the least important entries (25% of cache)
    const toRemove = Math.max(1, Math.floor(this.config.maxSize * 0.25));
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [key] = entries[i];
      this.delete(key);
    }
    
    if (this.config.enableLogging) {
      console.log('🧹 Cache eviction:', {
        entriesRemoved: toRemove,
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, meta] of this.metadata.entries()) {
      if (now > meta.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }
    
    if (this.config.enableLogging && cleaned > 0) {
      console.log('🧹 Cache cleanup:', {
        expiredEntriesRemoved: cleaned,
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Estimate memory size of data
   * @param {*} data - Data to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch (error) {
      return 1000; // Default estimate
    }
  }

  /**
   * Clone data to prevent mutations
   * @param {*} data - Data to clone
   * @returns {*} Cloned data
   */
  cloneData(data) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      return data; // Return original if can't clone
    }
  }

  /**
   * Start periodic cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.metadata.clear();
    
    if (this.config.enableLogging) {
      console.log('🗑️ Cache cleared');
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const entries = Array.from(this.metadata.values());
    const totalSize = entries.reduce((sum, meta) => sum + meta.size, 0);
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      maxSize: this.config.maxSize,
      totalMemoryUsage: totalSize,
      averageEntrySize: entries.length > 0 ? totalSize / entries.length : 0,
      hitRate: this.calculateHitRate(),
      expiredEntries: entries.filter(meta => now > meta.expiresAt).length,
      priorityDistribution: this.getPriorityDistribution(entries),
      oldestEntry: Math.min(...entries.map(meta => meta.createdAt)),
      newestEntry: Math.max(...entries.map(meta => meta.createdAt))
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   * @returns {number} Hit rate percentage
   */
  calculateHitRate() {
    // This is a simplified calculation
    // In a real implementation, you'd track hits and misses
    const entries = Array.from(this.metadata.values());
    const totalAccesses = entries.reduce((sum, meta) => sum + meta.accessCount, 0);
    const totalEntries = entries.length;
    
    if (totalEntries === 0) return 0;
    
    return Math.min(100, (totalAccesses / totalEntries) * 10); // Rough estimate
  }

  /**
   * Get priority distribution of cached entries
   * @param {Array} entries - Metadata entries
   * @returns {Object} Priority distribution
   */
  getPriorityDistribution(entries) {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    entries.forEach(meta => {
      distribution[meta.priority] = (distribution[meta.priority] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Destroy cache manager and clean up resources
   */
  destroy() {
    this.stopCleanupTimer();
    this.clear();
  }
}

// Create and export singleton instance
const cacheManager = new CacheManager({
  enableLogging: process.env.NODE_ENV === 'development'
});

export default cacheManager;

// Export class for custom instances
export { CacheManager };