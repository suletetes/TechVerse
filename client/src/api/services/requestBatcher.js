/**
 * Request Batching Service
 * Batches multiple API requests together to reduce network overhead
 * and improve performance for bulk operations.
 */

class RequestBatcher {
  constructor(options = {}) {
    this.batches = new Map();
    this.config = {
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 100, // 100ms
      enableLogging: options.enableLogging || false,
      endpoints: {
        // Define batchable endpoints and their configurations
        '/products': {
          batchEndpoint: '/products/batch',
          maxBatchSize: 20,
          timeout: 200
        },
        '/categories': {
          batchEndpoint: '/categories/batch',
          maxBatchSize: 15,
          timeout: 150
        },
        '/search': {
          batchEndpoint: '/search/batch',
          maxBatchSize: 5,
          timeout: 50
        }
      },
      ...options
    };
  }

  /**
   * Check if endpoint supports batching
   * @param {string} endpoint - API endpoint
   * @returns {boolean} Whether endpoint supports batching
   */
  isBatchable(endpoint) {
    return Object.keys(this.config.endpoints).some(pattern => 
      endpoint.includes(pattern)
    );
  }

  /**
   * Get batch configuration for endpoint
   * @param {string} endpoint - API endpoint
   * @returns {Object|null} Batch configuration
   */
  getBatchConfig(endpoint) {
    for (const [pattern, config] of Object.entries(this.config.endpoints)) {
      if (endpoint.includes(pattern)) {
        return { pattern, ...config };
      }
    }
    return null;
  }

  /**
   * Add request to batch queue
   * @param {string} endpoint - API endpoint
   * @param {Object} requestData - Request data
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   * @returns {string} Batch ID
   */
  addToBatch(endpoint, requestData, resolve, reject) {
    const batchConfig = this.getBatchConfig(endpoint);
    if (!batchConfig) {
      throw new Error(`Endpoint ${endpoint} is not batchable`);
    }

    const batchKey = this.generateBatchKey(endpoint, requestData.method);
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        endpoint: batchConfig.batchEndpoint,
        requests: [],
        timeout: null,
        config: batchConfig,
        createdAt: Date.now()
      });
    }

    const batch = this.batches.get(batchKey);
    const requestId = this.generateRequestId();
    
    batch.requests.push({
      id: requestId,
      data: requestData,
      resolve,
      reject,
      timestamp: Date.now()
    });

    // Set or reset timeout
    if (batch.timeout) {
      clearTimeout(batch.timeout);
    }

    const shouldExecuteImmediately = 
      batch.requests.length >= (batchConfig.maxBatchSize || this.config.batchSize);

    if (shouldExecuteImmediately) {
      this.executeBatch(batchKey);
    } else {
      batch.timeout = setTimeout(() => {
        this.executeBatch(batchKey);
      }, batchConfig.timeout || this.config.batchTimeout);
    }

    if (this.config.enableLogging) {
      console.log('📦 Request added to batch:', {
        batchKey,
        requestId,
        batchSize: batch.requests.length,
        willExecuteImmediately: shouldExecuteImmediately
      });
    }

    return requestId;
  }

  /**
   * Execute a batch of requests
   * @param {string} batchKey - Batch identifier
   */
  async executeBatch(batchKey) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) {
      return;
    }

    // Remove batch from queue
    this.batches.delete(batchKey);
    
    // Clear timeout if exists
    if (batch.timeout) {
      clearTimeout(batch.timeout);
    }

    const requests = [...batch.requests];
    
    if (this.config.enableLogging) {
      console.log('🚀 Executing batch:', {
        batchKey,
        requestCount: requests.length,
        endpoint: batch.endpoint
      });
    }

    try {
      // Prepare batch request payload
      const batchPayload = {
        requests: requests.map(req => ({
          id: req.id,
          method: req.data.method || 'GET',
          endpoint: req.data.endpoint,
          params: req.data.params,
          data: req.data.data,
          headers: req.data.headers
        }))
      };

      // Execute batch request
      const response = await this.executeBatchRequest(batch.endpoint, batchPayload);
      
      // Process batch response
      this.processBatchResponse(requests, response);
      
    } catch (error) {
      // If batch fails, reject all requests with the error
      requests.forEach(req => {
        req.reject(new Error(`Batch request failed: ${error.message}`));
      });
      
      if (this.config.enableLogging) {
        console.error('❌ Batch execution failed:', {
          batchKey,
          error: error.message,
          requestCount: requests.length
        });
      }
    }
  }

  /**
   * Execute the actual batch HTTP request
   * @param {string} batchEndpoint - Batch endpoint URL
   * @param {Object} payload - Batch payload
   * @returns {Promise<Response>} HTTP response
   */
  async executeBatchRequest(batchEndpoint, payload) {
    // Import API client dynamically to avoid circular dependencies
    const { apiClient } = await import('../interceptors/index.js');
    
    return apiClient.post(batchEndpoint, payload, {
      // Disable batching for batch requests to prevent recursion
      batch: false,
      dedupe: false
    });
  }

  /**
   * Process batch response and resolve individual requests
   * @param {Array} requests - Original requests
   * @param {Object} batchResponse - Batch response data
   */
  processBatchResponse(requests, batchResponse) {
    const responses = batchResponse.responses || [];
    
    // Create a map of request ID to response
    const responseMap = new Map();
    responses.forEach(resp => {
      responseMap.set(resp.id, resp);
    });

    // Resolve each individual request
    requests.forEach(req => {
      const response = responseMap.get(req.id);
      
      if (response) {
        if (response.success) {
          req.resolve(response.data);
        } else {
          const error = new Error(response.error || 'Batch request failed');
          error.status = response.status;
          error.code = response.code;
          req.reject(error);
        }
      } else {
        // No response found for this request
        req.reject(new Error('No response received for request'));
      }
    });

    if (this.config.enableLogging) {
      console.log('✅ Batch processed:', {
        totalRequests: requests.length,
        successfulResponses: responses.filter(r => r.success).length,
        failedResponses: responses.filter(r => !r.success).length
      });
    }
  }

  /**
   * Generate batch key for grouping requests
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {string} Batch key
   */
  generateBatchKey(endpoint, method = 'GET') {
    const batchConfig = this.getBatchConfig(endpoint);
    return `${method}:${batchConfig.pattern}`;
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `batch_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute request with batching if applicable
   * @param {string} endpoint - API endpoint
   * @param {Object} requestData - Request data
   * @returns {Promise} Request promise
   */
  async executeWithBatching(endpoint, requestData) {
    // Only batch GET requests by default
    const method = requestData.method || 'GET';
    
    if (method !== 'GET' || !this.isBatchable(endpoint)) {
      // Execute immediately if not batchable
      const { apiClient } = await import('../interceptors/index.js');
      return apiClient.request(endpoint, requestData);
    }

    // Add to batch and return promise
    return new Promise((resolve, reject) => {
      this.addToBatch(endpoint, { ...requestData, endpoint }, resolve, reject);
    });
  }

  /**
   * Flush all pending batches immediately
   */
  flushAll() {
    const batchKeys = Array.from(this.batches.keys());
    
    if (this.config.enableLogging && batchKeys.length > 0) {
      console.log('🔄 Flushing all batches:', {
        batchCount: batchKeys.length
      });
    }
    
    batchKeys.forEach(batchKey => {
      this.executeBatch(batchKey);
    });
  }

  /**
   * Get statistics about current batches
   * @returns {Object} Batch statistics
   */
  getStats() {
    const batches = Array.from(this.batches.values());
    
    return {
      activeBatches: this.batches.size,
      totalPendingRequests: batches.reduce((sum, batch) => sum + batch.requests.length, 0),
      oldestBatch: batches.length > 0 ? Math.min(...batches.map(b => b.createdAt)) : null,
      batchSizeDistribution: batches.reduce((dist, batch) => {
        const size = batch.requests.length;
        dist[size] = (dist[size] || 0) + 1;
        return dist;
      }, {}),
      averageBatchSize: batches.length > 0 
        ? batches.reduce((sum, batch) => sum + batch.requests.length, 0) / batches.length 
        : 0
    };
  }

  /**
   * Clear all batches and timeouts
   */
  clear() {
    for (const batch of this.batches.values()) {
      if (batch.timeout) {
        clearTimeout(batch.timeout);
      }
      
      // Reject all pending requests
      batch.requests.forEach(req => {
        req.reject(new Error('Batch cleared'));
      });
    }
    
    this.batches.clear();
    
    if (this.config.enableLogging) {
      console.log('🗑️ All batches cleared');
    }
  }

  /**
   * Destroy batcher and clean up resources
   */
  destroy() {
    this.clear();
  }
}

// Create and export singleton instance
const requestBatcher = new RequestBatcher({
  enableLogging: process.env.NODE_ENV === 'development'
});

export default requestBatcher;

// Export class for custom instances
export { RequestBatcher };