// API Configuration
import config from '../config/environment.js';

const API_BASE_URL = config.API_BASE_URL;

// Ensure API_BASE_URL is properly formatted
const formatApiBaseUrl = (url) => {
  if (!url) {
    throw new Error('API_BASE_URL is required');
  }
  
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};

// Validated and formatted base URL
export const FORMATTED_API_BASE_URL = formatApiBaseUrl(API_BASE_URL);

// API endpoints - Updated to match backend implementation
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    PROFILE: '/auth/profile',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    VERIFY_MFA: '/auth/verify-mfa',
    SETUP_MFA: '/auth/setup-mfa',
    DISABLE_MFA: '/auth/disable-mfa',
    RESEND_MFA: '/auth/resend-mfa',
    PREFERENCES: '/auth/preferences',
    SESSIONS: '/auth/sessions'
  },

  // Products - Updated to match backend routes
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    FEATURED: '/products/featured',
    TOP_SELLERS: '/products/top-sellers',
    LATEST: '/products/latest',
    ON_SALE: '/products/on-sale',
    WEEKLY_DEALS: '/products/weekly-deals',
    QUICK_PICKS: '/products/quick-picks',
    SECTION: (section) => `/products/section/${section}`,
    BY_CATEGORY: (categoryId) => `/products/category/${categoryId}`,
    BY_ID: (id) => `/products/${id}`,
    REVIEWS: (id) => `/products/${id}/reviews`,
    RELATED: (id) => `/products/${id}/related`
  },

  // Orders
  ORDERS: {
    BASE: '/orders',
    USER_ORDERS: '/orders/user',
    BY_ID: (id) => `/orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    TRACKING: (id) => `/orders/${id}/tracking`,
    PAYMENT: (id) => `/orders/${id}/payment`,
    STATUS: (id) => `/orders/${id}/status`,
    REFUND: (id) => `/orders/${id}/refund`
  },

  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    ADDRESSES: '/users/addresses',
    ADDRESS_BY_ID: (id) => `/users/addresses/${id}`,
    PAYMENT_METHODS: '/users/payment-methods',
    PAYMENT_METHOD_BY_ID: (id) => `/users/payment-methods/${id}`,
    WISHLIST: '/users/wishlist',
    WISHLIST_PRODUCT: (productId) => `/users/wishlist/${productId}`,
    CART: '/users/cart',
    CART_ITEM: (itemId) => `/users/cart/${itemId}`
  },

  // Admin - Updated to match backend routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    ANALYTICS: '/admin/analytics',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    ORDER_STATS: '/admin/orders/stats',
    USERS: '/admin/users',
    USER_BY_ID: (id) => `/admin/users/${id}`,
    USER_STATUS: (id) => `/admin/users/${id}/status`,
    CATEGORIES: '/admin/categories',
    CATEGORY_BY_ID: (id) => `/admin/categories/${id}`,
    SECTIONS: '/admin/sections',
    SECTION: (section) => `/admin/sections/${section}`,
    SECTION_PRODUCT: (section, productId) => `/admin/sections/${section}/products/${productId}`,
    PRODUCTS_AVAILABLE: '/admin/products/available',
    PRODUCTS_SECTIONS: '/admin/products/sections'
  },

  // File Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    IMAGES: '/upload/images',
    DELETE_IMAGE: '/upload/image',
    IMAGE_INFO: '/upload/image/info',
    TEST: '/upload/test'
  },

  // Health Check
  HEALTH: {
    BASE: '/health',
    DETAILED: '/health/detailed',
    DATABASE: '/health/database',
    MONITOR_STATUS: '/health/monitor/status',
    MONITOR_STATS: '/health/monitor/stats',
    MONITOR_HISTORY: '/health/monitor/history',
    MONITOR_START: '/health/monitor/start',
    MONITOR_STOP: '/health/monitor/stop'
  }
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Request timeout and retry configuration
export const REQUEST_TIMEOUT = config.REQUEST_TIMEOUT;
export const RETRY_ATTEMPTS = config.RETRY_ATTEMPTS;
export const RETRY_DELAY = config.RETRY_DELAY;
export const CACHE_TTL = config.CACHE_TTL;

// Environment-specific settings
export const DEBUG_MODE = config.DEBUG_MODE;
export const ENABLE_LOGGING = config.ENABLE_LOGGING;
export const ENABLE_MOCK_API = config.ENABLE_MOCK_API;

// Error handling configuration
export const ERROR_CONFIG = {
  SHOW_STACK_TRACE: config.DEBUG_MODE,
  LOG_ERRORS: config.ENABLE_LOGGING,
  RETRY_ON_NETWORK_ERROR: true,
  RETRY_ON_SERVER_ERROR: config.ENVIRONMENT !== 'production',
  SHOW_DETAILED_ERRORS: config.DEBUG_MODE
};

// Enhanced API configuration for better service integration
export const API_CONFIG = {
  BASE_URL: FORMATTED_API_BASE_URL,
  TIMEOUT: REQUEST_TIMEOUT,
  RETRY_ATTEMPTS: RETRY_ATTEMPTS,
  RETRY_DELAY: RETRY_DELAY,
  CACHE_TTL: CACHE_TTL,
  DEBUG_MODE: DEBUG_MODE,
  ENABLE_LOGGING: ENABLE_LOGGING,
  ERROR_CONFIG: ERROR_CONFIG
};

// Utility function to build full endpoint URL
export const buildEndpointUrl = (endpoint) => {
  if (typeof endpoint === 'function') {
    throw new Error('Endpoint function must be called with parameters first');
  }
  return `${FORMATTED_API_BASE_URL}${endpoint}`;
};

// Utility function to validate endpoint
export const validateEndpoint = (endpoint) => {
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint: must be a non-empty string');
  }
  
  if (!endpoint.startsWith('/')) {
    throw new Error('Invalid endpoint: must start with "/"');
  }
  
  return true;
};

export default FORMATTED_API_BASE_URL;