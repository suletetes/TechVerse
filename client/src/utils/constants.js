// Application constants

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Order statuses
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

// Payment statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

// Product statuses
export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  OUT_OF_STOCK: 'out_of_stock'
};

// Stock statuses
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock'
};

// Shipping methods
export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  NEXT_DAY: 'next_day',
  INTERNATIONAL: 'international'
};

// Payment methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CASH_ON_DELIVERY: 'cash_on_delivery'
};

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES: 10
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'techverse_token',
  REFRESH_TOKEN: 'techverse_refresh_token',
  CART: 'techverse_cart',
  WISHLIST: 'techverse_wishlist',
  THEME: 'techverse_theme',
  LANGUAGE: 'techverse_language'
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

// Form validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  POSTCODE_UK: /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
  CARD_NUMBER: /^[0-9]{13,19}$/,
  CVV: /^[0-9]{3,4}$/
};

// Currency settings
export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US'
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm'
};

// Theme settings
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Product categories (these would typically come from API)
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

// Sort options
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

// Filter options
export const FILTER_TYPES = {
  PRICE: 'price',
  BRAND: 'brand',
  CATEGORY: 'category',
  RATING: 'rating',
  AVAILABILITY: 'availability',
  FEATURES: 'features'
};

// Review ratings
export const REVIEW_RATINGS = {
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  POOR: 2,
  TERRIBLE: 1
};

// Address types
export const ADDRESS_TYPES = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other'
};

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

export default {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  STOCK_STATUS,
  SHIPPING_METHODS,
  PAYMENT_METHODS,
  FILE_LIMITS,
  PAGINATION,
  STORAGE_KEYS,
  API_MESSAGES,
  VALIDATION_PATTERNS,
  CURRENCY,
  DATE_FORMATS,
  THEMES,
  NOTIFICATION_TYPES,
  PRODUCT_CATEGORIES,
  SORT_OPTIONS,
  FILTER_TYPES,
  REVIEW_RATINGS,
  ADDRESS_TYPES,
  ERROR_CODES
};