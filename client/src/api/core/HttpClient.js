/**
 * Standardized HTTP Client with interceptors, retry logic, and error handling
 * Implements requirements 2.1, 2.4, 6.1, 6.5
 */

import { tokenManager } from '../../utils/tokenManager.js';
import { HTTP_STATUS, REQUEST_TIMEOUT } from '../config.js';

class HttpClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || REQUEST_TIMEOUT || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...config.defaultHeaders
    };
    
    // Interceptor arrays
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Request tracking
    this.pendingRequests = new Map();
    this.requestCounter = 0;
    
    // Initialize default interceptors
    this.initializeDefaultInterceptors();
  }

  /**
   * Initialize default interceptors for auth, logging, and error handling
   */
  initializeDefaultInterceptors() {
    // Auth interceptor - adds authorization header
    this.addRequestInterceptor(async (config) => {
      const token = tokenManager.getToken();
      if (token && !config.skipAuth) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return config;
    });

    // CSRF interceptor - adds CSRF token for state-changing operations
    this.addRequestInterceptor(async (config) => {
      // Only add CSRF token for state-changing methods
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
        // Try to get CSRF token from cookie first
        let csrfToken = this.getCsrfTokenFromCookie();
        
        // If no token in cookie, try to fetch one
        if (!csrfToken) {
          csrfToken = await this.fetchCsrfToken();
        }
        
        if (csrfToken) {
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': csrfToken
          };
        }
      }
      return config;
    });

    // Request ID interceptor - adds unique request ID for tracking
    this.addRequestInterceptor((config) => {
      const requestId = this.generateRequestId();
      config.headers = {
        ...config.headers,
        'X-Request-ID': requestId
      };
      config.requestId = requestId;
      return config;
    });

    // Logging interceptor - logs requests in debug mode
    this.addRequestInterceptor((config) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 HTTP Request:', {
          method: config.method,
          url: config.url,
          requestId: config.requestId,
          hasAuth: !!config.headers.Authorization
        });
      }
      return config;
    });

    // Response logging interceptor
    this.addResponseInterceptor(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📥 HTTP Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            requestId: response.config?.requestId
          });
        }
        return response;
      },
      async (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ HTTP Error:', {
            status: error.status,
            message: error.message,
            url: error.config?.url,
            requestId: error.config?.requestId
          });
        }

        // Handle CSRF token errors with retry
        if (error.status === 403 && 
            error.message?.includes('CSRF token') &&
            !error.config?._csrfRetried) {
          
          console.log('🔄 CSRF token invalid, fetching new token and retrying...');
          
          // Fetch new CSRF token
          const newToken = await this.fetchCsrfToken();
          
          if (newToken && error.config) {
            // Mark as retried to prevent infinite loops
            error.config._csrfRetried = true;
            
            // Update headers with new token
            error.config.headers = {
              ...error.config.headers,
              'X-CSRF-Token': newToken
            };
            
            // Retry the request
            return this.request(error.config);
          }
        }

        return Promise.reject(error);
      }
    );

    // Token refresh interceptor - handles 401 errors
    this.addResponseInterceptor(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.status === HTTP_STATUS.UNAUTHORIZED && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/auth/')) {
          
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            // Retry original request with new token
            return this.request(originalRequest);
          } catch (refreshError) {
            // If refresh fails, redirect to login or handle appropriately
            this.handleAuthFailure(refreshError);
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(fulfilled, rejected) {
    this.requestInterceptors.push({ fulfilled, rejected });
    return this.requestInterceptors.length - 1;
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(fulfilled, rejected) {
    this.responseInterceptors.push({ fulfilled, rejected });
    return this.responseInterceptors.length - 1;
  }

  /**
   * Remove interceptor by index
   */
  removeInterceptor(type, index) {
    if (type === 'request' && this.requestInterceptors[index]) {
      this.requestInterceptors.splice(index, 1);
    } else if (type === 'response' && this.responseInterceptors[index]) {
      this.responseInterceptors.splice(index, 1);
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${++this.requestCounter}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get CSRF token from cookie
   */
  getCsrfTokenFromCookie() {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf-token') {
          return decodeURIComponent(value);
        }
      }
    }
    return null;
  }

  /**
   * Fetch CSRF token from server
   */
  async fetchCsrfToken() {
    try {
      const response = await fetch(`${this.baseURL}/security/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
    return null;
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(config) {
    let processedConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      try {
        if (interceptor.fulfilled) {
          processedConfig = await interceptor.fulfilled(processedConfig);
        }
      } catch (error) {
        if (interceptor.rejected) {
          processedConfig = await interceptor.rejected(error);
        } else {
          throw error;
        }
      }
    }
    
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response) {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.fulfilled) {
          processedResponse = await interceptor.fulfilled(processedResponse);
        }
      } catch (error) {
        if (interceptor.rejected) {
          processedResponse = await interceptor.rejected(error);
        } else {
          throw error;
        }
      }
    }
    
    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  async applyErrorInterceptors(error) {
    let processedError = error;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        if (interceptor.rejected) {
          processedError = await interceptor.rejected(processedError);
        }
      } catch (interceptorError) {
        processedError = interceptorError;
      }
    }
    
    return processedError;
  }

  /**
   * Create fetch request with timeout and abort controller
   */
  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeout || this.timeout);

    try {
      const fetchConfig = {
        ...config,
        signal: controller.signal
      };
      
      // Debug: Log what's actually being sent to fetch
      console.log('🔍 FETCH DEBUG:', {
        url,
        method: fetchConfig.method,
        headers: fetchConfig.headers,
        body: fetchConfig.body,
        bodyType: typeof fetchConfig.body
      });
      
      const response = await fetch(url, fetchConfig);
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${config.timeout || this.timeout}ms`);
        timeoutError.code = 'TIMEOUT';
        timeoutError.config = config;
        throw timeoutError;
      }
      
      // Network error
      const networkError = new Error(`Network error: ${error.message}`);
      networkError.code = 'NETWORK_ERROR';
      networkError.config = config;
      networkError.originalError = error;
      throw networkError;
    }
  }

  /**
   * Main request method with retry logic and deduplication
   */
  async request(config) {
    // Normalize config
    const normalizedConfig = {
      method: 'GET',
      headers: { ...this.defaultHeaders },
      timeout: this.timeout,
      ...config,
      url: this.buildUrl(config.url || config.endpoint)
    };

    // Apply request interceptors
    const processedConfig = await this.applyRequestInterceptors(normalizedConfig);
    
    // Check for request deduplication
    if (this.shouldDeduplicate(processedConfig)) {
      const dedupeKey = this.generateDedupeKey(processedConfig);
      const existingRequest = this.pendingRequests.get(dedupeKey);
      
      if (existingRequest) {
        console.log('🔄 Returning deduplicated request:', dedupeKey);
        return existingRequest;
      }
    }

    // Create request promise with retry logic
    const requestPromise = this.executeWithRetry(processedConfig);
    
    // Store for deduplication
    if (this.shouldDeduplicate(processedConfig)) {
      const dedupeKey = this.generateDedupeKey(processedConfig);
      this.pendingRequests.set(dedupeKey, requestPromise);
      
      // Clean up after request completes
      requestPromise.finally(() => {
        this.pendingRequests.delete(dedupeKey);
      });
    }

    return requestPromise;
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry(config) {
    const maxRetries = config.maxRetries || 3;
    const retryDelay = config.retryDelay || 1000;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest(config);
        // Parse response body once to avoid "body stream already read" errors
        const parsedResponse = await this.parseResponseBody(response);
        return await this.applyResponseInterceptors(parsedResponse);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 408, 429
        if (error.status >= 400 && error.status < 500 && 
            error.status !== 408 && error.status !== 429) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`⏳ Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        await this.delay(delay);
      }
    }

    // Apply error interceptors before throwing
    const processedError = await this.applyErrorInterceptors(lastError);
    throw processedError;
  }

  /**
   * Execute the actual HTTP request
   */
  async executeRequest(config) {
    const { url, method, headers, body, timeout } = config;
    
    // Prepare fetch options
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: { ...headers }, // Create mutable copy of headers
      timeout
    };

    // Add body for non-GET requests
    if (body && method.toUpperCase() !== 'GET') {
      if (body instanceof FormData) {
        fetchOptions.body = body;
        // Remove Content-Type header for FormData (let browser set it)
        delete fetchOptions.headers['Content-Type'];
      } else if (typeof body === 'object') {
        fetchOptions.body = JSON.stringify(body);
        // Ensure Content-Type is set for JSON
        if (!fetchOptions.headers['Content-Type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      } else {
        fetchOptions.body = body;
      }
    }

    const response = await this.fetchWithTimeout(url, fetchOptions);
    
    // Attach config to response for interceptors
    response.config = config;
    
    // Handle non-ok responses
    if (!response.ok) {
      const error = await this.createErrorFromResponse(response, config);
      throw error;
    }

    return response;
  }

  /**
   * Parse response body once to avoid "body stream already read" errors
   */
  async parseResponseBody(response) {
    const contentType = response.headers.get('content-type');
    let data;

    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      console.warn('Failed to parse response body:', parseError);
      data = null;
    }

    // Create a new response-like object with parsed data
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url,
      redirected: response.redirected,
      type: response.type,
      config: response.config,
      data,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
      clone: () => ({ 
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.url,
        redirected: response.redirected,
        type: response.type,
        config: response.config,
        data 
      })
    };
  }

  /**
   * Create standardized error from response
   */
  async createErrorFromResponse(response, config) {
    let errorData;
    
    try {
      // If response already has parsed data, use it
      if (response.data !== undefined) {
        errorData = response.data;
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      }
    } catch (parseError) {
      errorData = { message: 'Invalid response format' };
    }

    const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;
    error.config = config;
    error.response = response;
    error.code = errorData.code || `HTTP_${response.status}`;
    
    return error;
  }

  /**
   * Check if request should be deduplicated
   */
  shouldDeduplicate(config) {
    // Only deduplicate GET requests by default
    return config.method.toUpperCase() === 'GET' && 
           config.dedupe !== false && 
           !config.forceNew;
  }

  /**
   * Generate deduplication key
   */
  generateDedupeKey(config) {
    const { method, url, body, headers } = config;
    const keyData = {
      method: method.toUpperCase(),
      url,
      body: body ? JSON.stringify(body) : null,
      auth: headers.Authorization || null
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Build full URL
   */
  buildUrl(endpoint) {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${baseUrl}${path}`;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle token refresh
   */
  async refreshToken() {
    try {
      const { tokenRefreshManager } = await import('../../utils/tokenRefreshManager.js');
      await tokenRefreshManager.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Handle authentication failure
   */
  handleAuthFailure(error) {
    // Clear tokens
    tokenManager.clearTokens();
    
    // Emit auth failure event for app to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:failure', { 
        detail: { error } 
      }));
    }
  }

  /**
   * HTTP method shortcuts
   */
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, body: data });
  }

  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, body: data });
  }

  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, body: data });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  /**
   * File upload method
   */
  async upload(url, formData, config = {}) {
    return this.request({
      ...config,
      method: 'POST',
      url,
      body: formData,
      headers: {
        ...config.headers,
        // Don't set Content-Type for FormData
      }
    });
  }

  /**
   * Get pending requests count
   */
  getPendingRequestsCount() {
    return this.pendingRequests.size;
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.pendingRequests.clear();
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      requestInterceptors: this.requestInterceptors.length,
      responseInterceptors: this.responseInterceptors.length,
      requestCounter: this.requestCounter
    };
  }
}

export default HttpClient;