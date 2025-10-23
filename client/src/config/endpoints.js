/**
 * Centralized API Endpoints Configuration
 * Consolidates all API endpoint definitions in one place
 */

import configManager from './ConfigManager.js';

// Get base API URL from configuration
const getBaseUrl = () => configManager.get('api.baseUrl', 'http://localhost:5000/api');

/**
 * API Endpoints organized by domain
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',

    // MFA endpoints
    SETUP_MFA: '/auth/mfa/setup',
    VERIFY_MFA: '/auth/mfa/verify',
    DISABLE_MFA: '/auth/mfa/disable',
    RESEND_MFA: '/auth/mfa/resend',

    // Session management
    SESSIONS: '/auth/sessions',
    PREFERENCES: '/auth/preferences'
  },

  // Product endpoints
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    BRANDS: '/products/brands',
    FEATURED: '/products/featured',
    LATEST: '/products/latest',
    TOP_SELLERS: '/products/top-sellers',
    QUICK_PICKS: '/products/quick-picks',
    WEEKLY_DEALS: '/products/weekly-deals',
    REVIEWS: '/products/:id/reviews',
    SPECIFICATIONS: '/products/:id/specifications',
    RELATED: '/products/:id/related',
    AVAILABILITY: '/products/:id/availability',
    PRICE_HISTORY: '/products/:id/price-history'
  },

  // Order endpoints
  ORDERS: {
    BASE: '/orders',
    HISTORY: '/orders/history',
    TRACKING: '/orders/:id/tracking',
    CANCEL: '/orders/:id/cancel',
    RETURN: '/orders/:id/return',
    INVOICE: '/orders/:id/invoice'
  },

  // Cart endpoints
  CART: {
    BASE: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR: '/cart/clear',
    APPLY_COUPON: '/cart/coupon',
    ESTIMATE_SHIPPING: '/cart/shipping-estimate'
  },

  // Wishlist endpoints
  WISHLIST: {
    BASE: '/wishlist',
    ADD: '/wishlist/add',
    REMOVE: '/wishlist/remove',
    CLEAR: '/wishlist/clear'
  },

  // User endpoints
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    ADDRESSES: '/users/addresses',
    PAYMENT_METHODS: '/users/payment-methods',
    PREFERENCES: '/users/preferences',
    ACTIVITY: '/users/activity',
    NOTIFICATIONS: '/users/notifications'
  },

  // Admin endpoints
  ADMIN: {
    // Dashboard
    DASHBOARD: '/admin/dashboard',
    ANALYTICS: '/admin/analytics',

    // Product management
    PRODUCTS: '/admin/products',
    PRODUCT_CREATE: '/admin/products/create',
    PRODUCT_UPDATE: '/admin/products/:id',
    PRODUCT_DELETE: '/admin/products/:id',
    PRODUCT_BULK: '/admin/products/bulk',

    // Category management
    CATEGORIES: '/admin/categories',
    CATEGORY_CREATE: '/admin/categories/create',
    CATEGORY_UPDATE: '/admin/categories/:id',
    CATEGORY_DELETE: '/admin/categories/:id',

    // Order management
    ORDERS: '/admin/orders',
    ORDER_UPDATE: '/admin/orders/:id',
    ORDER_FULFILL: '/admin/orders/:id/fulfill',
    ORDER_REFUND: '/admin/orders/:id/refund',

    // User management
    USERS: '/admin/users',
    USER_UPDATE: '/admin/users/:id',
    USER_SUSPEND: '/admin/users/:id/suspend',
    USER_ACTIVATE: '/admin/users/:id/activate',

    // Homepage management
    HOMEPAGE_SECTIONS: '/admin/homepage/sections',
    HOMEPAGE_ASSIGN: '/admin/homepage/assign',
    HOMEPAGE_UNASSIGN: '/admin/homepage/unassign',

    // Settings
    SETTINGS: '/admin/settings',
    SYSTEM_INFO: '/admin/system/info',
    SYSTEM_HEALTH: '/admin/system/health'
  },

  // File upload endpoints
  UPLOAD: {
    IMAGE: '/upload/image',
    IMAGES: '/upload/images',
    DOCUMENT: '/upload/document',
    AVATAR: '/upload/avatar',
    PRODUCT_IMAGES: '/upload/product-images'
  },

  // Search endpoints
  SEARCH: {
    GLOBAL: '/search',
    PRODUCTS: '/search/products',
    SUGGESTIONS: '/search/suggestions',
    AUTOCOMPLETE: '/search/autocomplete'
  },

  // Payment endpoints
  PAYMENT: {
    METHODS: '/payment/methods',
    PROCESS: '/payment/process',
    VERIFY: '/payment/verify',
    REFUND: '/payment/refund',
    WEBHOOKS: '/payment/webhooks'
  },

  // Shipping endpoints
  SHIPPING: {
    METHODS: '/shipping/methods',
    CALCULATE: '/shipping/calculate',
    TRACK: '/shipping/track',
    ZONES: '/shipping/zones'
  },

  // Notification endpoints
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    PREFERENCES: '/notifications/preferences'
  },

  // Support endpoints
  SUPPORT: {
    TICKETS: '/support/tickets',
    FAQ: '/support/faq',
    CONTACT: '/support/contact',
    CHAT: '/support/chat'
  },

  // System endpoints
  SYSTEM: {
    HEALTH: '/health',
    STATUS: '/status',
    VERSION: '/version',
    CONFIG: '/config'
  }
};

/**
 * Helper functions for endpoint management
 */
export const EndpointUtils = {
  /**
   * Build full URL for an endpoint
   */
  buildUrl(endpoint, params = {}) {
    const baseUrl = getBaseUrl();
    let url = endpoint;

    // Replace path parameters
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    });

    return `${baseUrl}${url}`;
  },

  /**
   * Get endpoint with parameters replaced
   */
  getEndpoint(path, params = {}) {
    let endpoint = path;

    Object.entries(params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, encodeURIComponent(value));
    });

    return endpoint;
  },

  /**
   * Check if endpoint requires authentication
   */
  requiresAuth(endpoint) {
    const publicEndpoints = [
      API_ENDPOINTS.AUTH.LOGIN,
      API_ENDPOINTS.AUTH.REGISTER,
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      API_ENDPOINTS.PRODUCTS.BASE,
      API_ENDPOINTS.PRODUCTS.SEARCH,
      API_ENDPOINTS.PRODUCTS.CATEGORIES,
      API_ENDPOINTS.PRODUCTS.BRANDS,
      API_ENDPOINTS.PRODUCTS.FEATURED,
      API_ENDPOINTS.PRODUCTS.LATEST,
      API_ENDPOINTS.PRODUCTS.TOP_SELLERS,
      API_ENDPOINTS.PRODUCTS.QUICK_PICKS,
      API_ENDPOINTS.PRODUCTS.WEEKLY_DEALS,
      API_ENDPOINTS.SYSTEM.HEALTH,
      API_ENDPOINTS.SYSTEM.STATUS,
      API_ENDPOINTS.SYSTEM.VERSION
    ];

    return !publicEndpoints.includes(endpoint);
  },

  /**
   * Check if endpoint requires admin privileges
   */
  requiresAdmin(endpoint) {
    return endpoint.startsWith('/admin/');
  },

  /**
   * Get all endpoints for a domain
   */
  getDomainEndpoints(domain) {
    return API_ENDPOINTS[domain.toUpperCase()] || {};
  },

  /**
   * Get endpoint by path
   */
  findEndpoint(path) {
    for (const domain of Object.values(API_ENDPOINTS)) {
      for (const [key, endpoint] of Object.entries(domain)) {
        if (endpoint === path) {
          return { domain, key, endpoint };
        }
      }
    }
    return null;
  },

  /**
   * Validate endpoint format
   */
  validateEndpoint(endpoint) {
    const errors = [];

    if (!endpoint || typeof endpoint !== 'string') {
      errors.push('Endpoint must be a non-empty string');
      return errors;
    }

    if (!endpoint.startsWith('/')) {
      errors.push('Endpoint must start with "/"');
    }

    if (endpoint.includes('//')) {
      errors.push('Endpoint cannot contain double slashes');
    }

    if (endpoint.endsWith('/') && endpoint !== '/') {
      errors.push('Endpoint should not end with "/"');
    }

    return errors;
  },

  /**
   * Get endpoint metadata
   */
  getMetadata(endpoint) {
    return {
      requiresAuth: this.requiresAuth(endpoint),
      requiresAdmin: this.requiresAdmin(endpoint),
      hasParameters: endpoint.includes(':'),
      parameters: this.extractParameters(endpoint)
    };
  },

  /**
   * Extract parameters from endpoint
   */
  extractParameters(endpoint) {
    const matches = endpoint.match(/:(\w+)/g);
    return matches ? matches.map(match => match.substring(1)) : [];
  }
};

/**
 * Endpoint groups for batch operations
 */
export const ENDPOINT_GROUPS = {
  AUTHENTICATION: [
    API_ENDPOINTS.AUTH.LOGIN,
    API_ENDPOINTS.AUTH.REGISTER,
    API_ENDPOINTS.AUTH.REFRESH,
    API_ENDPOINTS.AUTH.LOGOUT
  ],

  PRODUCT_CATALOG: [
    API_ENDPOINTS.PRODUCTS.BASE,
    API_ENDPOINTS.PRODUCTS.CATEGORIES,
    API_ENDPOINTS.PRODUCTS.BRANDS,
    API_ENDPOINTS.PRODUCTS.SEARCH
  ],

  HOMEPAGE_SECTIONS: [
    API_ENDPOINTS.PRODUCTS.FEATURED,
    API_ENDPOINTS.PRODUCTS.LATEST,
    API_ENDPOINTS.PRODUCTS.TOP_SELLERS,
    API_ENDPOINTS.PRODUCTS.QUICK_PICKS,
    API_ENDPOINTS.PRODUCTS.WEEKLY_DEALS
  ],

  USER_MANAGEMENT: [
    API_ENDPOINTS.USERS.PROFILE,
    API_ENDPOINTS.USERS.ADDRESSES,
    API_ENDPOINTS.USERS.PAYMENT_METHODS,
    API_ENDPOINTS.USERS.PREFERENCES
  ],

  ORDER_MANAGEMENT: [
    API_ENDPOINTS.ORDERS.BASE,
    API_ENDPOINTS.ORDERS.HISTORY,
    API_ENDPOINTS.CART.BASE,
    API_ENDPOINTS.WISHLIST.BASE
  ]
};

/**
 * Default export with all endpoint configurations
 */
export default {
  API_ENDPOINTS,
  EndpointUtils,
  ENDPOINT_GROUPS,
  getBaseUrl
};