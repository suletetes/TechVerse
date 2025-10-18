import API_BASE_URL, { HTTP_STATUS } from '../config.js';

// Enhanced token management with security improvements
const TOKEN_KEY = 'techverse_token';
const REFRESH_TOKEN_KEY = 'techverse_refresh_token';
const TOKEN_EXPIRY_KEY = 'techverse_token_expiry';

export const tokenManager = {
  // Get access token with expiry check
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token) return null;
    
    // Check if token is expired (with 5 minute buffer)
    if (expiry && Date.now() > (parseInt(expiry) - 5 * 60 * 1000)) {
      console.warn('Access token expired, clearing tokens');
      tokenManager.clearTokens();
      return null;
    }
    
    return token;
  },
  
  // Set access token with expiry
  setToken: (token, expiresIn = '7d') => {
    localStorage.setItem(TOKEN_KEY, token);
    
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
  
  // Clear all tokens and related data
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Clear any other auth-related data
    localStorage.removeItem('techverse_user');
    
    // Dispatch custom event for auth state change
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authTokensCleared'));
    }
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
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = tokenManager.getToken();
    const requestId = `${options.method || 'GET'}_${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };
    
    // Add auth header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    headers['X-Request-ID'] = this.generateRequestId();
    
    const config = {
      ...options,
      headers,
      timeout: options.timeout || 30000
    };
    
    try {
      const response = await this.fetchWithTimeout(url, config);
      
      // Handle token refresh for 401 errors
      if (response.status === HTTP_STATUS.UNAUTHORIZED && token && !endpoint.includes('/auth/')) {
        return this.handleTokenRefresh(endpoint, options);
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        return this.handleRateLimit(endpoint, options, response);
      }
      
      // Handle server errors with retry
      if (response.status >= 500 && this.shouldRetry(requestId)) {
        return this.handleRetry(endpoint, options, requestId);
      }
      
      // Reset retry count on success
      this.retryAttempts.delete(requestId);
      
      return response;
    } catch (error) {
      // Handle network errors with retry
      if (this.isNetworkError(error) && this.shouldRetry(requestId)) {
        return this.handleRetry(endpoint, options, requestId);
      }
      
      throw new Error(`Network error: ${error.message}`);
    }
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

  // Check if error is network-related
  isNetworkError(error) {
    return error.message.includes('Network') || 
           error.message.includes('timeout') || 
           error.message.includes('Failed to fetch');
  }

  // Check if request should be retried
  shouldRetry(requestId) {
    const attempts = this.retryAttempts.get(requestId) || 0;
    return attempts < this.maxRetries;
  }

  // Handle retry logic
  async handleRetry(endpoint, options, requestId) {
    const attempts = this.retryAttempts.get(requestId) || 0;
    this.retryAttempts.set(requestId, attempts + 1);
    
    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, attempts);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.request(endpoint, options);
  }

  // Handle rate limiting
  async handleRateLimit(endpoint, options, response) {
    const retryAfter = response.headers.get('Retry-After');
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds
    
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

// Response handler utility
export const handleApiResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  if (!response.ok) {
    const error = new Error(data.message || `HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

export default apiClient;