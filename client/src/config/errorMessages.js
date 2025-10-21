/**
 * Centralized Error Messages Configuration
 * Consolidates all error messages and provides localization support
 */

import { ERROR_CODES, HTTP_STATUS } from '../shared/constants/consolidated.js';

/**
 * Error message templates organized by category
 */
export const ERROR_MESSAGES = {
  // Network and connectivity errors
  NETWORK: {
    [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection and try again.',
    [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
    [ERROR_CODES.CONNECTION_ERROR]: 'Unable to connect to the server. Please try again later.',
    OFFLINE: 'You appear to be offline. Please check your internet connection.',
    DNS_ERROR: 'Server not found. Please check your internet connection.',
    CORS_ERROR: 'Cross-origin request blocked. Please contact support if this persists.'
  },

  // HTTP status code errors
  HTTP: {
    [HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
    [HTTP_STATUS.UNAUTHORIZED]: 'Authentication required. Please log in again.',
    [HTTP_STATUS.FORBIDDEN]: 'Access denied. You don\'t have permission to perform this action.',
    [HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
    [HTTP_STATUS.CONFLICT]: 'Conflict detected. The resource may have been modified by another user.',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Validation failed. Please check your input.',
    [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal server error. Please try again later.',
    [HTTP_STATUS.BAD_GATEWAY]: 'Server is temporarily unavailable. Please try again later.',
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.'
  },

  // Authentication errors
  AUTHENTICATION: {
    [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
    [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
    ACCOUNT_LOCKED: 'Your account has been temporarily locked due to too many failed attempts.',
    ACCOUNT_INACTIVE: 'Your account is deactivated. Please contact support.',
    EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in.',
    MFA_REQUIRED: 'Multi-factor authentication is required.',
    MFA_INVALID: 'Invalid verification code. Please try again.',
    REFRESH_FAILED: 'Unable to refresh your session. Please log in again.',
    INSUFFICIENT_PERMISSIONS: 'You don\'t have permission to access this resource.',
    EMAIL_EXISTS: 'An account with this email already exists.',
    WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.'
  },

  // Validation errors
  VALIDATION: {
    [ERROR_CODES.REQUIRED_FIELD]: 'This field is required.',
    [ERROR_CODES.INVALID_FORMAT]: 'Invalid format. Please check your input.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    PASSWORDS_MISMATCH: 'Passwords do not match.',
    VALUE_TOO_LONG: 'Value is too long.',
    VALUE_TOO_SHORT: 'Value is too short.',
    INVALID_DATE: 'Please enter a valid date.',
    INVALID_NUMBER: 'Please enter a valid number.',
    INVALID_URL: 'Please enter a valid URL.',
    FILE_TOO_LARGE: 'File size is too large.',
    INVALID_FILE_TYPE: 'Invalid file type.',
    DUPLICATE_VALUE: 'This value already exists.'
  },

  // Business logic errors
  BUSINESS: {
    INSUFFICIENT_STOCK: 'Insufficient stock available.',
    PRODUCT_UNAVAILABLE: 'This product is currently unavailable.',
    ORDER_NOT_FOUND: 'Order not found.',
    PAYMENT_FAILED: 'Payment processing failed. Please try again.',
    PAYMENT_DECLINED: 'Payment was declined. Please check your payment details.',
    SHIPPING_UNAVAILABLE: 'Shipping is not available to this location.',
    DISCOUNT_EXPIRED: 'This discount code has expired.',
    DISCOUNT_INVALID: 'Invalid discount code.',
    DISCOUNT_LIMIT_REACHED: 'Discount usage limit has been reached.',
    CART_EMPTY: 'Your cart is empty.',
    ADDRESS_INVALID: 'Please provide a valid address.',
    MINIMUM_ORDER_NOT_MET: 'Minimum order amount not met.',
    MAXIMUM_ORDER_EXCEEDED: 'Maximum order amount exceeded.',
    ITEM_OUT_OF_STOCK: 'One or more items in your cart are out of stock.',
    PRICE_CHANGED: 'The price of one or more items has changed.',
    CATEGORY_NOT_EMPTY: 'Cannot delete category that contains products.',
    CANNOT_DELETE_ACTIVE_PRODUCT: 'Cannot delete an active product with pending orders.'
  },

  // File upload errors
  UPLOAD: {
    FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
    INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed.',
    UPLOAD_FAILED: 'File upload failed. Please try again.',
    TOO_MANY_FILES: 'Too many files. Maximum 10 files allowed.',
    CORRUPTED_FILE: 'File appears to be corrupted.',
    VIRUS_DETECTED: 'File failed security scan.',
    STORAGE_FULL: 'Storage limit reached. Please contact support.'
  },

  // Search errors
  SEARCH: {
    NO_RESULTS: 'No results found for your search.',
    SEARCH_TOO_SHORT: 'Search term must be at least 2 characters.',
    SEARCH_TOO_LONG: 'Search term is too long.',
    INVALID_SEARCH: 'Invalid search query.',
    SEARCH_FAILED: 'Search failed. Please try again.'
  },

  // Cart and checkout errors
  CART: {
    ITEM_NOT_FOUND: 'Item not found in cart.',
    INVALID_QUANTITY: 'Invalid quantity specified.',
    QUANTITY_EXCEEDED: 'Requested quantity exceeds available stock.',
    CART_EXPIRED: 'Your cart has expired. Please refresh and try again.',
    CHECKOUT_FAILED: 'Checkout failed. Please try again.',
    SHIPPING_CALCULATION_FAILED: 'Unable to calculate shipping costs.',
    TAX_CALCULATION_FAILED: 'Unable to calculate taxes.'
  },

  // Admin specific errors
  ADMIN: {
    INSUFFICIENT_PRIVILEGES: 'Insufficient admin privileges.',
    CANNOT_DELETE_SELF: 'You cannot delete your own account.',
    CANNOT_DEMOTE_SELF: 'You cannot remove your own admin privileges.',
    SYSTEM_USER_PROTECTED: 'System users cannot be modified.',
    BULK_OPERATION_FAILED: 'Bulk operation failed. Some items may not have been processed.',
    EXPORT_FAILED: 'Data export failed. Please try again.',
    IMPORT_FAILED: 'Data import failed. Please check your file format.',
    BACKUP_FAILED: 'System backup failed.',
    RESTORE_FAILED: 'System restore failed.'
  },

  // Generic fallback messages
  GENERIC: {
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    CLIENT_ERROR: 'Request failed. Please check your input and try again.',
    OPERATION_FAILED: 'Operation failed. Please try again.',
    FEATURE_UNAVAILABLE: 'This feature is currently unavailable.',
    MAINTENANCE_MODE: 'System is under maintenance. Please try again later.',
    RATE_LIMITED: 'Too many requests. Please wait before trying again.'
  }
};

/**
 * Context-specific error message overrides
 */
export const CONTEXT_MESSAGES = {
  '/auth/login': {
    [HTTP_STATUS.UNAUTHORIZED]: 'Invalid login credentials. Please check your email and password.',
    [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many login attempts. Please wait 15 minutes before trying again.'
  },
  
  '/auth/register': {
    [HTTP_STATUS.CONFLICT]: 'An account with this email already exists. Please use a different email or try logging in.',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Registration failed. Please check all required fields.'
  },
  
  '/products': {
    [HTTP_STATUS.NOT_FOUND]: 'Product not found or no longer available.',
    [HTTP_STATUS.GONE]: 'This product has been discontinued.'
  },
  
  '/orders': {
    [HTTP_STATUS.NOT_FOUND]: 'Order not found. Please check your order number.',
    [HTTP_STATUS.FORBIDDEN]: 'You don\'t have permission to view this order.'
  },
  
  '/admin': {
    [HTTP_STATUS.FORBIDDEN]: 'Admin access required. Please contact your administrator.',
    [HTTP_STATUS.UNAUTHORIZED]: 'Admin session expired. Please log in again.'
  },
  
  '/upload': {
    [HTTP_STATUS.REQUEST_ENTITY_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
    [HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE]: 'File type not supported. Please use a different format.'
  }
};

/**
 * User action suggestions based on error type
 */
export const ERROR_ACTIONS = {
  [ERROR_CODES.NETWORK_ERROR]: [
    'Check your internet connection',
    'Try refreshing the page',
    'Contact support if the problem persists'
  ],
  
  [ERROR_CODES.AUTHENTICATION_ERROR]: [
    'Log in again',
    'Reset your password if needed',
    'Contact support if you continue having issues'
  ],
  
  [ERROR_CODES.VALIDATION_ERROR]: [
    'Check your input for errors',
    'Make sure all required fields are filled',
    'Follow the format requirements shown'
  ],
  
  [ERROR_CODES.SERVER_ERROR]: [
    'Try again in a few minutes',
    'Refresh the page',
    'Contact support if the error persists'
  ],
  
  [HTTP_STATUS.TOO_MANY_REQUESTS]: [
    'Wait a few minutes before trying again',
    'Reduce the frequency of your requests',
    'Contact support if you need higher limits'
  ],
  
  [HTTP_STATUS.NOT_FOUND]: [
    'Check the URL for typos',
    'Go back to the previous page',
    'Use the search function to find what you\'re looking for'
  ]
};

/**
 * Error message utilities
 */
export const ErrorMessageUtils = {
  /**
   * Get error message for a specific error code or HTTP status
   */
  getMessage(errorCode, context = null) {
    // Check context-specific messages first
    if (context && CONTEXT_MESSAGES[context] && CONTEXT_MESSAGES[context][errorCode]) {
      return CONTEXT_MESSAGES[context][errorCode];
    }

    // Check category-specific messages
    for (const category of Object.values(ERROR_MESSAGES)) {
      if (category[errorCode]) {
        return category[errorCode];
      }
    }

    // Fallback to generic message
    return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
  },

  /**
   * Get suggested actions for an error
   */
  getActions(errorCode) {
    return ERROR_ACTIONS[errorCode] || [
      'Try again',
      'Refresh the page',
      'Contact support if the problem persists'
    ];
  },

  /**
   * Format error message with dynamic values
   */
  formatMessage(template, values = {}) {
    let message = template;
    
    Object.entries(values).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
    
    return message;
  },

  /**
   * Get error severity level
   */
  getSeverity(errorCode) {
    if (errorCode >= 500) return 'error';
    if (errorCode === 401 || errorCode === 403) return 'warning';
    if (errorCode >= 400) return 'info';
    if (ERROR_CODES.NETWORK_ERROR === errorCode) return 'warning';
    return 'error';
  },

  /**
   * Check if error is retryable
   */
  isRetryable(errorCode) {
    const retryableErrors = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.BAD_GATEWAY,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      HTTP_STATUS.TOO_MANY_REQUESTS
    ];
    
    return retryableErrors.includes(errorCode);
  },

  /**
   * Get all messages for a category
   */
  getCategoryMessages(category) {
    return ERROR_MESSAGES[category.toUpperCase()] || {};
  },

  /**
   * Search for messages containing specific text
   */
  searchMessages(searchText) {
    const results = [];
    const lowerSearch = searchText.toLowerCase();
    
    Object.entries(ERROR_MESSAGES).forEach(([category, messages]) => {
      Object.entries(messages).forEach(([code, message]) => {
        if (message.toLowerCase().includes(lowerSearch)) {
          results.push({ category, code, message });
        }
      });
    });
    
    return results;
  }
};

/**
 * Default export with all error message configurations
 */
export default {
  ERROR_MESSAGES,
  CONTEXT_MESSAGES,
  ERROR_ACTIONS,
  ErrorMessageUtils
};