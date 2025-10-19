import API_BASE_URL, { HTTP_STATUS } from '../config.js';
import { tokenManager } from '../../utils/tokenManager.js';

// Create a custom fetch wrapper with interceptors
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    
    // Initialize services (lazy loading to avoid circular dependencies)
    this.requestDeduplicator = null;
    this.retryManager = null;
  }

  // Lazy load services to avoid circular dependencies
  async getServices() {
    if (!this.requestDeduplicator || !this.retryManager) {
      const [
        { default: requestDeduplicator },
        { default: retryManager }
      ] = await Promise.all([
        import('../services/requestDeduplicator.js'),
        import('../services/retryManager.js')
      ]);
      
      this.requestDeduplicator = requestDeduplicator;
      this.retryManager = retryManager;
    }
    
    return {
      requestDeduplicator: this.requestDeduplicator,
      retryManager: this.retryManager
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = tokenManager.getToken();
    const method = options.method || 'GET';
    
    // Generate request ID for tracking
    const requestId = this.generateRequestId();
    
    // Get services
    const { requestDeduplicator, retryManager } = await this.getServices();
    
    // Create request context
    const context = {
      url,
      endpoint,
      method,
      requestId,
      hasAuth: !!token
    };
    
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
      // Default headers with enhanced configuration
      const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Authorization header attached:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.log('🔓 No token available, request sent without Authorization header');
      }
      
      // Special handling for FormData (file uploads)
      if (options.body instanceof FormData) {
        delete headers['Content-Type']; // Let browser set it for FormData
      }
      
      const config = {
        ...options,
        headers,
        timeout: options.timeout || 30000
      };
      
      // Log request details for debugging
      console.log('📤 API Request:', {
        method,
        url: endpoint,
        hasAuth: !!token,
        requestId
      });
      
      const response = await this.fetchWithTimeout(url, config);
      
      // Log response details
      console.log('📥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: endpoint,
        requestId
      });
      
      // Handle token refresh for 401 errors (but not for auth endpoints)
      if (response.status === HTTP_STATUS.UNAUTHORIZED && token && !endpoint.includes('/auth/')) {
        console.log('🔄 Token expired, attempting refresh...');
        return this.handleTokenRefresh(endpoint, options);
      }
      
      return response;
    };
    
    // Execute with retry logic and deduplication
    const requestPromise = retryManager.executeWithRetry(makeRequest, context, {
      maxRetries: options.maxRetries,
      retryStrategy: options.retryStrategy
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

  // Handle rate limiting (still needed for immediate rate limit responses)
  async handleRateLimit(endpoint, options, response) {
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds
    
    console.log('⏳ Rate limited, waiting:', { delay, retryAfter });
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.request(endpoint, options);
  }
  
  async handleTokenRefresh(originalEndpoint, originalOptions) {
    // Import token refresh manager dynamically to avoid circular dependencies
    const { tokenRefreshManager } = await import('../../utils/tokenRefreshManager.js');
    
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
export const apiClient = new ApiClient(API_BASE_URL);

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