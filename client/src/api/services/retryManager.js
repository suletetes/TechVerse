/**
 * Retry Manager Service
 * Implements configurable retry logic with exponential backoff, jitter,
 * and endpoint-specific retry policies for network and server errors.
 */

class RetryManager {
  constructor(options = {}) {
    this.config = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000, // 1 second
      maxDelay: options.maxDelay || 30000, // 30 seconds
      jitterFactor: options.jitterFactor || 0.1, // 10% jitter
      backoffMultiplier: options.backoffMultiplier || 2,
      enableLogging: options.enableLogging || process.env.NODE_ENV === 'development',
      ...options
    };
    
    // Retry policies for different endpoints and error types
    this.retryPolicies = this.initializeRetryPolicies();
    
    // Track retry attempts per request
    this.retryAttempts = new Map();
    
    // Cleanup timer for retry tracking
    this.startCleanupTimer();
  }

  /**
   * Initialize default retry policies
   * @returns {Object} Retry policies configuration
   */
  initializeRetryPolicies() {
    return {
      // Default policy
      default: {
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
        jitterFactor: 0.1,
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        retryableErrors: ['NetworkError', 'TimeoutError', 'ConnectionError']
      },
      
      // Endpoint-specific policies
      endpoints: {
        '/auth/login': {
          maxRetries: 1, // Don't retry login failures aggressively
          baseDelay: 2000,
          retryableStatuses: [500, 502, 503, 504] // Don't retry 401, 429
        },
        
        '/auth/refresh-token': {
          maxRetries: 2,
          baseDelay: 1000,
          retryableStatuses: [500, 502, 503, 504]
        },
        
        '/products/search': {
          maxRetries: 5, // Search can be retried more aggressively
          baseDelay: 500,
          backoffMultiplier: 1.5,
          retryableStatuses: [408, 429, 500, 502, 503, 504]
        },
        
        '/orders': {
          maxRetries: 2, // Be careful with order operations
          baseDelay: 2000,
          retryableStatuses: [500, 502, 503, 504] // Don't retry client errors
        },
        
        '/upload': {
          maxRetries: 3,
          baseDelay: 2000,
          backoffMultiplier: 2,
          maxDelay: 60000, // Longer max delay for uploads
          retryableStatuses: [408, 500, 502, 503, 504]
        },
        
        '/admin': {
          maxRetries: 2,
          baseDelay: 1500,
          retryableStatuses: [500, 502, 503, 504]
        }
      },
      
      // HTTP method-specific policies
      methods: {
        GET: {
          maxRetries: 5, // GET requests are safe to retry
          baseDelay: 500,
          retryableStatuses: [408, 429, 500, 502, 503, 504]
        },
        
        POST: {
          maxRetries: 2, // Be more careful with POST
          baseDelay: 1500,
          retryableStatuses: [500, 502, 503, 504] // Don't retry 408, 429
        },
        
        PUT: {
          maxRetries: 2, // PUT is idempotent but be careful
          baseDelay: 1500,
          retryableStatuses: [500, 502, 503, 504]
        },
        
        DELETE: {
          maxRetries: 2, // DELETE is idempotent
          baseDelay: 1500,
          retryableStatuses: [500, 502, 503, 504]
        },
        
        PATCH: {
          maxRetries: 1, // PATCH might not be idempotent
          baseDelay: 2000,
          retryableStatuses: [500, 502, 503, 504]
        }
      }
    };
  }

  /**
   * Determine if request should be retried
   * @param {Error} error - The error that occurred
   * @param {Object} context - Request context
   * @param {number} attemptNumber - Current attempt number
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, context, attemptNumber) {
    const policy = this.getRetryPolicy(context);
    
    // Check if we've exceeded max retries
    if (attemptNumber >= policy.maxRetries) {
      if (this.config.enableLogging) {
        console.log('🚫 Max retries exceeded:', {
          attempts: attemptNumber,
          maxRetries: policy.maxRetries,
          url: context.url,
          method: context.method
        });
      }
      return false;
    }
    
    // Check if error is retryable
    if (!this.isRetryableError(error, policy)) {
      if (this.config.enableLogging) {
        console.log('🚫 Error not retryable:', {
          error: error.message,
          status: error.status,
          type: error.name,
          url: context.url
        });
      }
      return false;
    }
    
    return true;
  }

  /**
   * Check if error is retryable based on policy
   * @param {Error} error - The error to check
   * @param {Object} policy - Retry policy
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error, policy) {
    // Check HTTP status codes
    if (error.status) {
      return policy.retryableStatuses.includes(error.status);
    }
    
    // Check error types for network errors
    if (error.name) {
      return policy.retryableErrors.includes(error.name);
    }
    
    // Check error message patterns
    const message = error.message?.toLowerCase() || '';
    const retryablePatterns = [
      'network',
      'timeout',
      'connection',
      'fetch',
      'aborted',
      'unavailable'
    ];
    
    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Get retry policy for request context
   * @param {Object} context - Request context
   * @returns {Object} Retry policy
   */
  getRetryPolicy(context) {
    const { url, method } = context;
    
    // Start with default policy
    let policy = { ...this.retryPolicies.default };
    
    // Apply method-specific policy
    if (method && this.retryPolicies.methods[method.toUpperCase()]) {
      policy = {
        ...policy,
        ...this.retryPolicies.methods[method.toUpperCase()]
      };
    }
    
    // Apply endpoint-specific policy
    if (url) {
      for (const [endpoint, endpointPolicy] of Object.entries(this.retryPolicies.endpoints)) {
        if (url.includes(endpoint)) {
          policy = {
            ...policy,
            ...endpointPolicy
          };
          break;
        }
      }
    }
    
    return policy;
  }

  /**
   * Calculate delay for retry attempt with exponential backoff and jitter
   * @param {number} attemptNumber - Current attempt number (0-based)
   * @param {Object} policy - Retry policy
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(attemptNumber, policy) {
    const {
      baseDelay,
      backoffMultiplier,
      maxDelay,
      jitterFactor
    } = policy;
    
    // Calculate exponential backoff
    const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attemptNumber);
    
    // Apply maximum delay limit
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1); // ±jitterFactor
    const finalDelay = Math.max(0, cappedDelay + jitter);
    
    if (this.config.enableLogging) {
      console.log('⏱️ Retry delay calculated:', {
        attempt: attemptNumber + 1,
        baseDelay,
        exponentialDelay,
        cappedDelay,
        jitter: Math.round(jitter),
        finalDelay: Math.round(finalDelay)
      });
    }
    
    return Math.round(finalDelay);
  }

  /**
   * Execute request with retry logic
   * @param {Function} requestFn - Function that makes the request
   * @param {Object} context - Request context
   * @param {Object} options - Retry options
   * @returns {Promise} Request result
   */
  async executeWithRetry(requestFn, context, options = {}) {
    const requestId = context.requestId || this.generateRequestId();
    const policy = this.getRetryPolicy(context);
    const maxRetries = options.maxRetries ?? policy.maxRetries;
    
    let lastError;
    let attemptNumber = 0;
    
    // Track retry attempts
    this.retryAttempts.set(requestId, {
      startTime: Date.now(),
      attempts: 0,
      context
    });
    
    while (attemptNumber <= maxRetries) {
      try {
        if (this.config.enableLogging && attemptNumber > 0) {
          console.log('🔄 Retrying request:', {
            attempt: attemptNumber + 1,
            maxRetries: maxRetries + 1,
            url: context.url,
            method: context.method,
            requestId
          });
        }
        
        // Update attempt count
        const trackingInfo = this.retryAttempts.get(requestId);
        if (trackingInfo) {
          trackingInfo.attempts = attemptNumber + 1;
        }
        
        // Execute request
        const result = await requestFn();
        
        // Success - clean up tracking
        this.retryAttempts.delete(requestId);
        
        if (this.config.enableLogging && attemptNumber > 0) {
          console.log('✅ Request succeeded after retry:', {
            totalAttempts: attemptNumber + 1,
            url: context.url,
            requestId
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        attemptNumber++;
        
        // Check if we should retry
        if (!this.shouldRetry(error, context, attemptNumber)) {
          break;
        }
        
        // Calculate delay for next attempt
        const delay = this.calculateDelay(attemptNumber - 1, policy);
        
        if (this.config.enableLogging) {
          console.log('⏳ Waiting before retry:', {
            delay,
            attempt: attemptNumber,
            error: error.message,
            status: error.status,
            url: context.url
          });
        }
        
        // Wait before retry
        await this.delay(delay);
      }
    }
    
    // All retries exhausted - clean up tracking and throw error
    this.retryAttempts.delete(requestId);
    
    if (this.config.enableLogging) {
      console.error('❌ Request failed after all retries:', {
        totalAttempts: attemptNumber,
        maxRetries: maxRetries + 1,
        finalError: lastError.message,
        url: context.url,
        requestId
      });
    }
    
    // Enhance error with retry information
    lastError.retryAttempts = attemptNumber;
    lastError.maxRetries = maxRetries;
    lastError.requestId = requestId;
    
    throw lastError;
  }

  /**
   * Create a delay promise
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get retry statistics for a request
   * @param {string} requestId - Request ID
   * @returns {Object|null} Retry statistics
   */
  getRetryStats(requestId) {
    const trackingInfo = this.retryAttempts.get(requestId);
    if (!trackingInfo) return null;
    
    return {
      requestId,
      attempts: trackingInfo.attempts,
      duration: Date.now() - trackingInfo.startTime,
      context: trackingInfo.context
    };
  }

  /**
   * Get all active retry statistics
   * @returns {Array} Array of retry statistics
   */
  getAllRetryStats() {
    const stats = [];
    for (const [requestId, trackingInfo] of this.retryAttempts.entries()) {
      stats.push({
        requestId,
        attempts: trackingInfo.attempts,
        duration: Date.now() - trackingInfo.startTime,
        context: trackingInfo.context
      });
    }
    return stats;
  }

  /**
   * Update retry policy for specific endpoint
   * @param {string} endpoint - Endpoint pattern
   * @param {Object} policy - Policy configuration
   */
  updateEndpointPolicy(endpoint, policy) {
    this.retryPolicies.endpoints[endpoint] = {
      ...this.retryPolicies.default,
      ...policy
    };
    
    if (this.config.enableLogging) {
      console.log('📝 Updated retry policy for endpoint:', {
        endpoint,
        policy: this.retryPolicies.endpoints[endpoint]
      });
    }
  }

  /**
   * Update retry policy for HTTP method
   * @param {string} method - HTTP method
   * @param {Object} policy - Policy configuration
   */
  updateMethodPolicy(method, policy) {
    this.retryPolicies.methods[method.toUpperCase()] = {
      ...this.retryPolicies.default,
      ...policy
    };
    
    if (this.config.enableLogging) {
      console.log('📝 Updated retry policy for method:', {
        method: method.toUpperCase(),
        policy: this.retryPolicies.methods[method.toUpperCase()]
      });
    }
  }

  /**
   * Start cleanup timer for retry tracking
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Clean up stale retry tracking every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleTracking();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up stale retry tracking entries
   */
  cleanupStaleTracking() {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    let cleaned = 0;
    
    for (const [requestId, trackingInfo] of this.retryAttempts.entries()) {
      if (now - trackingInfo.startTime > staleThreshold) {
        this.retryAttempts.delete(requestId);
        cleaned++;
      }
    }
    
    if (this.config.enableLogging && cleaned > 0) {
      console.log('🧹 Cleaned up stale retry tracking:', {
        entriesRemoved: cleaned,
        remainingEntries: this.retryAttempts.size
      });
    }
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
   * Clear all retry tracking
   */
  clearAllTracking() {
    this.retryAttempts.clear();
    
    if (this.config.enableLogging) {
      console.log('🗑️ All retry tracking cleared');
    }
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      ...this.config,
      activePolicies: {
        default: this.retryPolicies.default,
        endpointCount: Object.keys(this.retryPolicies.endpoints).length,
        methodCount: Object.keys(this.retryPolicies.methods).length
      },
      activeTracking: this.retryAttempts.size
    };
  }

  /**
   * Destroy the retry manager and clean up resources
   */
  destroy() {
    this.stopCleanupTimer();
    this.clearAllTracking();
  }
}

// Create and export singleton instance
const retryManager = new RetryManager();

export default retryManager;

// Export class for custom instances
export { RetryManager };