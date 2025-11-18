/**
 * Optimized Performance Integration
 * Integrates caching, deduplication, and performance monitoring for optimal API performance
 */

import intelligentCache from './intelligentCache.js';
import requestDeduplicator from './requestDeduplicator.js';
import performanceMonitor from './performanceMonitor.js';
import cacheInvalidationManager from './CacheInvalidationManager.js';
import configManager from '../../config/ConfigManager.js';

class OptimizedPerformanceIntegration {
  constructor() {
    this.config = {
      enableCaching: configManager.get('api.enableCaching', true),
      enableDeduplication: configManager.get('api.enableBatching', true),
      enablePerformanceMonitoring: configManager.get('performance.enableMonitoring', true),
      enableIntelligentPrefetch: configManager.get('api.enablePrefetching', true),
      enableLogging: configManager.get('DEBUG_MODE', false)
    };

    this.metrics = {
      totalRequests: 0,
      cachedRequests: 0,
      deduplicatedRequests: 0,
      prefetchedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };

    this.prefetchQueue = new Set();
    this.prefetchInProgress = new Set();
    this.requestPatterns = new Map();

    // Listen for config changes
    configManager.addListener(this.handleConfigChange.bind(this));

    this.initializeOptimizations();
  }

  /**
   * Initialize performance optimizations
   */
  initializeOptimizations() {
    if (this.config.enableIntelligentPrefetch) {
      this.setupIntelligentPrefetching();
    }

    if (this.config.enableLogging) {
      console.log('🚀 Optimized Performance Integration initialized:', {
        caching: this.config.enableCaching,
        deduplication: this.config.enableDeduplication,
        monitoring: this.config.enablePerformanceMonitoring,
        prefetching: this.config.enableIntelligentPrefetch
      });
    }
  }

  /**
   * Execute optimized API request with all performance features
   * @param {Object} requestConfig - Request configuration
   * @returns {Promise} Optimized request result
   */
  async executeOptimizedRequest(requestConfig) {
    const {
      method,
      url,
      data,
      headers,
      options = {}
    } = requestConfig;

    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Generate request fingerprint for deduplication
      const fingerprint = requestDeduplicator.generateFingerprint(method, url, data, headers);
      
      // Check if deduplication should be applied
      if (this.config.enableDeduplication && 
          requestDeduplicator.shouldDeduplicate(method, url, options)) {
        
        const pendingRequest = requestDeduplicator.getPendingRequest(fingerprint);
        if (pendingRequest) {
          this.metrics.deduplicatedRequests++;
          
          if (this.config.enableLogging) {
            console.log('🔄 Request deduplicated:', { method, url });
          }
          
          return pendingRequest;
        }
      }

      // Generate cache key for caching
      const cacheKey = this.generateCacheKey(method, url, data, options);
      
      // Check cache for GET requests
      if (this.config.enableCaching && method.toUpperCase() === 'GET') {
        const cachedResult = await intelligentCache.get(
          cacheKey,
          () => this.executeActualRequest(requestConfig),
          {
            strategy: this.determineCacheStrategy(url),
            tags: this.extractCacheTags(url),
            metadata: { method, url, fingerprint }
          }
        );

        if (cachedResult) {
          this.metrics.cachedRequests++;
          this.recordRequestMetrics(startTime, true);
          
          // Trigger prefetch opportunities
          if (this.config.enableIntelligentPrefetch) {
            this.analyzePrefetchOpportunities(url, cachedResult);
          }
          
          return cachedResult;
        }
      }

      // Execute actual request
      const requestPromise = this.executeActualRequest(requestConfig);
      
      // Add to deduplication queue if applicable
      if (this.config.enableDeduplication && 
          requestDeduplicator.shouldDeduplicate(method, url, options)) {
        requestDeduplicator.addPendingRequest(fingerprint, requestPromise, {
          method,
          url,
          timestamp: Date.now()
        });
      }

      const result = await requestPromise;
      
      // Process cache invalidation for write operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
        await cacheInvalidationManager.processInvalidation(url, method, {
          data,
          result,
          userId: this.extractUserId(headers, data)
        });
      }

      // Record performance metrics
      this.recordRequestMetrics(startTime, false);
      
      // Analyze for prefetch opportunities
      if (this.config.enableIntelligentPrefetch) {
        this.analyzePrefetchOpportunities(url, result);
      }

      return result;

    } catch (error) {
      this.recordRequestMetrics(startTime, false, error);
      throw error;
    }
  }

  /**
   * Execute the actual HTTP request
   * @param {Object} requestConfig - Request configuration
   * @returns {Promise} Request result
   */
  async executeActualRequest(requestConfig) {
    const { method, url, data, headers, options } = requestConfig;
    const startTime = Date.now();

    // This would be replaced with actual HTTP client call
    // For now, we'll simulate the request
    const response = await this.simulateHttpRequest(requestConfig);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Record performance monitoring data
    if (this.config.enablePerformanceMonitoring) {
      performanceMonitor.recordApiCall(url, method, startTime, endTime, {
        status: response.status,
        transferSize: this.estimateTransferSize(response.data),
        cached: false,
        retried: options.retried || false
      });
    }

    return response.data;
  }

  /**
   * Simulate HTTP request (replace with actual HTTP client)
   * @param {Object} requestConfig - Request configuration
   * @returns {Promise} Simulated response
   */
  async simulateHttpRequest(requestConfig) {
    // Simulate network delay
    const delay = Math.random() * 200 + 50; // 50-250ms
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      status: 200,
      data: { message: 'Simulated response', timestamp: Date.now() }
    };
  }

  /**
   * Generate cache key for request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} options - Request options
   * @returns {string} Cache key
   */
  generateCacheKey(method, url, data, options) {
    const components = [method.toUpperCase(), url];
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      components.push(JSON.stringify(data));
    }
    
    if (options.params) {
      components.push(JSON.stringify(options.params));
    }
    
    return components.join('|');
  }

  /**
   * Determine cache strategy based on URL
   * @param {string} url - Request URL
   * @returns {string} Cache strategy
   */
  determineCacheStrategy(url) {
    if (url.includes('/products/')) return 'products';
    if (url.includes('/categories/')) return 'categories';
    if (url.includes('/user/') || url.includes('/auth/')) return 'user';
    if (url.includes('/search/')) return 'search';
    if (url.includes('/analytics/')) return 'analytics';
    return 'default';
  }

  /**
   * Extract cache tags from URL
   * @param {string} url - Request URL
   * @returns {Array} Cache tags
   */
  extractCacheTags(url) {
    const tags = [];
    
    if (url.includes('/products/')) tags.push('products');
    if (url.includes('/categories/')) tags.push('categories');
    if (url.includes('/users/')) tags.push('users');
    if (url.includes('/orders/')) tags.push('orders');
    if (url.includes('/admin/')) tags.push('admin');
    
    return tags;
  }

  /**
   * Extract user ID from request
   * @param {Object} headers - Request headers
   * @param {*} data - Request data
   * @returns {string|null} User ID
   */
  extractUserId(headers, data) {
    // Try to extract from Authorization header
    const authHeader = headers.Authorization || headers.authorization;
    if (authHeader) {
      // This would need to decode the actual token
      // For now, return a placeholder
      return 'user_from_token';
    }
    
    // Try to extract from request data
    if (data && typeof data === 'object') {
      return data.userId || data.user_id || null;
    }
    
    return null;
  }

  /**
   * Setup intelligent prefetching based on usage patterns
   */
  setupIntelligentPrefetching() {
    // Add prefetch strategies for common patterns
    intelligentCache.addPrefetchStrategy('products', (key, options) => {
      const prefetchKeys = [];
      
      // If viewing a product, prefetch related products
      if (key.includes('/products/') && !key.includes('/related')) {
        const productId = this.extractProductId(key);
        if (productId) {
          prefetchKeys.push(`/products/${productId}/related`);
          prefetchKeys.push(`/products/${productId}/reviews`);
        }
      }
      
      // If viewing category, prefetch popular products
      if (key.includes('/categories/')) {
        prefetchKeys.push('/products/featured');
        prefetchKeys.push('/products/top-sellers');
      }
      
      return prefetchKeys;
    });

    // Add prefetch strategy for user-related data
    intelligentCache.addPrefetchStrategy('user', (key, options) => {
      const prefetchKeys = [];
      
      if (key.includes('/auth/me')) {
        prefetchKeys.push('/users/preferences');
        prefetchKeys.push('/users/addresses');
        prefetchKeys.push('/orders/recent');
      }
      
      return prefetchKeys;
    });
  }

  /**
   * Analyze prefetch opportunities based on current request
   * @param {string} url - Current request URL
   * @param {*} result - Request result
   */
  analyzePrefetchOpportunities(url, result) {
    // Learn from request patterns
    this.updateRequestPatterns(url);
    
    // Determine prefetch candidates based on patterns
    const prefetchCandidates = this.generatePrefetchCandidates(url, result);
    
    // Add to prefetch queue
    prefetchCandidates.forEach(candidate => {
      this.prefetchQueue.add(candidate);
    });
    
    // Process prefetch queue asynchronously
    this.processPrefetchQueue();
  }

  /**
   * Update request patterns for learning
   * @param {string} url - Request URL
   */
  updateRequestPatterns(url) {
    const pattern = this.extractUrlPattern(url);
    
    if (!this.requestPatterns.has(pattern)) {
      this.requestPatterns.set(pattern, {
        count: 0,
        lastAccess: Date.now(),
        relatedPatterns: new Set()
      });
    }
    
    const patternData = this.requestPatterns.get(pattern);
    patternData.count++;
    patternData.lastAccess = Date.now();
  }

  /**
   * Generate prefetch candidates based on patterns
   * @param {string} url - Current URL
   * @param {*} result - Request result
   * @returns {Array} Prefetch candidates
   */
  generatePrefetchCandidates(url, result) {
    const candidates = [];
    
    // Product detail page prefetching
    if (url.includes('/products/') && !url.includes('/related')) {
      const productId = this.extractProductId(url);
      if (productId) {
        candidates.push(`/products/${productId}/related`);
        candidates.push(`/products/${productId}/reviews`);
        
        // If result contains category info, prefetch category products
        if (result && result.category) {
          candidates.push(`/products/category/${result.category}`);
        }
      }
    }
    
    // Category page prefetching
    if (url.includes('/categories/')) {
      candidates.push('/products/featured');
      candidates.push('/products/latest');
    }
    
    // Homepage prefetching
    if (url === '/' || url.includes('/dashboard')) {
      candidates.push('/products/featured');
      candidates.push('/products/top-sellers');
      candidates.push('/categories');
    }
    
    return candidates;
  }

  /**
   * Process prefetch queue
   */
  async processPrefetchQueue() {
    if (this.prefetchQueue.size === 0) return;
    
    const candidates = Array.from(this.prefetchQueue).slice(0, 3); // Limit concurrent prefetches
    this.prefetchQueue.clear();
    
    for (const candidate of candidates) {
      if (!this.prefetchInProgress.has(candidate)) {
        this.prefetchInProgress.add(candidate);
        
        try {
          await intelligentCache.prefetch(
            candidate,
            () => this.executeActualRequest({
              method: 'GET',
              url: candidate,
              headers: {},
              options: { prefetch: true }
            }),
            { prefetched: true }
          );
          
          this.metrics.prefetchedRequests++;
          
          if (this.config.enableLogging) {
            console.log('🔮 Prefetched:', candidate);
          }
        } catch (error) {
          if (this.config.enableLogging) {
            console.warn('Prefetch failed:', candidate, error.message);
          }
        } finally {
          this.prefetchInProgress.delete(candidate);
        }
      }
    }
  }

  /**
   * Extract URL pattern for learning
   * @param {string} url - URL to extract pattern from
   * @returns {string} URL pattern
   */
  extractUrlPattern(url) {
    return url
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, '')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid');
  }

  /**
   * Extract product ID from URL
   * @param {string} url - URL containing product ID
   * @returns {string|null} Product ID
   */
  extractProductId(url) {
    const match = url.match(/\/products\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Estimate transfer size of response
   * @param {*} data - Response data
   * @returns {number} Estimated size in bytes
   */
  estimateTransferSize(data) {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 encoding
    } catch (error) {
      return 1024; // 1KB fallback
    }
  }

  /**
   * Record request metrics
   * @param {number} startTime - Request start time
   * @param {boolean} fromCache - Whether request was served from cache
   * @param {Error} error - Request error if any
   */
  recordRequestMetrics(startTime, fromCache, error = null) {
    const duration = performance.now() - startTime;
    
    this.metrics.totalResponseTime += duration;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;
    
    if (this.config.enablePerformanceMonitoring && !fromCache) {
      performanceMonitor.recordCustomMetric('api_optimization_overhead', duration, {
        fromCache,
        hasError: !!error
      });
    }
  }

  /**
   * Handle configuration changes
   * @param {Object} event - Config change event
   */
  handleConfigChange(event) {
    if (event.path.startsWith('api.') || event.path.startsWith('performance.')) {
      this.config = {
        enableCaching: configManager.get('api.enableCaching', true),
        enableDeduplication: configManager.get('api.enableBatching', true),
        enablePerformanceMonitoring: configManager.get('performance.enableMonitoring', true),
        enableIntelligentPrefetch: configManager.get('api.enablePrefetching', true),
        enableLogging: configManager.get('DEBUG_MODE', false)
      };
      
      if (this.config.enableLogging) {
        console.log('🔧 Performance integration config updated:', this.config);
      }
    }
  }

  /**
   * Get comprehensive performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    return {
      requests: this.metrics,
      cache: intelligentCache.getStats(),
      deduplication: requestDeduplicator.getStats(),
      monitoring: this.config.enablePerformanceMonitoring ? performanceMonitor.getPerformanceReport() : null,
      invalidation: cacheInvalidationManager.getStats(),
      prefetch: {
        queueSize: this.prefetchQueue.size,
        inProgress: this.prefetchInProgress.size,
        patterns: this.requestPatterns.size,
        totalPrefetched: this.metrics.prefetchedRequests
      }
    };
  }

  /**
   * Optimize performance based on current metrics
   */
  optimizePerformance() {
    const stats = this.getPerformanceStats();
    
    // Adjust cache TTL based on hit rate
    const cacheHitRate = parseFloat(stats.cache.hitRate);
    if (cacheHitRate < 50) {
      // Increase cache TTL for better hit rates
      intelligentCache.config.defaultTtl *= 1.2;
    } else if (cacheHitRate > 90) {
      // Decrease cache TTL to ensure freshness
      intelligentCache.config.defaultTtl *= 0.9;
    }
    
    // Adjust prefetch aggressiveness based on success rate
    const prefetchSuccessRate = this.metrics.prefetchedRequests / (this.metrics.prefetchedRequests + this.prefetchQueue.size);
    if (prefetchSuccessRate < 0.5) {
      // Reduce prefetch aggressiveness
      this.prefetchQueue.clear();
    }
    
    if (this.config.enableLogging) {
      console.log('⚡ Performance optimized based on metrics:', {
        cacheHitRate: `${cacheHitRate}%`,
        prefetchSuccessRate: `${(prefetchSuccessRate * 100).toFixed(1)}%`,
        averageResponseTime: `${this.metrics.averageResponseTime.toFixed(2)}ms`
      });
    }
  }

  /**
   * Clear all caches and reset metrics
   */
  clearAll() {
    intelligentCache.clear();
    requestDeduplicator.clearAll();
    cacheInvalidationManager.clearPendingInvalidations();
    this.prefetchQueue.clear();
    this.prefetchInProgress.clear();
    this.requestPatterns.clear();
    
    // Reset metrics
    this.metrics = {
      totalRequests: 0,
      cachedRequests: 0,
      deduplicatedRequests: 0,
      prefetchedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0
    };
    
    if (this.config.enableLogging) {
      console.log('🗑️ All performance caches and metrics cleared');
    }
  }
}

// Create and export singleton instance
const optimizedPerformanceIntegration = new OptimizedPerformanceIntegration();

export default optimizedPerformanceIntegration;
export { OptimizedPerformanceIntegration };