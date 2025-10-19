/**
 * Request Deduplication Service
 * Prevents infinite loops and duplicate API calls by managing pending requests
 * and implementing configurable deduplication strategies.
 */

class RequestDeduplicator {
  constructor(options = {}) {
    this.pendingRequests = new Map();
    this.requestHistory = new Map();
    this.config = {
      maxCacheSize: options.maxCacheSize || 1000,
      cleanupInterval: options.cleanupInterval || 5 * 60 * 1000, // 5 minutes
      historyTtl: options.historyTtl || 10 * 60 * 1000, // 10 minutes
      enableLogging: options.enableLogging || false,
      ...options
    };
    
    // Start periodic cleanup
    this.startCleanupTimer();
  }

  /**
   * Generate request fingerprint for deduplication
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} data - Request data/body
   * @param {Object} headers - Request headers (selective)
   * @returns {string} Unique request signature
   */
  generateFingerprint(method, url, data = null, headers = {}) {
    // Create a normalized representation of the request
    const normalizedMethod = method.toUpperCase();
    const normalizedUrl = this.normalizeUrl(url);
    
    // Include only relevant headers for fingerprinting
    const relevantHeaders = this.extractRelevantHeaders(headers);
    
    // Create data hash for POST/PUT/PATCH requests
    const dataHash = data ? this.hashData(data) : '';
    
    // Combine all components
    const components = [
      normalizedMethod,
      normalizedUrl,
      dataHash,
      JSON.stringify(relevantHeaders)
    ];
    
    const fingerprint = this.simpleHash(components.join('|'));
    
    if (this.config.enableLogging) {
      console.log('🔍 Request fingerprint generated:', {
        method: normalizedMethod,
        url: normalizedUrl,
        fingerprint: fingerprint.substring(0, 12) + '...',
        hasData: !!data
      });
    }
    
    return fingerprint;
  }

  /**
   * Normalize URL for consistent fingerprinting
   * @param {string} url - Original URL
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Sort query parameters for consistency
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();
      
      [...params.keys()].sort().forEach(key => {
        sortedParams.append(key, params.get(key));
      });
      
      return `${urlObj.pathname}${sortedParams.toString() ? '?' + sortedParams.toString() : ''}`;
    } catch (error) {
      // Fallback for relative URLs
      return url;
    }
  }

  /**
   * Extract relevant headers for fingerprinting
   * @param {Object} headers - All request headers
   * @returns {Object} Filtered headers
   */
  extractRelevantHeaders(headers) {
    const relevantHeaderKeys = [
      'content-type',
      'accept',
      'accept-language',
      'cache-control'
    ];
    
    const relevant = {};
    relevantHeaderKeys.forEach(key => {
      const value = headers[key] || headers[key.toLowerCase()];
      if (value) {
        relevant[key] = value;
      }
    });
    
    return relevant;
  }

  /**
   * Create hash of request data
   * @param {*} data - Request data
   * @returns {string} Data hash
   */
  hashData(data) {
    try {
      if (data instanceof FormData) {
        // Handle FormData specially
        const entries = [];
        for (const [key, value] of data.entries()) {
          entries.push(`${key}:${value instanceof File ? `file:${value.name}:${value.size}` : value}`);
        }
        return this.simpleHash(entries.sort().join('|'));
      }
      
      if (typeof data === 'object' && data !== null) {
        return this.simpleHash(JSON.stringify(data));
      }
      
      return this.simpleHash(String(data));
    } catch (error) {
      return this.simpleHash('unparseable-data');
    }
  }

  /**
   * Simple hash function for fingerprinting
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if request should be deduplicated based on strategy
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} options - Deduplication options
   * @returns {boolean} Whether to deduplicate
   */
  shouldDeduplicate(method, url, options = {}) {
    const { 
      dedupe = true, 
      strategy = 'default',
      forceNew = false 
    } = options;
    
    if (!dedupe || forceNew) {
      return false;
    }
    
    // Apply strategy-based rules
    switch (strategy) {
      case 'aggressive':
        return true;
      
      case 'conservative':
        return this.isIdempotentMethod(method);
      
      case 'endpoint-based':
        return this.isDeduplicatableEndpoint(url);
      
      case 'default':
      default:
        // Default strategy: dedupe GET requests and idempotent operations
        return this.isIdempotentMethod(method) || this.isReadOnlyEndpoint(url);
    }
  }

  /**
   * Check if HTTP method is idempotent
   * @param {string} method - HTTP method
   * @returns {boolean} Whether method is idempotent
   */
  isIdempotentMethod(method) {
    const idempotentMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];
    return idempotentMethods.includes(method.toUpperCase());
  }

  /**
   * Check if endpoint is read-only
   * @param {string} url - Request URL
   * @returns {boolean} Whether endpoint is read-only
   */
  isReadOnlyEndpoint(url) {
    const readOnlyPatterns = [
      /\/search/,
      /\/categories/,
      /\/featured/,
      /\/profile$/,
      /\/dashboard$/,
      /\/analytics/
    ];
    
    return readOnlyPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if endpoint should be deduplicated
   * @param {string} url - Request URL
   * @returns {boolean} Whether to deduplicate
   */
  isDeduplicatableEndpoint(url) {
    // Endpoints that benefit from deduplication
    const deduplicatablePatterns = [
      /\/products/,
      /\/search/,
      /\/categories/,
      /\/dashboard/,
      /\/analytics/,
      /\/profile/
    ];
    
    // Endpoints that should NOT be deduplicated
    const nonDeduplicatablePatterns = [
      /\/auth\/login/,
      /\/auth\/logout/,
      /\/orders$/,
      /\/payments/,
      /\/upload/
    ];
    
    if (nonDeduplicatablePatterns.some(pattern => pattern.test(url))) {
      return false;
    }
    
    return deduplicatablePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Add pending request to queue
   * @param {string} fingerprint - Request fingerprint
   * @param {Promise} promise - Request promise
   * @param {Object} metadata - Request metadata
   */
  addPendingRequest(fingerprint, promise, metadata = {}) {
    const requestInfo = {
      promise,
      timestamp: Date.now(),
      metadata: {
        method: metadata.method,
        url: metadata.url,
        ...metadata
      }
    };
    
    this.pendingRequests.set(fingerprint, requestInfo);
    
    // Clean up when promise resolves/rejects
    promise.finally(() => {
      this.removePendingRequest(fingerprint);
      this.addToHistory(fingerprint, requestInfo);
    });
    
    if (this.config.enableLogging) {
      console.log('📝 Request added to pending queue:', {
        fingerprint: fingerprint.substring(0, 12) + '...',
        method: metadata.method,
        url: metadata.url,
        queueSize: this.pendingRequests.size
      });
    }
  }

  /**
   * Get pending request if exists
   * @param {string} fingerprint - Request fingerprint
   * @returns {Promise|null} Pending request promise
   */
  getPendingRequest(fingerprint) {
    const requestInfo = this.pendingRequests.get(fingerprint);
    
    if (requestInfo) {
      if (this.config.enableLogging) {
        console.log('🔄 Returning existing pending request:', {
          fingerprint: fingerprint.substring(0, 12) + '...',
          age: Date.now() - requestInfo.timestamp,
          method: requestInfo.metadata.method,
          url: requestInfo.metadata.url
        });
      }
      
      return requestInfo.promise;
    }
    
    return null;
  }

  /**
   * Remove pending request from queue
   * @param {string} fingerprint - Request fingerprint
   */
  removePendingRequest(fingerprint) {
    const removed = this.pendingRequests.delete(fingerprint);
    
    if (removed && this.config.enableLogging) {
      console.log('✅ Request removed from pending queue:', {
        fingerprint: fingerprint.substring(0, 12) + '...',
        remainingInQueue: this.pendingRequests.size
      });
    }
  }

  /**
   * Add completed request to history
   * @param {string} fingerprint - Request fingerprint
   * @param {Object} requestInfo - Request information
   */
  addToHistory(fingerprint, requestInfo) {
    this.requestHistory.set(fingerprint, {
      ...requestInfo,
      completedAt: Date.now()
    });
    
    // Prevent history from growing too large
    if (this.requestHistory.size > this.config.maxCacheSize) {
      this.cleanupHistory();
    }
  }

  /**
   * Cleanup expired entries from history and pending requests
   */
  cleanup() {
    const now = Date.now();
    let cleanedHistory = 0;
    let cleanedPending = 0;
    
    // Clean up history
    for (const [fingerprint, info] of this.requestHistory.entries()) {
      if (now - info.timestamp > this.config.historyTtl) {
        this.requestHistory.delete(fingerprint);
        cleanedHistory++;
      }
    }
    
    // Clean up stale pending requests (older than 5 minutes)
    for (const [fingerprint, info] of this.pendingRequests.entries()) {
      if (now - info.timestamp > 5 * 60 * 1000) {
        this.pendingRequests.delete(fingerprint);
        cleanedPending++;
      }
    }
    
    if (this.config.enableLogging && (cleanedHistory > 0 || cleanedPending > 0)) {
      console.log('🧹 Cleanup completed:', {
        historyEntriesRemoved: cleanedHistory,
        pendingRequestsRemoved: cleanedPending,
        currentHistorySize: this.requestHistory.size,
        currentPendingSize: this.pendingRequests.size
      });
    }
  }

  /**
   * Cleanup history when it gets too large
   */
  cleanupHistory() {
    const entries = Array.from(this.requestHistory.entries());
    
    // Sort by timestamp and keep only the most recent entries
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    this.requestHistory.clear();
    
    const keepCount = Math.floor(this.config.maxCacheSize * 0.8);
    entries.slice(0, keepCount).forEach(([fingerprint, info]) => {
      this.requestHistory.set(fingerprint, info);
    });
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
   * Clear all caches and pending requests
   */
  clearAll() {
    this.pendingRequests.clear();
    this.requestHistory.clear();
    
    if (this.config.enableLogging) {
      console.log('🗑️ All caches cleared');
    }
  }

  /**
   * Get statistics about the deduplicator
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      historySize: this.requestHistory.size,
      maxCacheSize: this.config.maxCacheSize,
      cleanupInterval: this.config.cleanupInterval,
      historyTtl: this.config.historyTtl,
      oldestPendingRequest: this.getOldestPendingRequest(),
      oldestHistoryEntry: this.getOldestHistoryEntry()
    };
  }

  /**
   * Get oldest pending request timestamp
   * @returns {number|null} Timestamp or null
   */
  getOldestPendingRequest() {
    let oldest = null;
    for (const info of this.pendingRequests.values()) {
      if (!oldest || info.timestamp < oldest) {
        oldest = info.timestamp;
      }
    }
    return oldest;
  }

  /**
   * Get oldest history entry timestamp
   * @returns {number|null} Timestamp or null
   */
  getOldestHistoryEntry() {
    let oldest = null;
    for (const info of this.requestHistory.values()) {
      if (!oldest || info.timestamp < oldest) {
        oldest = info.timestamp;
      }
    }
    return oldest;
  }

  /**
   * Destroy the deduplicator and clean up resources
   */
  destroy() {
    this.stopCleanupTimer();
    this.clearAll();
  }
}

// Create and export singleton instance
const requestDeduplicator = new RequestDeduplicator({
  enableLogging: process.env.NODE_ENV === 'development'
});

export default requestDeduplicator;

// Export class for custom instances
export { RequestDeduplicator };