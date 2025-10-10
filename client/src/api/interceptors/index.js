import API_BASE_URL, { HTTP_STATUS } from '../config.js';

// Token management
const TOKEN_KEY = 'techverse_token';
const REFRESH_TOKEN_KEY = 'techverse_refresh_token';

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
  
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// Create a custom fetch wrapper with interceptors
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = tokenManager.getToken();
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add auth header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers
    };
    
    try {
      const response = await fetch(url, config);
      
      // Handle token refresh for 401 errors
      if (response.status === HTTP_STATUS.UNAUTHORIZED && token) {
        return this.handleTokenRefresh(endpoint, options);
      }
      
      return response;
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
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
      
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data = await response.json();
      
      // Update tokens
      tokenManager.setToken(data.token);
      if (data.refreshToken) {
        tokenManager.setRefreshToken(data.refreshToken);
      }
      
      // Process failed queue
      this.failedQueue.forEach(({ resolve, endpoint, options }) => {
        resolve(this.request(endpoint, options));
      });
      this.failedQueue = [];
      
      // Retry original request
      return this.request(originalEndpoint, originalOptions);
      
    } catch (error) {
      // Clear tokens and redirect to login
      tokenManager.clearTokens();
      
      // Process failed queue with error
      this.failedQueue.forEach(({ reject }) => {
        reject(error);
      });
      this.failedQueue = [];
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
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