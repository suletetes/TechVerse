/**
 * API Configuration - Updated to use centralized configuration
 * This file now imports from the centralized config manager and endpoints
 */

import configManager from '../config/ConfigManager.js';
import { API_ENDPOINTS as CENTRALIZED_ENDPOINTS, EndpointUtils } from '../config/endpoints.js';
import { HTTP_STATUS } from '../shared/constants/consolidated.js';

// Get API configuration from centralized config manager
const getApiConfig = () => configManager.getApiConfig();
const getEnvironmentConfig = () => configManager.getEnvironmentConfig();

// Validated and formatted base URL
export const FORMATTED_API_BASE_URL = configManager.get('api.baseUrl');

// Use centralized API endpoints with backward compatibility
export const API_ENDPOINTS = {
  ...CENTRALIZED_ENDPOINTS,
  
  // Add any legacy endpoints that need to be maintained for backward compatibility
  PRODUCTS: {
    ...CENTRALIZED_ENDPOINTS.PRODUCTS,
    // Legacy function-based endpoints
    SECTION: (section) => `/products/section/${section}`,
    BY_CATEGORY: (categoryId) => `/products/category/${categoryId}`,
    BY_ID: (id) => `/products/${id}`,
    REVIEWS: (id) => `/products/${id}/reviews`,
    RELATED: (id) => `/products/${id}/related`
  },
  
  ORDERS: {
    ...CENTRALIZED_ENDPOINTS.ORDERS,
    // Legacy function-based endpoints
    BY_ID: (id) => `/orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    TRACKING: (id) => `/orders/${id}/tracking`
  },
  
  USERS: {
    ...CENTRALIZED_ENDPOINTS.USERS,
    // Legacy function-based endpoints
    ADDRESS_BY_ID: (id) => `/users/addresses/${id}`,
    PAYMENT_METHOD_BY_ID: (id) => `/users/payment-methods/${id}`,
    WISHLIST_PRODUCT: (productId) => `/users/wishlist/${productId}`,
    CART_ITEM: (itemId) => `/users/cart/${itemId}`
  },
  
  ADMIN: {
    ...CENTRALIZED_ENDPOINTS.ADMIN,
    // Legacy function-based endpoints
    USER_BY_ID: (id) => `/admin/users/${id}`,
    USER_STATUS: (id) => `/admin/users/${id}/status`,
    CATEGORY_BY_ID: (id) => `/admin/categories/${id}`,
    SECTION: (section) => `/admin/sections/${section}`,
    SECTION_PRODUCT: (section, productId) => `/admin/sections/${section}/products/${productId}`
  }
};

// Re-export HTTP status codes from centralized constants
export { HTTP_STATUS } from '../shared/constants/consolidated.js';

// Get configuration values from centralized config manager
export const REQUEST_TIMEOUT = configManager.get('api.timeout');
export const RETRY_ATTEMPTS = configManager.get('api.retryAttempts');
export const RETRY_DELAY = configManager.get('api.retryDelay');
export const CACHE_TTL = configManager.get('storage.cacheExpiry');

// Environment-specific settings from centralized config
export const DEBUG_MODE = configManager.get('DEBUG_MODE');
export const ENABLE_LOGGING = configManager.get('ENABLE_LOGGING');
export const ENABLE_MOCK_API = configManager.get('ENABLE_MOCK_API');

// Error handling configuration using centralized config
export const ERROR_CONFIG = {
  SHOW_STACK_TRACE: configManager.get('DEBUG_MODE'),
  LOG_ERRORS: configManager.get('ENABLE_LOGGING'),
  RETRY_ON_NETWORK_ERROR: true,
  RETRY_ON_SERVER_ERROR: configManager.get('build.environment') !== 'production',
  SHOW_DETAILED_ERRORS: configManager.get('DEBUG_MODE')
};

// Enhanced API configuration using centralized config manager
export const API_CONFIG = {
  BASE_URL: FORMATTED_API_BASE_URL,
  TIMEOUT: REQUEST_TIMEOUT,
  RETRY_ATTEMPTS: RETRY_ATTEMPTS,
  RETRY_DELAY: RETRY_DELAY,
  CACHE_TTL: CACHE_TTL,
  DEBUG_MODE: DEBUG_MODE,
  ENABLE_LOGGING: ENABLE_LOGGING,
  ERROR_CONFIG: ERROR_CONFIG,
  ENABLE_CACHING: configManager.get('api.enableCaching'),
  ENABLE_BATCHING: configManager.get('api.enableBatching'),
  ENABLE_PREFETCHING: configManager.get('api.enablePrefetching')
};

// Use centralized endpoint utilities
export const buildEndpointUrl = (endpoint, params = {}) => {
  if (typeof endpoint === 'function') {
    throw new Error('Endpoint function must be called with parameters first');
  }
  return EndpointUtils.buildUrl(endpoint, params);
};

// Use centralized endpoint validation
export const validateEndpoint = (endpoint) => {
  const errors = EndpointUtils.validateEndpoint(endpoint);
  if (errors.length > 0) {
    throw new Error(`Invalid endpoint: ${errors.join(', ')}`);
  }
  return true;
};

// Additional utility functions using centralized config
export const getEndpointMetadata = (endpoint) => EndpointUtils.getMetadata(endpoint);
export const requiresAuth = (endpoint) => EndpointUtils.requiresAuth(endpoint);
export const requiresAdmin = (endpoint) => EndpointUtils.requiresAdmin(endpoint);

// Configuration change listener
export const onConfigChange = (listener) => configManager.addListener(listener);

// Get current configuration summary
export const getConfigSummary = () => configManager.getSummary();

export default FORMATTED_API_BASE_URL;