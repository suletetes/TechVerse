// API Configuration
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    PROFILE: '/auth/profile',
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

  // Products
  PRODUCTS: {
    BASE: '/products',
    SEARCH: '/products/search',
    CATEGORIES: '/products/categories',
    FEATURED: '/products/featured',
    TOP_SELLERS: '/products/top-sellers',
    LATEST: '/products/latest',
    ON_SALE: '/products/on-sale',
    QUICK_PICKS: '/products/quick-picks',
    REVIEWS: (id) => `/products/${id}/reviews`
  },

  // Orders
  ORDERS: {
    BASE: '/orders',
    USER_ORDERS: '/orders/user',
    TRACKING: (id) => `/orders/${id}/tracking`
  },

  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    ADDRESSES: '/users/addresses',
    PAYMENT_METHODS: '/users/payment-methods',
    WISHLIST: '/users/wishlist',
    CART: '/users/cart'
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    USERS: '/admin/users',
    CATEGORIES: '/admin/categories',
    ANALYTICS: '/admin/analytics'
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

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

export default API_BASE_URL;