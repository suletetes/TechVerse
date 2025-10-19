/**
 * Enhanced Error Handler Service
 * Provides comprehensive error translation, categorization, and user-friendly messaging
 * for different types of API errors and contexts.
 */

import { handleCorsError, isCorsError } from '../../utils/corsErrorHandler.js';

class ErrorHandler {
  constructor(options = {}) {
    this.config = {
      enableLogging: options.enableLogging || process.env.NODE_ENV === 'development',
      logLevel: options.logLevel || 'error',
      includeStackTrace: options.includeStackTrace || process.env.NODE_ENV === 'development',
      ...options
    };
    
    // Error message templates
    this.errorMessages = this.initializeErrorMessages();
    
    // Context-specific error handlers
    this.contextHandlers = this.initializeContextHandlers();
  }

  /**
   * Initialize default error messages
   * @returns {Object} Error message templates
   */
  initializeErrorMessages() {
    return {
      // Network errors
      network: {
        timeout: 'Request timed out. Please check your internet connection and try again.',
        offline: 'You appear to be offline. Please check your internet connection.',
        connection: 'Unable to connect to the server. Please try again later.',
        dns: 'Server not found. Please check your internet connection.',
        unknown: 'Network error occurred. Please try again.'
      },
      
      // HTTP status code errors
      http: {
        400: 'Invalid request. Please check your input and try again.',
        401: 'Authentication required. Please log in again.',
        403: 'Access denied. You don\'t have permission to perform this action.',
        404: 'The requested resource was not found.',
        405: 'This action is not allowed.',
        409: 'Conflict detected. The resource may have been modified by another user.',
        422: 'Validation failed. Please check your input.',
        429: 'Too many requests. Please wait a moment and try again.',
        500: 'Internal server error. Please try again later.',
        502: 'Server is temporarily unavailable. Please try again later.',
        503: 'Service temporarily unavailable. Please try again later.',
        504: 'Request timeout. Please try again.'
      },
      
      // Authentication specific errors
      auth: {
        invalid_credentials: 'Invalid email or password. Please try again.',
        account_locked: 'Your account has been temporarily locked. Please contact support.',
        email_not_verified: 'Please verify your email address before logging in.',
        mfa_required: 'Multi-factor authentication is required.',
        mfa_invalid: 'Invalid verification code. Please try again.',
        token_expired: 'Your session has expired. Please log in again.',
        token_invalid: 'Invalid authentication token. Please log in again.',
        refresh_failed: 'Unable to refresh your session. Please log in again.',
        insufficient_permissions: 'You don\'t have permission to access this resource.'
      },
      
      // Validation errors
      validation: {
        required_field: 'This field is required.',
        invalid_email: 'Please enter a valid email address.',
        invalid_phone: 'Please enter a valid phone number.',
        password_weak: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
        passwords_mismatch: 'Passwords do not match.',
        invalid_format: 'Invalid format. Please check your input.',
        value_too_long: 'Value is too long.',
        value_too_short: 'Value is too short.',
        invalid_date: 'Please enter a valid date.',
        file_too_large: 'File size is too large.',
        invalid_file_type: 'Invalid file type.'
      },
      
      // Business logic errors
      business: {
        insufficient_stock: 'Insufficient stock available.',
        product_unavailable: 'This product is currently unavailable.',
        order_not_found: 'Order not found.',
        payment_failed: 'Payment processing failed. Please try again.',
        shipping_unavailable: 'Shipping is not available to this location.',
        discount_expired: 'This discount code has expired.',
        discount_invalid: 'Invalid discount code.',
        cart_empty: 'Your cart is empty.',
        address_invalid: 'Please provide a valid address.'
      }
    };
  }

  /**
   * Initialize context-specific error handlers
   * @returns {Object} Context handlers
   */
  initializeContextHandlers() {
    return {
      '/auth/': this.handleAuthError.bind(this),
      '/products/': this.handleProductError.bind(this),
      '/orders/': this.handleOrderError.bind(this),
      '/admin/': this.handleAdminError.bind(this),
      '/users/': this.handleUserError.bind(this),
      '/upload/': this.handleUploadError.bind(this)
    };
  }

  /**
   * Main error translation method
   * @param {Error} error - The error to translate
   * @param {Object} context - Request context
   * @returns {Object} User-friendly error object
   */
  translateError(error, context = {}) {
    // Check for CORS errors first
    const corsError = handleCorsError(error, context.url);
    if (corsError) {
      // Log CORS error
      this.logError(error, context, { type: 'cors', category: 'network' });
      
      return {
        message: corsError.message,
        title: corsError.title,
        type: corsError.type,
        category: 'network',
        canRetry: corsError.canRetry,
        actions: corsError.suggestions?.map(suggestion => ({
          type: 'info',
          message: suggestion
        })) || [],
        originalError: error,
        corsInfo: corsError
      };
    }
    
    const errorInfo = this.analyzeError(error, context);
    const userFriendlyError = this.createUserFriendlyError(errorInfo, context);
    
    // Log error for debugging
    this.logError(error, context, errorInfo);
    
    return userFriendlyError;
  }

  /**
   * Analyze error to determine type and category
   * @param {Error} error - The error to analyze
   * @param {Object} context - Request context
   * @returns {Object} Error analysis
   */
  analyzeError(error, context) {
    const analysis = {
      originalError: error,
      type: 'unknown',
      category: 'general',
      status: error.status || error.code,
      message: error.message || 'Unknown error',
      data: error.data || null,
      url: context.url || error.url,
      method: context.method || 'GET',
      timestamp: new Date().toISOString(),
      requestId: context.requestId || error.requestId
    };

    // Determine error type
    if (this.isNetworkError(error)) {
      analysis.type = 'network';
      analysis.category = this.categorizeNetworkError(error);
    } else if (this.isHttpError(error)) {
      analysis.type = 'http';
      analysis.category = this.categorizeHttpError(error.status);
    } else if (this.isValidationError(error)) {
      analysis.type = 'validation';
      analysis.category = 'client';
    } else if (this.isAuthError(error)) {
      analysis.type = 'auth';
      analysis.category = 'authentication';
    } else if (this.isBusinessError(error)) {
      analysis.type = 'business';
      analysis.category = 'logic';
    }

    return analysis;
  }

  /**
   * Create user-friendly error object
   * @param {Object} errorInfo - Error analysis
   * @param {Object} context - Request context
   * @returns {Object} User-friendly error
   */
  createUserFriendlyError(errorInfo, context) {
    const baseError = {
      message: this.getUserMessage(errorInfo, context),
      type: this.getErrorSeverity(errorInfo),
      code: errorInfo.status || 'UNKNOWN_ERROR',
      canRetry: this.canRetry(errorInfo),
      actions: this.getErrorActions(errorInfo, context),
      timestamp: errorInfo.timestamp,
      requestId: errorInfo.requestId
    };

    // Add context-specific enhancements
    const contextHandler = this.getContextHandler(context.url);
    if (contextHandler) {
      return contextHandler(baseError, errorInfo, context);
    }

    return baseError;
  }

  /**
   * Get user-friendly error message
   * @param {Object} errorInfo - Error analysis
   * @param {Object} context - Request context
   * @returns {string} User message
   */
  getUserMessage(errorInfo, context) {
    // Try to get server-provided message first
    const serverMessage = this.extractServerMessage(errorInfo);
    if (serverMessage && this.isUserFriendlyMessage(serverMessage)) {
      return serverMessage;
    }

    // Use template-based message
    const template = this.getMessageTemplate(errorInfo);
    if (template) {
      return template;
    }

    // Fallback to generic message
    return this.getGenericMessage(errorInfo);
  }

  /**
   * Extract message from server response
   * @param {Object} errorInfo - Error analysis
   * @returns {string|null} Server message
   */
  extractServerMessage(errorInfo) {
    const data = errorInfo.data;
    if (!data) return null;

    // Try different message fields
    return data.message || 
           data.error || 
           data.details || 
           (data.errors && data.errors[0]?.message) ||
           null;
  }

  /**
   * Check if message is user-friendly
   * @param {string} message - Message to check
   * @returns {boolean} Whether message is user-friendly
   */
  isUserFriendlyMessage(message) {
    const technicalTerms = [
      'stack trace',
      'null pointer',
      'undefined',
      'internal error',
      'database',
      'sql',
      'mongodb',
      'redis',
      'jwt',
      'cors'
    ];

    const lowerMessage = message.toLowerCase();
    return !technicalTerms.some(term => lowerMessage.includes(term)) &&
           message.length < 200 &&
           !lowerMessage.includes('error:');
  }

  /**
   * Get message template based on error info
   * @param {Object} errorInfo - Error analysis
   * @returns {string|null} Message template
   */
  getMessageTemplate(errorInfo) {
    const { type, category, status } = errorInfo;

    if (type === 'network') {
      return this.errorMessages.network[category] || this.errorMessages.network.unknown;
    }

    if (type === 'http') {
      return this.errorMessages.http[status] || this.errorMessages.http[500];
    }

    if (type === 'auth') {
      return this.errorMessages.auth[category] || this.errorMessages.auth.token_invalid;
    }

    if (type === 'validation') {
      return this.errorMessages.validation[category] || this.errorMessages.validation.invalid_format;
    }

    if (type === 'business') {
      return this.errorMessages.business[category] || 'Business rule validation failed.';
    }

    return null;
  }

  /**
   * Get generic error message
   * @param {Object} errorInfo - Error analysis
   * @returns {string} Generic message
   */
  getGenericMessage(errorInfo) {
    if (errorInfo.status >= 500) {
      return 'Server error occurred. Please try again later.';
    }
    
    if (errorInfo.status >= 400) {
      return 'Request failed. Please check your input and try again.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Determine error severity
   * @param {Object} errorInfo - Error analysis
   * @returns {string} Error severity
   */
  getErrorSeverity(errorInfo) {
    const { type, status } = errorInfo;

    if (type === 'network') {
      return 'warning';
    }

    if (status >= 500) {
      return 'error';
    }

    if (status === 401 || status === 403) {
      return 'warning';
    }

    if (status >= 400) {
      return 'info';
    }

    return 'error';
  }

  /**
   * Determine if error can be retried
   * @param {Object} errorInfo - Error analysis
   * @returns {boolean} Whether error can be retried
   */
  canRetry(errorInfo) {
    const { type, status } = errorInfo;

    // Network errors are usually retryable
    if (type === 'network') {
      return true;
    }

    // Server errors are retryable
    if (status >= 500) {
      return true;
    }

    // Rate limiting is retryable
    if (status === 429) {
      return true;
    }

    // Client errors are generally not retryable
    if (status >= 400 && status < 500) {
      return false;
    }

    return false;
  }

  /**
   * Get suggested actions for error
   * @param {Object} errorInfo - Error analysis
   * @param {Object} context - Request context
   * @returns {Array} Suggested actions
   */
  getErrorActions(errorInfo, context) {
    const actions = [];
    const { type, status } = errorInfo;

    if (this.canRetry(errorInfo)) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        action: 'retry'
      });
    }

    if (type === 'network') {
      actions.push({
        type: 'info',
        label: 'Check Connection',
        action: 'check_connection'
      });
    }

    if (status === 401) {
      actions.push({
        type: 'auth',
        label: 'Log In',
        action: 'login'
      });
    }

    if (status === 403) {
      actions.push({
        type: 'info',
        label: 'Contact Support',
        action: 'contact_support'
      });
    }

    if (type === 'validation') {
      actions.push({
        type: 'info',
        label: 'Check Input',
        action: 'validate_input'
      });
    }

    return actions;
  }

  // Error type detection methods
  isNetworkError(error) {
    return error.name === 'NetworkError' ||
           error.message?.includes('Network') ||
           error.message?.includes('fetch') ||
           error.message?.includes('timeout') ||
           error.message?.includes('offline') ||
           !error.status;
  }

  isHttpError(error) {
    return error.status && error.status >= 400;
  }

  isValidationError(error) {
    return error.status === 422 ||
           error.code === 'VALIDATION_ERROR' ||
           (error.data && error.data.errors);
  }

  isAuthError(error) {
    return error.status === 401 ||
           error.status === 403 ||
           error.code?.includes('AUTH') ||
           error.code?.includes('TOKEN');
  }

  isBusinessError(error) {
    return error.code?.includes('BUSINESS') ||
           error.code?.includes('RULE') ||
           (error.data && error.data.businessRule);
  }

  // Error categorization methods
  categorizeNetworkError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('offline')) return 'offline';
    if (message.includes('dns')) return 'dns';
    if (message.includes('connection')) return 'connection';
    
    return 'unknown';
  }

  categorizeHttpError(status) {
    if (status >= 500) return 'server';
    if (status === 429) return 'rate_limit';
    if (status === 401 || status === 403) return 'auth';
    if (status === 422) return 'validation';
    if (status >= 400) return 'client';
    
    return 'unknown';
  }

  // Context-specific error handlers
  getContextHandler(url) {
    if (!url) return null;
    
    for (const [pattern, handler] of Object.entries(this.contextHandlers)) {
      if (url.includes(pattern)) {
        return handler;
      }
    }
    
    return null;
  }

  handleAuthError(baseError, errorInfo, context) {
    // Add auth-specific enhancements
    if (errorInfo.status === 401) {
      baseError.actions.unshift({
        type: 'auth',
        label: 'Log In Again',
        action: 'force_login'
      });
    }

    return baseError;
  }

  handleProductError(baseError, errorInfo, context) {
    // Add product-specific enhancements
    if (errorInfo.status === 404) {
      baseError.message = 'Product not found or no longer available.';
      baseError.actions.push({
        type: 'navigation',
        label: 'Browse Products',
        action: 'browse_products'
      });
    }

    return baseError;
  }

  handleOrderError(baseError, errorInfo, context) {
    // Add order-specific enhancements
    if (errorInfo.status === 404) {
      baseError.message = 'Order not found. Please check your order number.';
    }

    return baseError;
  }

  handleAdminError(baseError, errorInfo, context) {
    // Add admin-specific enhancements
    if (errorInfo.status === 403) {
      baseError.message = 'Admin access required. Please contact your administrator.';
    }

    return baseError;
  }

  handleUserError(baseError, errorInfo, context) {
    // Add user-specific enhancements
    return baseError;
  }

  handleUploadError(baseError, errorInfo, context) {
    // Add upload-specific enhancements
    if (errorInfo.status === 413) {
      baseError.message = 'File is too large. Please choose a smaller file.';
    }

    return baseError;
  }

  /**
   * Log error for debugging
   * @param {Error} originalError - Original error
   * @param {Object} context - Request context
   * @param {Object} errorInfo - Error analysis
   */
  logError(originalError, context, errorInfo) {
    if (!this.config.enableLogging) return;

    const logData = {
      timestamp: errorInfo.timestamp,
      type: errorInfo.type,
      category: errorInfo.category,
      status: errorInfo.status,
      message: errorInfo.message,
      url: context.url,
      method: context.method,
      requestId: context.requestId
    };

    if (this.config.includeStackTrace && originalError.stack) {
      logData.stack = originalError.stack;
    }

    if (this.config.logLevel === 'debug') {
      logData.originalError = originalError;
      logData.context = context;
    }

    console.error('🚨 API Error:', logData);
  }
}

// Create and export singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;

// Export class for custom instances
export { ErrorHandler };