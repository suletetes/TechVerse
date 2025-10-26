import axios from 'axios';
import axiosRetry from 'axios-retry';
import { useAuthStore } from '../stores/authStore.js';
import { useNotifications } from '../stores/uiStore.js';

/**
 * Enhanced Axios API Client
 * Replaces fetch-based BaseApiService with comprehensive error handling,
 * automatic retries, request/response transformation, and authentication
 */

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for session-based auth
  withCredentials: true,
});

// Configure automatic retries
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
  },
  retryCondition: (error) => {
    // Retry on network errors and 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status >= 500 && error.response?.status < 600);
  },
  onRetry: (retryCount, error, requestConfig) => {
    // Retrying request silently
      error: error.message,
    });
  },
});

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    const authStore = useAuthStore.getState();
    const authHeader = authStore.getAuthHeader();
    
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }
    
    // Add request ID for tracking
    config.metadata = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
    };
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    const { config } = response;
    const duration = Date.now() - config.metadata.startTime;
    
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response [${config.metadata.requestId}]:`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }
    
    // Track slow requests
    // Slow API requests monitored silently
        duration: `${duration}ms`,
      });
    }
    
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error [${config?.metadata?.requestId}]:`, {
        status: response?.status,
        duration: `${duration}ms`,
        message: error.message,
        data: response?.data,
      });
    }
    
    // Handle specific error cases
    if (response?.status === 401) {
      // Unauthorized - try to refresh token
      const authStore = useAuthStore.getState();
      
      if (authStore.refreshToken && !config._retry) {
        config._retry = true;
        
        try {
          await authStore.refreshTokens();
          
          // Retry original request with new token
          const newAuthHeader = authStore.getAuthHeader();
          if (newAuthHeader) {
            config.headers.Authorization = newAuthHeader;
          }
          
          return apiClient(config);
        } catch (refreshError) {
          // Refresh failed, logout user
          authStore.logout();
          
          // Show notification
          const { showError } = useNotifications.getState();
          showError('Session expired. Please login again.');
          
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token or already retried, logout user
        const authStore = useAuthStore.getState();
        authStore.logout();
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (response?.status === 403) {
      // Forbidden
      const { showError } = useNotifications.getState();
      showError('Access denied. You don\'t have permission for this action.');
    } else if (response?.status === 404) {
      // Not found - don't show notification for all 404s
      // Resource not found logged silently
    } else if (response?.status >= 500) {
      // Server error
      const { showError } = useNotifications.getState();
      showError('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      const { showError } = useNotifications.getState();
      showError('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      // Network error
      const { showError } = useNotifications.getState();
      showError('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API client methods with enhanced error handling
export const api = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // POST request
  post: async (url, data, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // PUT request
  put: async (url, data, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // PATCH request
  patch: async (url, data, config = {}) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // Upload file with progress
  upload: async (url, formData, onUploadProgress) => {
    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // Download file
  download: async (url, filename, config = {}) => {
    try {
      const response = await apiClient.get(url, {
        ...config,
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return response.data;
    } catch (error) {
      throw transformError(error);
    }
  },
  
  // Cancel request
  cancelToken: () => axios.CancelToken.source(),
  
  // Check if error is cancellation
  isCancel: axios.isCancel,
};

// Transform axios error to application error
const transformError = (error) => {
  if (axios.isCancel(error)) {
    return new Error('Request cancelled');
  }
  
  const response = error.response;
  const request = error.request;
  
  if (response) {
    // Server responded with error status
    const errorData = response.data;
    const message = errorData?.message || 
                   errorData?.error || 
                   `HTTP ${response.status}: ${response.statusText}`;
    
    const appError = new Error(message);
    appError.status = response.status;
    appError.statusText = response.statusText;
    appError.data = errorData;
    appError.code = errorData?.code;
    
    return appError;
  } else if (request) {
    // Request made but no response received
    const appError = new Error('Network error - no response received');
    appError.code = 'NETWORK_ERROR';
    return appError;
  } else {
    // Something else happened
    return new Error(error.message || 'Unknown error occurred');
  }
};

// Request/Response transformation utilities
export const transformers = {
  // Transform request data
  request: {
    // Convert camelCase to snake_case for API
    camelToSnake: (data) => {
      if (!data || typeof data !== 'object') return data;
      
      const transformed = {};
      Object.keys(data).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        transformed[snakeKey] = data[key];
      });
      return transformed;
    },
    
    // Remove null/undefined values
    removeEmpty: (data) => {
      if (!data || typeof data !== 'object') return data;
      
      const cleaned = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          cleaned[key] = data[key];
        }
      });
      return cleaned;
    },
  },
  
  // Transform response data
  response: {
    // Convert snake_case to camelCase from API
    snakeToCamel: (data) => {
      if (!data || typeof data !== 'object') return data;
      
      if (Array.isArray(data)) {
        return data.map(item => transformers.response.snakeToCamel(item));
      }
      
      const transformed = {};
      Object.keys(data).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        transformed[camelKey] = data[key];
      });
      return transformed;
    },
    
    // Extract data from standard API response format
    extractData: (response) => {
      if (response?.data) {
        return response.data;
      }
      return response;
    },
  },
};

// API endpoint helpers
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/me',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    refreshToken: '/auth/refresh-token',
    verifyEmail: (token) => `/auth/verify-email/${token}`,
    resendVerification: '/auth/resend-verification',
    session: '/auth/session',
  },
  
  // Product endpoints
  products: {
    list: '/products',
    detail: (id) => `/products/${id}`,
    search: '/products/search',
    categories: '/products/categories',
    featured: '/products/featured',
    recommendations: (id) => `/products/${id}/recommendations`,
    reviews: (id) => `/products/${id}/reviews`,
  },
  
  // Cart endpoints
  cart: {
    items: '/cart',
    count: '/cart/count',
    add: '/cart/items',
    update: (id) => `/cart/items/${id}`,
    remove: (id) => `/cart/items/${id}`,
    clear: '/cart',
    sync: '/cart/sync',
  },
  
  // Order endpoints
  orders: {
    list: '/orders',
    detail: (id) => `/orders/${id}`,
    create: '/orders',
    cancel: (id) => `/orders/${id}/cancel`,
    history: '/orders/history',
  },
  
  // Admin endpoints
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    products: '/admin/products',
    orders: '/admin/orders',
    analytics: '/admin/analytics',
    security: '/admin/security',
  },
};

// Request cancellation helper
export const createCancelToken = () => {
  const source = axios.CancelToken.source();
  return {
    token: source.token,
    cancel: source.cancel,
  };
};

// Batch requests helper
export const batchRequests = async (requests) => {
  try {
    const responses = await Promise.allSettled(requests);
    
    return responses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          success: true,
          data: result.value,
          index,
        };
      } else {
        return {
          success: false,
          error: transformError(result.reason),
          index,
        };
      }
    });
  } catch (error) {
    throw transformError(error);
  }
};

// Health check utility
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return {
      healthy: true,
      ...response,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

export default api;