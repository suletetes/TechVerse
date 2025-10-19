import API_BASE_URL, { HTTP_STATUS } from '../config.js';

// Enhanced token management with security improvements
const TOKEN_KEY = 'techverse_token';
const REFRESH_TOKEN_KEY = 'techverse_refresh_token';
const TOKEN_EXPIRY_KEY = 'techverse_token_expiry';
const SESSION_ID_KEY = 'techverse_session_id';
const TOKEN_FINGERPRINT_KEY = 'techverse_token_fp';

// Generate browser fingerprint for token binding
const generateFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  return btoa(fingerprint).substring(0, 32);
};

export const tokenManager = {
  // Get access token with enhanced security checks
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const fingerprint = localStorage.getItem(TOKEN_FINGERPRINT_KEY);
    
    if (!token) return null;
    
    // Verify browser fingerprint to detect token theft
    const currentFingerprint = generateFingerprint();
    if (fingerprint && fingerprint !== currentFingerprint) {
      console.warn('Token fingerprint mismatch, possible token theft detected');
      tokenManager.clearTokens();
      return null;
    }
    
    // Check if token is expired (with 5 minute buffer)
    if (expiry && Date.now() > (parseInt(expiry) - 5 * 60 * 1000)) {
      console.warn('Access token expired, clearing tokens');
      tokenManager.clearTokens();
      return null;
    }
    
    return token;
  },
  
  // Set access token with enhanced security
  setToken: (token, expiresIn = '7d', sessionId = null) => {
    // Validate token format
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      throw new Error('Invalid token format');
    }
    
    try {
      // Basic token validation (decode payload without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.id || !payload.email) {
        throw new Error('Invalid token payload');
      }
    } catch (error) {
      throw new Error('Invalid token structure');
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    
    // Store browser fingerprint for security
    const fingerprint = generateFingerprint();
    localStorage.setItem(TOKEN_FINGERPRINT_KEY, fingerprint);
    
    // Store session ID if provided
    if (sessionId) {
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    // Calculate expiry time
    let expiryTime;
    if (typeof expiresIn === 'string') {
      const match = expiresIn.match(/^(\d+)([dhms])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        const multipliers = { d: 24 * 60 * 60 * 1000, h: 60 * 60 * 1000, m: 60 * 1000, s: 1000 };
        expiryTime = Date.now() + (value * multipliers[unit]);
      } else {
        expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // Default 7 days
      }
    } else {
      expiryTime = Date.now() + (expiresIn * 1000); // Assume seconds
    }
    
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Log token storage for security monitoring
    console.log('Token stored securely', {
      expiresAt: new Date(expiryTime).toISOString(),
      sessionId: sessionId?.substring(0, 8) + '...',
      fingerprint: fingerprint.substring(0, 8) + '...'
    });
  },
  
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },
  
  // Get refresh token
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  
  // Set refresh token with secure storage consideration
  setRefreshToken: (token) => {
    // In production, consider using secure HTTP-only cookies instead
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // For HTTPS, we can use localStorage more safely
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      // For development or HTTP, still use localStorage but log warning
      console.warn('Refresh token stored in localStorage over HTTP - not secure for production');
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },
  
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  
  // Clear all tokens and related data with enhanced cleanup
  clearTokens: () => {
    const keysToRemove = [
      TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      TOKEN_EXPIRY_KEY,
      SESSION_ID_KEY,
      TOKEN_FINGERPRINT_KEY,
      'techverse_user',
      'techverse_permissions',
      'session_expiry',
      'user_preferences'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear any session storage as well
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('techverse_temp_data');
    }
    
    // Dispatch custom event for auth state change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authTokensCleared', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
    
    console.log('All authentication data cleared');
  },
  
  // Check if tokens exist and are valid
  hasValidTokens: () => {
    const token = tokenManager.getToken();
    const refreshToken = tokenManager.getRefreshToken();
    return !!(token && refreshToken);
  },
  
  // Get token expiry time
  getTokenExpiry: () => {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  },
  
  // Check if token will expire soon (within 10 minutes)
  isTokenExpiringSoon: () => {
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return false;
    return Date.now() > (expiry - 10 * 60 * 1000);
  }
};

// Create a custom fetch wrapper with interceptors
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.isRefreshing = false;
    this.failedQueue = [];
    
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
    if (this.isRefreshing) {
      // If already refreshing, queue the request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, endpoint: originalEndpoint, options: originalOptions });
      });
    }
    
    this.isRefreshing = true;
    
    try {
      const refreshToken = tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      console.log('Attempting to refresh access token...');
      
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include' // Include cookies for HTTP-only refresh tokens
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token refresh failed');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data?.tokens?.accessToken) {
        throw new Error('Invalid refresh response format');
      }
      
      // Update tokens with enhanced security
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = data.data.tokens;
      
      tokenManager.setToken(accessToken, expiresIn);
      if (newRefreshToken) {
        tokenManager.setRefreshToken(newRefreshToken);
      }
      
      console.log('Access token refreshed successfully');
      
      // Process failed queue
      this.failedQueue.forEach(({ resolve, endpoint, options }) => {
        resolve(this.request(endpoint, options));
      });
      this.failedQueue = [];
      
      // Retry original request
      return this.request(originalEndpoint, originalOptions);
      
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      
      // Clear tokens and auth state
      tokenManager.clearTokens();
      
      // Process failed queue with error
      this.failedQueue.forEach(({ reject }) => {
        reject(error);
      });
      this.failedQueue = [];
      
      // Dispatch auth error event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authError', { 
          detail: { 
            type: 'TOKEN_REFRESH_FAILED', 
            message: error.message 
          } 
        }));
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?reason=session_expired';
          }
        }, 1000);
      }
      
      throw error;
    } finally {
      this.isRefreshing = false;
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