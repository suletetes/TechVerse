/**
 * Intelligent Caching Service
 * Implements smart caching strategies for different data types with
 * cache invalidation policies and prefetching capabilities.
 */

class IntelligentCache {
  constructor(options = {}) {
    this.config = {
      maxSize: options.maxSize || 100, // Maximum number of cached items
      defaultTtl: options.defaultTtl || 5 * 60 * 1000, // 5 minutes default TTL
      maxMemoryUsage: options.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      cleanupInterval: options.cleanupInterval || 2 * 60 * 1000, // 2 minutes
      enableLogging: options.enableLogging || process.env.NODE_ENV === 'development',
      ...options
    };

    // Cache storage with metadata
    this.cache = new Map();
    this.accessTimes = new Map();
    this.hitCounts = new Map();
    this.memoryUsage = 0;

    // Cache strategies for different data types
    this.strategies = {
      products: { ttl: 10 * 60 * 1000, priority: 'high' }, // 10 minutes
      categories: { ttl: 30 * 60 * 1000, priority: 'high' }, // 30 minutes
      user: { ttl: 5 * 60 * 1000, priority: 'medium' }, // 5 minutes
      search: { ttl: 2 * 60 * 1000, priority: 'low' }, // 2 minutes
      analytics: { ttl: 1 * 60 * 1000, priority: 'low' }, // 1 minute
      static: { ttl: 60 * 60 * 1000, priority: 'high' } // 1 hour
    };

    // Prefetch queue and configuration
    this.prefetchQueue = new Set();
    this.prefetchInProgress = new Set();
    this.prefetchStrategies = new Map();

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      prefetches: 0,
      memoryCleanups: 0
    };

    this.startCleanupTimer();
  }

  /**
   * Get data from cache or fetch if not available
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {Object} options - Caching options
   * @returns {Promise} Cached or fetched data
   */
  async get(key, fetchFn, options = {}) {
    const cacheKey = this.normalizeKey(key);
    const cached = this.getFromCache(cacheKey);

    if (cached && !this.isExpired(cached)) {
      this.recordHit(cacheKey);
      
      if (this.config.enableLogging) {
        console.log('🎯 Cache hit:', {
          key: cacheKey,
          age: Date.now() - cached.timestamp,
          hitCount: this.hitCounts.get(cacheKey)
        });
      }

      // Check if we should prefetch related data
      this.checkPrefetchOpportunities(cacheKey, options);

      return cached.data;
    }

    // Cache miss - fetch data
    this.recordMiss(cacheKey);
    
    if (this.config.enableLogging) {
      console.log('❌ Cache miss:', {
        key: cacheKey,
        expired: cached ? this.isExpired(cached) : false
      });
    }

    try {
      const data = await fetchFn();
      this.set(cacheKey, data, options);
      return data;
    } catch (error) {
      // If fetch fails and we have expired data, return it as fallback
      if (cached && this.isExpired(cached)) {
        console.warn('🔄 Using expired cache as fallback:', cacheKey);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Set data in cache with intelligent strategy selection
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {Object} options - Caching options
   */
  set(key, data, options = {}) {
    const cacheKey = this.normalizeKey(key);
    const strategy = this.selectStrategy(cacheKey, options);
    const size = this.estimateSize(data);

    // Check memory constraints
    if (this.memoryUsage + size > this.config.maxMemoryUsage) {
      this.performMemoryCleanup(size);
    }

    // Check cache size constraints
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: strategy.ttl,
      priority: strategy.priority,
      size,
      accessCount: 0,
      lastAccess: Date.now(),
      tags: options.tags || [],
      metadata: options.metadata || {}
    };

    this.cache.set(cacheKey, cacheEntry);
    this.accessTimes.set(cacheKey, Date.now());
    this.hitCounts.set(cacheKey, 0);
    this.memoryUsage += size;

    if (this.config.enableLogging) {
      console.log('💾 Cache set:', {
        key: cacheKey,
        size: this.formatBytes(size),
        ttl: strategy.ttl,
        priority: strategy.priority,
        totalMemory: this.formatBytes(this.memoryUsage)
      });
    }
  }

  /**
   * Get data from cache without fetching
   * @param {string} key - Cache key
   * @returns {Object|null} Cached entry or null
   */
  getFromCache(key) {
    const cacheKey = this.normalizeKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (entry) {
      entry.accessCount++;
      entry.lastAccess = Date.now();
      this.accessTimes.set(cacheKey, Date.now());
    }

    return entry;
  }

  /**
   * Check if cache entry is expired
   * @param {Object} entry - Cache entry
   * @returns {boolean} Whether entry is expired
   */
  isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Invalidate cache entries by key or pattern
   * @param {string|RegExp} pattern - Key or pattern to invalidate
   */
  invalidate(pattern) {
    let invalidatedCount = 0;

    if (typeof pattern === 'string') {
      // Single key invalidation
      const cacheKey = this.normalizeKey(pattern);
      if (this.cache.has(cacheKey)) {
        const entry = this.cache.get(cacheKey);
        this.memoryUsage -= entry.size;
        this.cache.delete(cacheKey);
        this.accessTimes.delete(cacheKey);
        this.hitCounts.delete(cacheKey);
        invalidatedCount = 1;
      }
    } else if (pattern instanceof RegExp) {
      // Pattern-based invalidation
      for (const [key, entry] of this.cache.entries()) {
        if (pattern.test(key)) {
          this.memoryUsage -= entry.size;
          this.cache.delete(key);
          this.accessTimes.delete(key);
          this.hitCounts.delete(key);
          invalidatedCount++;
        }
      }
    }

    if (this.config.enableLogging && invalidatedCount > 0) {
      console.log('🗑️ Cache invalidated:', {
        pattern: pattern.toString(),
        count: invalidatedCount,
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Invalidate cache entries by tags
   * @param {string|string[]} tags - Tags to invalidate
   */
  invalidateByTags(tags) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    let invalidatedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tagsArray.includes(tag))) {
        this.memoryUsage -= entry.size;
        this.cache.delete(key);
        this.accessTimes.delete(key);
        this.hitCounts.delete(key);
        invalidatedCount++;
      }
    }

    if (this.config.enableLogging && invalidatedCount > 0) {
      console.log('🏷️ Cache invalidated by tags:', {
        tags: tagsArray,
        count: invalidatedCount
      });
    }
  }

  /**
   * Prefetch data based on usage patterns
   * @param {string} key - Key to prefetch
   * @param {Function} fetchFn - Function to fetch data
   * @param {Object} options - Prefetch options
   */
  async prefetch(key, fetchFn, options = {}) {
    const cacheKey = this.normalizeKey(key);

    // Skip if already cached and not expired
    const cached = this.getFromCache(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return;
    }

    // Skip if already in progress
    if (this.prefetchInProgress.has(cacheKey)) {
      return;
    }

    this.prefetchInProgress.add(cacheKey);
    this.stats.prefetches++;

    try {
      if (this.config.enableLogging) {
        console.log('🔮 Prefetching:', cacheKey);
      }

      const data = await fetchFn();
      this.set(cacheKey, data, { ...options, prefetched: true });
    } catch (error) {
      console.warn('Prefetch failed:', cacheKey, error.message);
    } finally {
      this.prefetchInProgress.delete(cacheKey);
    }
  }

  /**
   * Add prefetch strategy for automatic prefetching
   * @param {string} pattern - Key pattern to match
   * @param {Function} prefetchFn - Function to generate prefetch keys
   */
  addPrefetchStrategy(pattern, prefetchFn) {
    this.prefetchStrategies.set(pattern, prefetchFn);
  }

  /**
   * Check for prefetch opportunities based on current access
   * @param {string} key - Currently accessed key
   * @param {Object} options - Access options
   */
  checkPrefetchOpportunities(key, options) {
    for (const [pattern, prefetchFn] of this.prefetchStrategies.entries()) {
      if (key.includes(pattern)) {
        const prefetchKeys = prefetchFn(key, options);
        prefetchKeys.forEach(prefetchKey => {
          this.prefetchQueue.add(prefetchKey);
        });
      }
    }

    // Process prefetch queue asynchronously
    this.processPrefetchQueue();
  }

  /**
   * Process prefetch queue
   */
  async processPrefetchQueue() {
    if (this.prefetchQueue.size === 0) return;

    const keysToProcess = Array.from(this.prefetchQueue).slice(0, 3); // Limit concurrent prefetches
    this.prefetchQueue.clear();

    for (const key of keysToProcess) {
      // This would need to be implemented with actual fetch functions
      // For now, we just log the prefetch opportunity
      if (this.config.enableLogging) {
        console.log('📋 Queued for prefetch:', key);
      }
    }
  }

  /**
   * Select caching strategy based on key and options
   * @param {string} key - Cache key
   * @param {Object} options - Caching options
   * @returns {Object} Strategy configuration
   */
  selectStrategy(key, options) {
    // Use explicit strategy if provided
    if (options.strategy) {
      return {
        ttl: options.ttl || this.config.defaultTtl,
        priority: options.priority || 'medium'
      };
    }

    // Auto-detect strategy based on key patterns
    for (const [type, strategy] of Object.entries(this.strategies)) {
      if (key.includes(type)) {
        return strategy;
      }
    }

    // Default strategy
    return {
      ttl: options.ttl || this.config.defaultTtl,
      priority: options.priority || 'medium'
    };
  }

  /**
   * Estimate memory size of data
   * @param {*} data - Data to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateSize(data) {
    try {
      if (data === null || data === undefined) return 0;
      
      if (typeof data === 'string') {
        return data.length * 2; // UTF-16 encoding
      }
      
      if (typeof data === 'number') {
        return 8; // 64-bit number
      }
      
      if (typeof data === 'boolean') {
        return 4;
      }
      
      if (data instanceof ArrayBuffer) {
        return data.byteLength;
      }
      
      // For objects and arrays, use JSON string length as approximation
      return JSON.stringify(data).length * 2;
    } catch (error) {
      // Fallback for circular references or non-serializable data
      return 1024; // 1KB default estimate
    }
  }

  /**
   * Perform memory cleanup when approaching limits
   * @param {number} requiredSpace - Space needed for new entry
   */
  performMemoryCleanup(requiredSpace) {
    const targetMemory = this.config.maxMemoryUsage * 0.8; // Clean to 80% capacity
    const spaceToFree = (this.memoryUsage + requiredSpace) - targetMemory;
    
    if (spaceToFree <= 0) return;

    // Sort entries by priority and access patterns
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
      score: this.calculateEvictionScore(entry)
    })).sort((a, b) => a.score - b.score); // Lower score = higher eviction priority

    let freedSpace = 0;
    let evictedCount = 0;

    for (const { key, entry } of entries) {
      if (freedSpace >= spaceToFree) break;

      this.memoryUsage -= entry.size;
      freedSpace += entry.size;
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.hitCounts.delete(key);
      evictedCount++;
    }

    this.stats.memoryCleanups++;
    this.stats.evictions += evictedCount;

    if (this.config.enableLogging) {
      console.log('🧹 Memory cleanup completed:', {
        freedSpace: this.formatBytes(freedSpace),
        evictedEntries: evictedCount,
        currentMemory: this.formatBytes(this.memoryUsage)
      });
    }
  }

  /**
   * Evict least recently used entry
   */
  evictLeastUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.memoryUsage -= entry.size;
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
      this.hitCounts.delete(oldestKey);
      this.stats.evictions++;

      if (this.config.enableLogging) {
        console.log('🗑️ Evicted LRU entry:', oldestKey);
      }
    }
  }

  /**
   * Calculate eviction score for cache entry
   * @param {Object} entry - Cache entry
   * @returns {number} Eviction score (lower = higher eviction priority)
   */
  calculateEvictionScore(entry) {
    const age = Date.now() - entry.timestamp;
    const timeSinceAccess = Date.now() - entry.lastAccess;
    const priorityWeight = entry.priority === 'high' ? 3 : entry.priority === 'medium' ? 2 : 1;
    
    // Score based on: age, access recency, access frequency, priority, and size
    return (
      (age / entry.ttl) * 0.3 + // Age relative to TTL
      (timeSinceAccess / (24 * 60 * 60 * 1000)) * 0.3 + // Days since last access
      (1 / (entry.accessCount + 1)) * 0.2 + // Inverse of access frequency
      (1 / priorityWeight) * 0.1 + // Inverse of priority
      (entry.size / (1024 * 1024)) * 0.1 // Size in MB
    );
  }

  /**
   * Record cache hit
   * @param {string} key - Cache key
   */
  recordHit(key) {
    this.stats.hits++;
    const currentCount = this.hitCounts.get(key) || 0;
    this.hitCounts.set(key, currentCount + 1);
  }

  /**
   * Record cache miss
   * @param {string} key - Cache key
   */
  recordMiss(key) {
    this.stats.misses++;
  }

  /**
   * Normalize cache key
   * @param {string} key - Original key
   * @returns {string} Normalized key
   */
  normalizeKey(key) {
    return key.toLowerCase().trim();
  }

  /**
   * Format bytes for display
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Start periodic cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performPeriodicCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform periodic cleanup of expired entries
   */
  performPeriodicCleanup() {
    let cleanedCount = 0;
    let freedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryUsage -= entry.size;
        freedMemory += entry.size;
        this.cache.delete(key);
        this.accessTimes.delete(key);
        this.hitCounts.delete(key);
        cleanedCount++;
      }
    }

    if (this.config.enableLogging && cleanedCount > 0) {
      console.log('⏰ Periodic cleanup:', {
        expiredEntries: cleanedCount,
        freedMemory: this.formatBytes(freedMemory),
        remainingEntries: this.cache.size
      });
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      memoryUsage: this.formatBytes(this.memoryUsage),
      memoryUsageBytes: this.memoryUsage,
      maxMemoryUsage: this.formatBytes(this.config.maxMemoryUsage),
      averageEntrySize: this.cache.size > 0 
        ? this.formatBytes(this.memoryUsage / this.cache.size)
        : '0 B'
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.hitCounts.clear();
    this.memoryUsage = 0;
    this.prefetchQueue.clear();
    this.prefetchInProgress.clear();

    if (this.config.enableLogging) {
      console.log('🗑️ Cache cleared');
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Create and export singleton instance
const intelligentCache = new IntelligentCache();

export default intelligentCache;
export { IntelligentCache };