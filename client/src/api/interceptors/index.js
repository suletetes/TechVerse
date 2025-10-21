import { FORMATTED_API_BASE_URL, HTTP_STATUS, API_CONFIG, validateEndpoint } from '../config.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { tokenRefreshManager } from '../../utils/tokenRefreshManager.js';

// Create a custom fetch wrapper with interceptors
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    
    // Initialize services (lazy loading to avoid circular dependencies)
    this.requestDeduplicator = null;
    this.retryManager = null;
    this.intelligentCache = null;
    
    // Request interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    // Configuration
    this.config = {
      timeout: API_CONFIG.TIMEOUT,
      retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
      retryDelay: API_CONFIG.RETRY_DELAY,
      enableLogging: API_CONFIG.ENABLE_LOGGING,
      debugMode: API_CONFIG.DEBUG_MODE
    };
    
    // Initialize default interceptors
    this.initializeDefaultInterceptors();
  }
  
  /**
   * Initialize default request and response interceptors
   */
  initializeDefaultInterceptors() {
    // Request interceptor for authentication
    this.addRequestInterceptor(async (config) => {
      const token = tokenManager.getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        
        if (this.config.debugMode) {
          console.log('🔐 Authorization header attached:', `Bearer ${token.substring(0, 20)}...`);
        }
      }
      return config;
    });
    
    // Request interceptor for common headers
    this.addRequestInterceptor((config) => {
      config.headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        ...config.headers
      };
      
      // Add request ID for tracking
      config.headers['X-Request-ID'] = this.generateRequestId();
      
      return config;
    });
    
    // Response interceptor for token refresh and enhanced error handling
    this.addResponseInterceptor(
      (response) => response, // Success handler
      async (error) => { // Error handler
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized responses
        if (error.status === HTTP_STATUS.UNAUTHORIZED && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/auth/')) {
          
          originalRequest._retry = true;
          
          try {
            // Check if we're in security cooldown
            if (tokenManager.isInSecurityCooldown && tokenManager.isInSecurityCooldown()) {
              console.warn('Authentication blocked due to security cooldown');
              this.handleAuthenticationFailure('security_cooldown');
              throw error;
            }
            
            await tokenRefreshManager.refreshToken();
            
            // Retry original request with new token
            const newToken = tokenManager.getToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.request(originalRequest.endpoint, originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.handleAuthenticationFailure('token_refresh_failed', refreshError);
            throw error;
          }
        }
        
        // Handle 403 Forbidden responses (insufficient permissions)
        if (error.status === HTTP_STATUS.FORBIDDEN) {
          this.handleAuthorizationFailure(error);
        }
        
        throw error;
      }
    );
  }
  
  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  
  /**
   * Add response interceptor
   */
  addResponseInterceptor(successHandler, errorHandler) {
    this.responseInterceptors.push({ successHandler, errorHandler });
  }

  // Lazy load services to avoid circular dependencies
  async getServices() {
    if (!this.requestDeduplicator || !this.retryManager || !this.intelligentCache) {
      const [
        { default: requestDeduplicator },
        { default: retryManager },
        { default: intelligentCache }
      ] = await Promise.all([
        import('../services/requestDeduplicator.js'),
        import('../services/retryManager.js'),
        import('../services/intelligentCache.js')
      ]);
      
      this.requestDeduplicator = requestDeduplicator;
      this.retryManager = retryManager;
      this.intelligentCache = intelligentCache;
    }
    
    return {
      requestDeduplicator: this.requestDeduplicator,
      retryManager: this.retryManager,
      intelligentCache: this.intelligentCache
    };
  }

  async request(endpoint, options = {}) {
    // Validate endpoint
    validateEndpoint(endpoint);
    
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Create request configuration
    let requestConfig = {
      endpoint,
      url,
      method,
      headers: {},
      timeout: options.timeout || this.config.timeout,
      ...options
    };
    
    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      try {
        requestConfig = await interceptor(requestConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
        throw error;
      }
    }
    
    // Start performance tracking
    const startTime = performance.now();
    
    // Get services
    const { requestDeduplicator, retryManager, intelligentCache } = await this.getServices();
    
    // Create request context
    const context = {
      url,
      endpoint,
      method,
      requestId: requestConfig.headers['X-Request-ID'],
      hasAuth: !!requestConfig.headers.Authorization,
      config: requestConfig
    };
    
    // Check cache first for GET requests
    if (method === 'GET') {
      const cacheKey = intelligentCache.normalizeKey(`${method}:${url}:${JSON.stringify(options.params || {})}`);
      const cachedData = intelligentCache.getFromCache(cacheKey);
      
      if (cachedData) {
        console.log('📦 Returning cached data:', {
          method,
          url: endpoint,
          cacheKey: cacheKey.substring(0, 50) + '...'
        });
        
        // Record cached request performance
        const endTime = performance.now();
        try {
          const { default: performanceMonitor } = await import('../services/performanceMonitor.js');
          performanceMonitor.recordApiCall(endpoint, method, startTime, endTime, {
            status: 200,
            cached: true,
            retried: false,
            transferSize: 0
          });
        } catch (error) {
          console.warn('Performance monitoring failed:', error);
        }
        
        return Promise.resolve(cachedData);
      }
    }
    
    // Check for request deduplication
    const dedupeOptions = {
      dedupe: options.dedupe !== false, // Default to true
      strategy: options.dedupeStrategy || 'default',
      forceNew: options.forceNew || false
    };
    
    if (requestDeduplicator.shouldDeduplicate(method, url, dedupeOptions)) {
      const fingerprint = requestDeduplicator.generateFingerprint(
        method,
        url,
        options.body,
        options.headers
      );
      
      const existingRequest = requestDeduplicator.getPendingRequest(fingerprint);
      if (existingRequest) {
        console.log('🔄 Returning deduplicated request:', {
          method,
          url: endpoint,
          fingerprint: fingerprint.substring(0, 12) + '...'
        });
        return existingRequest;
      }
    }
    
    // Create the actual request function
    const makeRequest = async () => {
      // Special handling for FormData (file uploads)
      if (requestConfig.body instanceof FormData) {
        delete requestConfig.headers['Content-Type']; // Let browser set it for FormData
      }
      
      // Log request details for debugging
      if (this.config.enableLogging) {
        console.log('📤 API Request:', {
          method,
          url: endpoint,
          hasAuth: !!requestConfig.headers.Authorization,
          requestId: context.requestId
        });
      }
      
      const response = await this.fetchWithTimeout(url, requestConfig);
      
      // Log response details
      if (this.config.enableLogging) {
        console.log('📥 API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: endpoint,
          requestId: context.requestId
        });
      }
      
      return response;
    };
    
    // Execute with retry logic and deduplication
    const requestPromise = retryManager.executeWithRetry(makeRequest, context, {
      maxRetries: requestConfig.maxRetries || this.config.retryAttempts,
      retryStrategy: requestConfig.retryStrategy
    }).then(async (response) => {
      // Record performance metrics
      const endTime = performance.now();
      try {
        const { default: performanceMonitor } = await import('../services/performanceMonitor.js');
        performanceMonitor.recordApiCall(endpoint, method, startTime, endTime, {
          status: response.status,
          cached: false,
          retried: context.retryCount > 0,
          transferSize: response.headers.get('content-length') || 0
        });
      } catch (error) {
        console.warn('Performance monitoring failed:', error);
      }
      
      // Handle the response and cache if appropriate
      let responseData = await handleApiResponse(response, context);
      
      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        try {
          if (interceptor.successHandler) {
            responseData = await interceptor.successHandler(responseData, response, context);
          }
        } catch (error) {
          console.error('Response interceptor error:', error);
        }
      }
      
      // Cache successful GET responses
      if (method === 'GET' && response.ok) {
        const cacheKey = intelligentCache.normalizeKey(`${method}:${url}:${JSON.stringify(requestConfig.params || {})}`);
        intelligentCache.set(cacheKey, responseData, { url: endpoint });
      }
      
      // Invalidate related cache entries for write operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        this.invalidateRelatedCache(endpoint, intelligentCache);
      }
      
      return responseData;
    }).catch(async (error) => {
      // Record failed request performance
      const endTime = performance.now();
      try {
        const { default: performanceMonitor } = await import('../services/performanceMonitor.js');
        performanceMonitor.recordApiCall(endpoint, method, startTime, endTime, {
          status: error.status || 0,
          cached: false,
          retried: context.retryCount > 0,
          error: true
        });
      } catch (perfError) {
        console.warn('Performance monitoring failed:', perfError);
      }
      
      // Apply error response interceptors
      let finalError = error;
      for (const interceptor of this.responseInterceptors) {
        try {
          if (interceptor.errorHandler) {
            finalError = await interceptor.errorHandler(finalError, context);
          }
        } catch (interceptorError) {
          console.error('Error response interceptor failed:', interceptorError);
          // Continue with original error
        }
      }
      
      throw finalError;
    });
    
    // Add to deduplication queue if applicable
    if (requestDeduplicator.shouldDeduplicate(method, url, dedupeOptions)) {
      const fingerprint = requestDeduplicator.generateFingerprint(
        method,
        url,
        options.body,
        options.headers
      );
      
      requestDeduplicator.addPendingRequest(fingerprint, requestPromise, context);
    }
    
    return requestPromise;
  }

  // Fetch with timeout support
  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Invalidate related cache entries based on endpoint
  invalidateRelatedCache(endpoint, intelligentCache) {
    const invalidationRules = {
      '/products': [/\/products/, /\/categories/, /\/search/, /\/dashboard/],
      '/categories': [/\/categories/, /\/products/, /\/dashboard/],
      '/profile': [/\/profile/, /\/dashboard/],
      '/orders': [/\/orders/, /\/dashboard/, /\/analytics/],
      '/auth': [/\/profile/, /\/dashboard/] // Clear user-specific data on auth changes
    };

    // Find matching invalidation rules
    for (const [pattern, cachePatterns] of Object.entries(invalidationRules)) {
      if (endpoint.includes(pattern)) {
        cachePatterns.forEach(cachePattern => {
          intelligentCache.invalidate(cachePattern);
        });
        break;
      }
    }
  }

  // Handle rate limiting (still needed for immediate rate limit responses)
  async handleRateLimit(endpoint, options, response) {
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds
    
    console.log('⏳ Rate limited, waiting:', { delay, retryAfter });
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.request(endpoint, options);
  }
  
  /**
   * Handle token refresh (now handled by response interceptors)
   * @deprecated Use response interceptors instead
   */
  async handleTokenRefresh(originalEndpoint, originalOptions) {
    try {
      // Use the enhanced token refresh manager
      await tokenRefreshManager.refreshToken();
      
      // Retry original request with new token
      return this.request(originalEndpoint, originalOptions);
      
    } catch (error) {
      // If refresh fails, add request to queue for potential retry
      if (error.message !== 'No refresh token available') {
        return tokenRefreshManager.addToFailedQueue(() => 
          this.request(originalEndpoint, originalOptions)
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Handle authentication failures (401 errors)
   */
  handleAuthenticationFailure(reason, error = null) {
    console.warn('Authentication failure detected:', { reason, error: error?.message });
    
    // Dispatch authentication error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authError', {
        detail: {
          type: 'AUTHENTICATION_FAILED',
          reason,
          message: error?.message || 'Authentication required',
          status: 401,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Redirect to login with appropriate reason
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      
      // Don't redirect if already on login page
      if (currentPath !== '/login') {
        const redirectUrl = `/login?reason=${reason}&returnUrl=${encodeURIComponent(currentPath)}`;
        
        // For admin routes, show additional context
        if (isAdminRoute) {
          const adminRedirectUrl = `/login?reason=${reason}&admin=true&returnUrl=${encodeURIComponent(currentPath)}`;
          setTimeout(() => {
            window.location.href = adminRedirectUrl;
          }, 1000);
        } else {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        }
      }
    }
  }
  
  /**
   * Handle authorization failures (403 errors)
   */
  handleAuthorizationFailure(error) {
    console.warn('Authorization failure detected:', error);
    
    // Dispatch authorization error event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authError', {
        detail: {
          type: 'AUTHORIZATION_FAILED',
          message: error.data?.message || 'Insufficient permissions',
          status: 403,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Redirect to unauthorized page or appropriate location
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin');
      
      if (isAdminRoute) {
        // For admin routes, redirect to main admin page or login
        setTimeout(() => {
          window.location.href = '/unauthorized?type=admin';
        }, 1000);
      } else {
        // For user routes, redirect to unauthorized page
        setTimeout(() => {
          window.location.href = '/unauthorized';
        }, 1000);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  // HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
  
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
  
  // File upload method
  async upload(endpoint, formData, options = {}) {
    const headers = { ...options.headers };
    delete headers['Content-Type']; // Let browser set it for FormData
    
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: formData
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(FORMATTED_API_BASE_URL);

// Enhanced response handler utility with comprehensive error translation
export const handleApiResponse = async (response, context = {}) => {
  const contentType = response.headers.get('content-type');
  
  let data;
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (parseError) {
    // Handle cases where response body is not valid JSON/text
    data = { message: 'Invalid response format', originalError: parseError.message };
  }
  
  if (!response.ok) {
    // Import error handler dynamically to avoid circular dependencies
    const { default: errorHandler } = await import('../services/errorHandler.js');
    
    // Create standardized error object
    const error = new Error('API request failed');
    error.status = response.status;
    error.data = data;
    error.code = data?.code || `HTTP_${response.status}`;
    error.url = response.url;
    
    // Get enhanced error information
    const enhancedError = errorHandler.translateError(error, {
      url: response.url,
      method: context.method || 'GET',
      requestId: context.requestId
    });
    
    // Create enhanced error object that maintains Error prototype
    const finalError = new Error(enhancedError.message);
    finalError.status = response.status;
    finalError.data = data;
    finalError.code = enhancedError.code;
    finalError.type = enhancedError.type;
    finalError.canRetry = enhancedError.canRetry;
    finalError.actions = enhancedError.actions;
    finalError.timestamp = enhancedError.timestamp;
    finalError.requestId = enhancedError.requestId;
    finalError.url = response.url;
    
    throw finalError;
  }
  
  return data;
};

// Legacy server error translation utility (kept for backward compatibility)
// Note: This is now handled by the ErrorHandler service
const translateServerError = (status, data) => {
  // Extract message from various possible response formats
  const serverMessage = data?.message || data?.error || data?.details || data;
  
  // Provide user-friendly error messages based on status codes
  switch (status) {
    case 400:
      return typeof serverMessage === 'string' ? serverMessage : 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return typeof serverMessage === 'string' ? serverMessage : 'Conflict. The resource already exists.';
    case 422:
      return typeof serverMessage === 'string' ? serverMessage : 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Server is temporarily unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return typeof serverMessage === 'string' ? serverMessage : `Server error (${status}). Please try again.`;
  }
};

export default apiClient;