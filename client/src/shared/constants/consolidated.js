/**
 * Consolidated Constants
 * Merges constants from utils/constants.js and shared/constants/index.js
 * Provides single source of truth for all application constants
 */

// User roles and permissions
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  GUEST: 'guest'
};

export const PERMISSIONS = {
  // User permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Product permissions
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Order permissions
  ORDER_READ: 'order:read',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  
  // Admin permissions
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_USERS: 'admin:users',
  ADMIN_PRODUCTS: 'admin:products',
  ADMIN_ORDERS: 'admin:orders',
  ADMIN_SETTINGS: 'admin:settings'
};

// Application statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  RETURNED: 'returned'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  OUT_OF_STOCK: 'out_of_stock'
};

export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock'
};

// Business configuration
export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  NEXT_DAY: 'next_day',
  INTERNATIONAL: 'international'
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CASH_ON_DELIVERY: 'cash_on_delivery'
};

// File handling
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES: 10,
  CHUNK_SIZE: 1024 * 1024 // 1MB chunks for large uploads
};

// API configuration
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 5
};

export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 300000, // 5 minutes
  DOWNLOAD: 120000, // 2 minutes
  AUTH: 10000 // 10 seconds
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_FACTOR: 2
};

// Storage keys - Consolidated and versioned
export const STORAGE_KEYS = {
  // Authentication
  ACCESS_TOKEN: 'techverse_access_token_v3',
  REFRESH_TOKEN: 'techverse_refresh_token_v3',
  SESSION_ID: 'techverse_session_id_v3',
  USER_DATA: 'techverse_user_v3',
  PERMISSIONS: 'techverse_permissions_v3',
  
  // Application state
  CART: 'techverse_cart_v2',
  WISHLIST: 'techverse_wishlist_v2',
  THEME: 'techverse_theme_v2',
  LANGUAGE: 'techverse_language_v2',
  
  // Performance and caching
  CACHE_PREFIX: 'techverse_cache_',
  PERFORMANCE_DATA: 'techverse_performance_v2',
  
  // Legacy keys for migration
  LEGACY_TOKEN: 'techverse_token',
  LEGACY_REFRESH: 'techverse_refresh_token'
};

// Validation patterns - Enhanced
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  POSTCODE_UK: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
  CARD_NUMBER: /^[0-9]{13,19}$/,
  CVV: /^[0-9]{3,4}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

// Currency and localization
export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
  DECIMAL_PLACES: 2
};

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  RELATIVE: 'relative' // for "2 hours ago" format
};

export const LOCALES = {
  EN_GB: 'en-GB',
  EN_US: 'en-US',
  FR_FR: 'fr-FR',
  DE_DE: 'de-DE',
  ES_ES: 'es-ES'
};

// UI configuration
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0
};

// Product configuration
export const PRODUCT_CATEGORIES = {
  LAPTOPS: 'laptops',
  DESKTOPS: 'desktops',
  MONITORS: 'monitors',
  ACCESSORIES: 'accessories',
  COMPONENTS: 'components',
  GAMING: 'gaming',
  MOBILE: 'mobile',
  AUDIO: 'audio'
};

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_LOW_HIGH: 'price_asc',
  PRICE_HIGH_LOW: 'price_desc',
  NAME_A_Z: 'name_asc',
  NAME_Z_A: 'name_desc',
  RATING: 'rating_desc',
  POPULARITY: 'popularity'
};

export const FILTER_TYPES = {
  PRICE: 'price',
  BRAND: 'brand',
  CATEGORY: 'category',
  RATING: 'rating',
  AVAILABILITY: 'availability',
  FEATURES: 'features'
};

export const REVIEW_RATINGS = {
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  POOR: 2,
  TERRIBLE: 1
};

export const ADDRESS_TYPES = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other'
};

// Error handling
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Authentication errors
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
};

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
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// API response messages
export const API_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Please check your input and try again',
  SERVER_ERROR: 'Server error. Please try again later.'
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 2000, // 2 seconds
  RENDER_TIME: 16, // 16ms for 60fps
  MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  BUNDLE_SIZE: 2 * 1024 * 1024, // 2MB
  IMAGE_SIZE: 500 * 1024, // 500KB
  CACHE_SIZE: 50 * 1024 * 1024 // 50MB
};

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_CACHING: true,
  ENABLE_PREFETCHING: true,
  ENABLE_BATCHING: true,
  ENABLE_COMPRESSION: true,
  ENABLE_ANALYTICS: true,
  ENABLE_ERROR_REPORTING: true,
  ENABLE_PERFORMANCE_MONITORING: true
};

// Export all constants as default object
export default {
  USER_ROLES,
  PERMISSIONS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  STOCK_STATUS,
  SHIPPING_METHODS,
  PAYMENT_METHODS,
  FILE_LIMITS,
  PAGINATION,
  API_TIMEOUTS,
  RETRY_CONFIG,
  STORAGE_KEYS,
  VALIDATION_PATTERNS,
  CURRENCY,
  DATE_FORMATS,
  LOCALES,
  THEMES,
  NOTIFICATION_TYPES,
  NOTIFICATION_DURATION,
  PRODUCT_CATEGORIES,
  SORT_OPTIONS,
  FILTER_TYPES,
  REVIEW_RATINGS,
  ADDRESS_TYPES,
  ERROR_CODES,
  HTTP_STATUS,
  API_MESSAGES,
  PERFORMANCE_THRESHOLDS,
  FEATURE_FLAGS
};