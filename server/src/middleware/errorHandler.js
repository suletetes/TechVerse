import logger from '../utils/logger.js';

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found middleware
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Main error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.code = err.code;

  // Log error details
  const errorDetails = {
    message: err.message,
    statusCode: error.statusCode,
    code: error.code,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    body: req.body,
    params: req.params,
    query: req.query
  };

  // Log based on severity
  if (error.statusCode >= 500) {
    logger.error('Server Error', errorDetails);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorDetails);
  } else {
    logger.info('Request Error', errorDetails);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400, 'INVALID_ID');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new AppError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    
    const message = 'Validation failed';
    error = new AppError(message, 400, 'VALIDATION_ERROR');
    error.errors = errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = new AppError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token has expired';
    error = new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new AppError(message, 400, 'FILE_TOO_LARGE');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files uploaded';
    error = new AppError(message, 400, 'TOO_MANY_FILES');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400, 'UNEXPECTED_FILE');
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    let message = 'Payment processing error';
    let code = 'PAYMENT_ERROR';
    
    switch (err.type) {
      case 'StripeCardError':
        message = err.message || 'Your card was declined';
        code = 'CARD_DECLINED';
        break;
      case 'StripeRateLimitError':
        message = 'Too many requests to payment processor';
        code = 'PAYMENT_RATE_LIMIT';
        break;
      case 'StripeInvalidRequestError':
        message = 'Invalid payment request';
        code = 'INVALID_PAYMENT_REQUEST';
        break;
      case 'StripeAPIError':
        message = 'Payment service temporarily unavailable';
        code = 'PAYMENT_SERVICE_ERROR';
        break;
      case 'StripeConnectionError':
        message = 'Network error with payment processor';
        code = 'PAYMENT_NETWORK_ERROR';
        break;
      case 'StripeAuthenticationError':
        message = 'Payment authentication error';
        code = 'PAYMENT_AUTH_ERROR';
        break;
    }
    
    error = new AppError(message, 400, code);
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    const message = 'Database connection error';
    error = new AppError(message, 503, 'DATABASE_ERROR');
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    const message = 'Cross-origin request blocked';
    error = new AppError(message, 403, 'CORS_ERROR');
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const code = error.code || 'INTERNAL_ERROR';

  // Prepare response - never expose sensitive information in production
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 
      ? 'Internal Server Error' // Generic message for server errors in production
      : message,
    code,
    ...(error.errors && { errors: error.errors }),
    // Only include debug information in development
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: {
        name: err.name,
        message: err.message,
        code: err.code
      }
    })
  };

  // Add request ID for tracking (safe to expose)
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  // Add timestamp for production debugging (safe to expose)
  if (process.env.NODE_ENV === 'production') {
    response.timestamp = new Date().toISOString();
  }

  // Send error response
  res.status(statusCode).json(response);
};

// Handle unhandled promise rejections (only in production)
if (process.env.NODE_ENV === 'production') {
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection', {
      error: err.message,
      stack: err.stack,
      promise
    });
    
    // Close server & exit process
    process.exit(1);
  });

  // Handle uncaught exceptions (only in production)
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
      error: err.message,
      stack: err.stack
    });
    
    // Close server & exit process
    process.exit(1);
  });
}

export { errorHandler as default, AppError, asyncHandler, notFound };