/**
 * Enhanced CORS Handler with Error Detection and User-Friendly Messaging
 */

import cors from 'cors';
import { corsOptions } from './security.js';
import logger from '../utils/logger.js';
import config from '../config/environment.js';

// CORS error detection middleware
export const corsErrorDetector = (req, res, next) => {
  const origin = req.get('Origin');
  const method = req.method;
  
  // Check if this is a CORS preflight request
  if (method === 'OPTIONS') {
    const requestMethod = req.get('Access-Control-Request-Method');
    const requestHeaders = req.get('Access-Control-Request-Headers');
    
    logger.info('CORS preflight request detected', {
      origin,
      requestMethod,
      requestHeaders,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId
    });
  }
  
  // Store original end function to intercept CORS errors
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Check if this was a CORS error
    if (res.statusCode === 403 && res.get('Access-Control-Allow-Origin') === undefined) {
      logger.warn('Potential CORS error detected', {
        statusCode: res.statusCode,
        origin,
        method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
      });
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Enhanced CORS middleware with better error handling
export const enhancedCors = cors({
  ...corsOptions,
  origin: (origin, callback) => {
    const allowedOrigins = config.CORS_ORIGINS || [];
    
    // Custom origin validation with detailed logging
    if (config.ENVIRONMENT === 'production') {
      if (!origin) {
        logger.error('CORS: No origin header in production request', {
          timestamp: new Date().toISOString(),
          environment: config.ENVIRONMENT
        });
        return callback({
          message: 'Origin header is required',
          statusCode: 403,
          code: 'CORS_NO_ORIGIN',
          userFriendly: 'Access denied: Origin verification failed'
        });
      }

      if (!allowedOrigins.includes(origin)) {
        logger.error('CORS: Origin not allowed in production', {
          origin,
          allowedOrigins,
          timestamp: new Date().toISOString()
        });
        return callback({
          message: `Origin ${origin} not allowed by CORS policy`,
          statusCode: 403,
          code: 'CORS_ORIGIN_NOT_ALLOWED',
          userFriendly: 'Access denied: Your domain is not authorized to access this API'
        });
      }
    } else {
      // Development/Staging with helpful messages
      if (origin && !allowedOrigins.includes(origin)) {
        logger.warn(`CORS: Origin not in allowed list (${config.ENVIRONMENT})`, {
          origin,
          allowedOrigins,
          environment: config.ENVIRONMENT
        });
        
        if (config.ENVIRONMENT === 'development') {
          // Provide helpful development message
          return callback({
            message: `Origin ${origin} not in CORS allowed list`,
            statusCode: 403,
            code: 'CORS_ORIGIN_NOT_ALLOWED',
            userFriendly: `Development CORS Error: Add "${origin}" to your CORS_ORIGINS environment variable`,
            suggestion: `Set CORS_ORIGINS="${allowedOrigins.concat(origin).join(',')}" in your .env file`
          });
        }
      }
    }
    
    // Origin is allowed
    callback(null, true);
  }
});

// CORS error response middleware
export const corsErrorHandler = (err, req, res, next) => {
  // Check if this is a CORS-related error
  if (err && (
    (typeof err.code === 'string' && err.code.startsWith('CORS_')) || 
    (typeof err.message === 'string' && err.message.includes('CORS'))
  )) {
    const corsError = {
      success: false,
      error: 'CORS_ERROR',
      message: err.userFriendly || err.message || 'Cross-Origin Request Blocked',
      code: err.code || 'CORS_ERROR',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    // Add helpful information for development
    if (config.ENVIRONMENT === 'development' && err.suggestion) {
      corsError.suggestion = err.suggestion;
      corsError.allowedOrigins = config.CORS_ORIGINS;
    }
    
    // Log the error
    logger.error('CORS Error Response', {
      error: corsError,
      origin: req.get('Origin'),
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(err.statusCode || 403).json(corsError);
  }
  
  // Not a CORS error, pass to next error handler
  next(err);
};

// Preflight optimization middleware
export const preflightOptimization = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Add caching headers for preflight requests
    const maxAge = config.ENVIRONMENT === 'production' ? 86400 : 
                   config.ENVIRONMENT === 'staging' ? 3600 : 300;
    
    res.set({
      'Access-Control-Max-Age': maxAge.toString(),
      'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
    });
    
    // Log preflight request for monitoring
    logger.debug('CORS preflight request processed', {
      origin: req.get('Origin'),
      requestMethod: req.get('Access-Control-Request-Method'),
      requestHeaders: req.get('Access-Control-Request-Headers'),
      maxAge,
      requestId: req.requestId
    });
  }
  
  next();
};

// CORS health check endpoint
export const corsHealthCheck = (req, res) => {
  const origin = req.get('Origin');
  const allowedOrigins = config.CORS_ORIGINS || [];
  
  const healthInfo = {
    success: true,
    cors: {
      environment: config.ENVIRONMENT,
      origin: origin || 'No origin header',
      isOriginAllowed: origin ? allowedOrigins.includes(origin) : 'N/A',
      allowedOrigins: config.ENVIRONMENT === 'development' ? allowedOrigins : allowedOrigins.length,
      corsEnabled: config.ENABLE_CORS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      maxAge: config.ENVIRONMENT === 'production' ? 86400 : 
              config.ENVIRONMENT === 'staging' ? 3600 : 300
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };
  
  res.json(healthInfo);
};

export default {
  corsErrorDetector,
  enhancedCors,
  corsErrorHandler,
  preflightOptimization,
  corsHealthCheck
};