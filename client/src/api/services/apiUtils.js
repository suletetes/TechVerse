// API Utility Service - Common operations and helpers
import { apiClient, handleApiResponse } from '../interceptors/index.js';

class ApiUtils {
  constructor() {
    this.requestQueue = new Map();
    this.retryQueue = new Map();
  }

  // Generic CRUD operations
  async create(endpoint, data, options = {}) {
    try {
      const response = await apiClient.post(endpoint, data, options);
      return handleApiResponse(response, { method: 'POST', url: endpoint });
    } catch (error) {
      console.error(`Error creating resource at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to create resource');
    }
  }

  async read(endpoint, params = {}, options = {}) {
    try {
      // Check if batching is enabled and endpoint supports it
      if (options.batch !== false) {
        const { default: requestBatcher } = await import('./requestBatcher.js');
        
        if (requestBatcher.isBatchable(endpoint)) {
          return requestBatcher.executeWithBatching(endpoint, {
            method: 'GET',
            params,
            ...options
          });
        }
      }

      const response = await apiClient.get(endpoint, { params, ...options });
      return handleApiResponse(response, { method: 'GET', url: endpoint });
    } catch (error) {
      console.error(`Error reading resource at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to read resource');
    }
  }

  async update(endpoint, data, options = {}) {
    try {
      const response = await apiClient.put(endpoint, data, options);
      return handleApiResponse(response, { method: 'PUT', url: endpoint });
    } catch (error) {
      console.error(`Error updating resource at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to update resource');
    }
  }

  async patch(endpoint, data, options = {}) {
    try {
      const response = await apiClient.patch(endpoint, data, options);
      return handleApiResponse(response, { method: 'PATCH', url: endpoint });
    } catch (error) {
      console.error(`Error patching resource at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to patch resource');
    }
  }

  async delete(endpoint, options = {}) {
    try {
      const response = await apiClient.delete(endpoint, options);
      return handleApiResponse(response, { method: 'DELETE', url: endpoint });
    } catch (error) {
      console.error(`Error deleting resource at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to delete resource');
    }
  }

  // Batch operations
  async batchCreate(endpoint, dataArray, options = {}) {
    try {
      const response = await apiClient.post(`${endpoint}/batch`, { items: dataArray }, options);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error batch creating resources at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to batch create resources');
    }
  }

  async batchUpdate(endpoint, updates, options = {}) {
    try {
      const response = await apiClient.put(`${endpoint}/batch`, { updates }, options);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error batch updating resources at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to batch update resources');
    }
  }

  async batchDelete(endpoint, ids, options = {}) {
    try {
      const response = await apiClient.delete(`${endpoint}/batch`, { 
        data: { ids }, 
        ...options 
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error batch deleting resources at ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to batch delete resources');
    }
  } 
 // File upload utilities
  async uploadFile(endpoint, file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional fields if provided
      if (options.fields) {
        Object.entries(options.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await apiClient.upload(endpoint, formData, {
        ...options,
        headers: {
          ...options.headers,
          // Don't set Content-Type, let browser set it for FormData
        }
      });
      
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error uploading file to ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  async uploadMultipleFiles(endpoint, files, options = {}) {
    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      
      // Add additional fields if provided
      if (options.fields) {
        Object.entries(options.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await apiClient.upload(endpoint, formData, options);
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error uploading multiple files to ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to upload files');
    }
  }

  // Search utilities
  async search(endpoint, query, filters = {}, options = {}) {
    try {
      const params = {
        q: query,
        ...filters
      };

      const response = await apiClient.get(endpoint, { params, ...options });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error searching at ${endpoint}:`, error);
      throw new Error(error.message || 'Search failed');
    }
  }

  // Pagination utilities
  async getPaginated(endpoint, page = 1, limit = 20, options = {}) {
    try {
      const params = {
        page,
        limit,
        ...options.params
      };

      const response = await apiClient.get(endpoint, { params, ...options });
      return handleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching paginated data from ${endpoint}:`, error);
      throw new Error(error.message || 'Failed to fetch paginated data');
    }
  }

  async getAllPages(endpoint, options = {}) {
    const allData = [];
    let page = 1;
    let hasMore = true;
    const limit = options.limit || 100;

    while (hasMore) {
      try {
        const result = await this.getPaginated(endpoint, page, limit, options);
        
        if (result.data && Array.isArray(result.data)) {
          allData.push(...result.data);
        }
        
        hasMore = result.hasMore || (result.data && result.data.length === limit);
        page++;
        
        // Safety check to prevent infinite loops
        if (page > 1000) {
          console.warn('Reached maximum page limit (1000) while fetching all pages');
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    return {
      data: allData,
      total: allData.length,
      pages: page - 1
    };
  }

  // Request deduplication
  async deduplicatedRequest(key, requestFn) {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // Retry utilities
  async withRetry(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          await this.delay(delay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // URL building utilities
  buildUrl(base, params = {}) {
    const url = new URL(base, window.location.origin);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  // Response transformation utilities
  transformResponse(data, transformer) {
    if (typeof transformer === 'function') {
      return transformer(data);
    }
    return data;
  }

  // Error handling utilities
  handleError(error, context = '') {
    const errorMessage = error.message || 'An unknown error occurred';
    const errorCode = error.status || error.code || 'UNKNOWN_ERROR';
    
    console.error(`API Error${context ? ` in ${context}` : ''}:`, {
      message: errorMessage,
      code: errorCode,
      data: error.data,
      stack: error.stack
    });

    // Return a standardized error object
    return {
      message: errorMessage,
      code: errorCode,
      data: error.data || null,
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return handleApiResponse(response);
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        message: error.message || 'Health check failed'
      };
    }
  }

  // Clear all queues
  clearQueues() {
    this.requestQueue.clear();
    this.retryQueue.clear();
  }

  // Get queue stats
  getQueueStats() {
    return {
      requestQueue: this.requestQueue.size,
      retryQueue: this.retryQueue.size
    };
  }

  // Prefetch utilities
  async prefetchForRoute(route) {
    try {
      const { default: prefetchManager } = await import('./prefetchManager.js');
      return prefetchManager.prefetchForRoute(route, 'manual');
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }

  async prefetchEndpoint(endpoint, options = {}) {
    try {
      const { default: prefetchManager } = await import('./prefetchManager.js');
      return prefetchManager.prefetchEndpoint(endpoint, options);
    } catch (error) {
      console.warn('Endpoint prefetch failed:', error);
    }
  }

  // Cache utilities
  async invalidateCache(pattern) {
    try {
      const { default: cacheManager } = await import('./cacheManager.js');
      return cacheManager.invalidate(pattern);
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  async getCacheStats() {
    try {
      const { default: cacheManager } = await import('./cacheManager.js');
      return cacheManager.getStats();
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return null;
    }
  }

  // Performance utilities
  async getPerformanceStats() {
    try {
      const [
        { default: cacheManager },
        { default: requestDeduplicator },
        { default: prefetchManager },
        { default: requestBatcher }
      ] = await Promise.all([
        import('./cacheManager.js'),
        import('./requestDeduplicator.js'),
        import('./prefetchManager.js'),
        import('./requestBatcher.js')
      ]);

      return {
        cache: cacheManager.getStats(),
        deduplication: requestDeduplicator.getStats(),
        prefetch: prefetchManager.getStats(),
        batching: requestBatcher.getStats(),
        apiUtils: this.getQueueStats()
      };
    } catch (error) {
      console.warn('Failed to get performance stats:', error);
      return null;
    }
  }
}

export default new ApiUtils();