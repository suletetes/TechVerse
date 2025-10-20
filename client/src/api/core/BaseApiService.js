/**
 * Base API Service class with standardized request/response patterns
 * Implements requirements 2.1, 2.2, 2.3, 4.2
 */

import HttpClient from './HttpClient.js';
import { API_ENDPOINTS } from '../config.js';

class BaseApiService {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '';
    this.endpoints = config.endpoints || {};
    this.defaultOptions = config.defaultOptions || {};
    
    // Create HTTP client instance
    this.httpClient = new HttpClient({
      baseURL: this.baseURL,
      timeout: config.timeout,
      defaultHeaders: config.defaultHeaders,
      ...config.httpClientConfig
    });
    
    // Service-specific configuration
    this.serviceName = config.serviceName || 'BaseService';
    this.cacheEnabled = config.cacheEnabled !== false;
    this.retryEnabled = config.retryEnabled !== false;
  }

  /**
   * Make a standardized API request
   */
  async request(config) {
    const requestConfig = {
      ...this.defaultOptions,
      ...config,
      headers: {
        ...this.defaultOptions.headers,
        ...config.headers
      }
    };

    try {
      const response = await this.httpClient.request(requestConfig);
      return await this.processResponse(response, requestConfig);
    } catch (error) {
      throw await this.processError(error, requestConfig);
    }
  }

  /**
   * Process successful response
   */
  async processResponse(response, config) {
    const contentType = response.headers.get('content-type');
    let data;

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      console.warn('Failed to parse response:', parseError);
      data = null;
    }

    // Return standardized response format
    return {
      success: true,
      data,
      status: response.status,
      statusText: response.statusText,
      headers: this.extractHeaders(response.headers),
      config
    };
  }

  /**
   * Process error response
   */
  async processError(error, config) {
    // Create standardized error object
    const standardizedError = new Error(error.message);
    standardizedError.success = false;
    standardizedError.status = error.status;
    standardizedError.statusText = error.statusText;
    standardizedError.data = error.data;
    standardizedError.code = error.code;
    standardizedError.config = config;
    standardizedError.timestamp = new Date().toISOString();
    standardizedError.service = this.serviceName;

    // Add retry information
    if (this.retryEnabled && this.shouldRetry(error)) {
      standardizedError.canRetry = true;
      standardizedError.retryAfter = this.getRetryDelay(error);
    }

    return standardizedError;
  }

  /**
   * Extract relevant headers from response
   */
  extractHeaders(headers) {
    const relevantHeaders = {};
    const headerNames = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset'
    ];

    headerNames.forEach(name => {
      const value = headers.get(name);
      if (value) {
        relevantHeaders[name] = value;
      }
    });

    return relevantHeaders;
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error) {
    // Retry on network errors and 5xx server errors
    return !error.status || error.status >= 500 || error.code === 'NETWORK_ERROR';
  }

  /**
   * Get retry delay based on error
   */
  getRetryDelay(error) {
    // Check for Retry-After header
    if (error.response && error.response.headers) {
      const retryAfter = error.response.headers.get('retry-after');
      if (retryAfter) {
        return parseInt(retryAfter) * 1000;
      }
    }

    // Default exponential backoff
    return 1000;
  }

  /**
   * Generic CRUD operations
   */

  /**
   * Create a new resource
   */
  async create(endpoint, data, options = {}) {
    return this.request({
      method: 'POST',
      url: endpoint,
      body: data,
      ...options
    });
  }

  /**
   * Read/fetch a resource
   */
  async read(endpoint, params = {}, options = {}) {
    const config = {
      method: 'GET',
      url: endpoint,
      ...options
    };

    // Add query parameters
    if (Object.keys(params).length > 0) {
      const url = new URL(endpoint, 'http://localhost');
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
      config.url = url.pathname + url.search;
    }

    return this.request(config);
  }

  /**
   * Update a resource (full update)
   */
  async update(endpoint, data, options = {}) {
    return this.request({
      method: 'PUT',
      url: endpoint,
      body: data,
      ...options
    });
  }

  /**
   * Partially update a resource
   */
  async patch(endpoint, data, options = {}) {
    return this.request({
      method: 'PATCH',
      url: endpoint,
      body: data,
      ...options
    });
  }

  /**
   * Delete a resource
   */
  async delete(endpoint, options = {}) {
    return this.request({
      method: 'DELETE',
      url: endpoint,
      ...options
    });
  }

  /**
   * Batch operations
   */

  /**
   * Batch create multiple resources
   */
  async batchCreate(endpoint, items, options = {}) {
    return this.request({
      method: 'POST',
      url: `${endpoint}/batch`,
      body: { items },
      ...options
    });
  }

  /**
   * Batch update multiple resources
   */
  async batchUpdate(endpoint, updates, options = {}) {
    return this.request({
      method: 'PUT',
      url: `${endpoint}/batch`,
      body: { updates },
      ...options
    });
  }

  /**
   * Batch delete multiple resources
   */
  async batchDelete(endpoint, ids, options = {}) {
    return this.request({
      method: 'DELETE',
      url: `${endpoint}/batch`,
      body: { ids },
      ...options
    });
  }

  /**
   * Search operations
   */

  /**
   * Search resources
   */
  async search(endpoint, query, filters = {}, options = {}) {
    const params = {
      q: query,
      ...filters
    };

    return this.read(endpoint, params, options);
  }

  /**
   * Paginated fetch
   */
  async getPaginated(endpoint, page = 1, limit = 20, options = {}) {
    const params = {
      page,
      limit,
      ...options.params
    };

    return this.read(endpoint, params, {
      ...options,
      params: undefined // Remove params from options to avoid duplication
    });
  }

  /**
   * Fetch all pages of a paginated resource
   */
  async getAllPages(endpoint, options = {}) {
    const allData = [];
    let page = 1;
    let hasMore = true;
    const limit = options.limit || 100;
    const maxPages = options.maxPages || 100; // Safety limit

    while (hasMore && page <= maxPages) {
      try {
        const result = await this.getPaginated(endpoint, page, limit, options);
        
        if (result.success && result.data) {
          const items = Array.isArray(result.data) ? result.data : result.data.items || [];
          allData.push(...items);
          
          // Check if there are more pages
          hasMore = result.data.hasMore || 
                   result.data.pagination?.hasNext || 
                   items.length === limit;
        } else {
          hasMore = false;
        }
        
        page++;
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }

    return {
      success: true,
      data: allData,
      total: allData.length,
      pages: page - 1
    };
  }

  /**
   * File upload operations
   */

  /**
   * Upload a single file
   */
  async uploadFile(endpoint, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional fields
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request({
      method: 'POST',
      url: endpoint,
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        ...options.headers
      },
      ...options,
      fields: undefined // Remove fields from options
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(endpoint, files, options = {}) {
    const formData = new FormData();

    // Add files
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    // Add additional fields
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.request({
      method: 'POST',
      url: endpoint,
      body: formData,
      headers: {
        ...options.headers
      },
      ...options,
      fields: undefined
    });
  }

  /**
   * Utility methods
   */

  /**
   * Build endpoint URL with parameters
   */
  buildEndpoint(template, params = {}) {
    let endpoint = template;
    
    // Replace path parameters
    Object.entries(params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, encodeURIComponent(value));
      endpoint = endpoint.replace(`{${key}}`, encodeURIComponent(value));
    });

    return endpoint;
  }

  /**
   * Get endpoint from configuration
   */
  getEndpoint(name, params = {}) {
    const template = this.endpoints[name];
    if (!template) {
      throw new Error(`Endpoint '${name}' not found in service configuration`);
    }

    if (typeof template === 'function') {
      return template(params);
    }

    return this.buildEndpoint(template, params);
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      const response = await this.request({
        method: 'GET',
        url: '/health',
        timeout: 5000
      });
      
      return {
        service: this.serviceName,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        response
      };
    } catch (error) {
      return {
        service: this.serviceName,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      serviceName: this.serviceName,
      httpClient: this.httpClient.getStats(),
      cacheEnabled: this.cacheEnabled,
      retryEnabled: this.retryEnabled
    };
  }

  /**
   * Configure service options
   */
  configure(options) {
    Object.assign(this.defaultOptions, options);
  }

  /**
   * Add custom interceptor to the HTTP client
   */
  addRequestInterceptor(fulfilled, rejected) {
    return this.httpClient.addRequestInterceptor(fulfilled, rejected);
  }

  /**
   * Add response interceptor to the HTTP client
   */
  addResponseInterceptor(fulfilled, rejected) {
    return this.httpClient.addResponseInterceptor(fulfilled, rejected);
  }
}

export default BaseApiService;