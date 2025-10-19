import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { AppError } from './errorHandler.js';
import logger from '../utils/logger.js';

// CORS configuration with enhanced security
export const corsOptions = {
  origin: (origin, callback) => {
    // In production, only allow CLIENT_URL
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
      
      // Don't allow requests with no origin in production
      if (!origin) {
        logger.warn('CORS blocked request with no origin in production', { 
          userAgent: 'Unknown',
          timestamp: new Date().toISOString()
        });
        return callback(new AppError('Origin required in production', 403, 'CORS_NO_ORIGIN'));
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request in production', { 
          origin,
          allowedOrigins,
          timestamp: new Date().toISOString()
        });
        callback(new AppError('Not allowed by CORS policy', 403, 'CORS_ERROR'));
      }
    } else {
      // Development mode - allow common development ports
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:4173'
      ].filter(Boolean);

      // Allow requests with no origin in development (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request in development', { 
          origin,
          allowedOrigins
        });
        callback(new AppError('Not allowed by CORS', 403, 'CORS_ERROR'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
  maxAge: process.env.NODE_ENV === 'production' ? 86400 : 300, // 24 hours in prod, 5 minutes in dev
  optionsSuccessStatus: 200 // For legacy browser support
};

// Enhanced Helmet security configuration
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Required for some UI frameworks
        'https://fonts.googleapis.com'
      ],
      fontSrc: [
        "'self'", 
        'https://fonts.gstatic.com'
      ],
      imgSrc: [
        "'self'", 
        'data:', 
        'https:', 
        process.env.NODE_ENV === 'development' ? 'http:' : null
      ].filter(Boolean),
      scriptSrc: [
        "'self'",
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : null // For dev tools
      ].filter(Boolean),
      connectSrc: [
        "'self'", 
        'https://api.stripe.com',
        process.env.CLIENT_URL
      ].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false, // May break some integrations
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
};

// Request ID middleware
export const requestId = (req, res, next) => {
  req.requestId = req.get('X-Request-ID') || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Request-ID', req.requestId);
  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) return next();

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP blocked', { ip: clientIP, endpoint: req.originalUrl });
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
        code: 'IP_BLOCKED'
      });
    }
    
    next();
  };
};

// User agent validation
export const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    logger.warn('Request without User-Agent', { ip: req.ip });
    return res.status(400).json({
      success: false,
      message: 'User-Agent header is required',
      code: 'MISSING_USER_AGENT'
    });
  }

  // Block known bad user agents
  const blockedAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  // Allow legitimate bots (Google, Bing, etc.) but block others
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i
  ];

  const isBlockedAgent = blockedAgents.some(pattern => pattern.test(userAgent));
  const isLegitimateBot = legitimateBots.some(pattern => pattern.test(userAgent));

  if (isBlockedAgent && !isLegitimateBot) {
    logger.warn('Blocked user agent', { userAgent, ip: req.ip });
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      code: 'BLOCKED_USER_AGENT'
    });
  }

  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSizeBytes = typeof maxSize === 'string' 
      ? parseInt(maxSize) * (maxSize.includes('mb') ? 1024 * 1024 : 1024)
      : maxSize;

    if (contentLength > maxSizeBytes) {
      logger.warn('Request too large', { 
        contentLength, 
        maxSize: maxSizeBytes,
        ip: req.ip 
      });
      
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE'
      });
    }

    next();
  };
};

// Honeypot middleware (trap for bots)
export const honeypot = (req, res, next) => {
  // Check for honeypot field in form data
  if (req.body && req.body.website) {
    logger.warn('Honeypot triggered', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent'),
      honeypotValue: req.body.website
    });
    
    // Silently reject (don't give away that it's a honeypot)
    return res.status(400).json({
      success: false,
      message: 'Invalid request',
      code: 'INVALID_REQUEST'
    });
  }

  next();
};

// Suspicious activity detector
export const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    // SQL injection attempts
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS attempts
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // Path traversal attempts
    /\.\.[\/\\]/,
    // Command injection attempts
    /[;&|`$(){}[\]]/
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  const suspicious = [
    ...Object.values(req.query || {}),
    ...Object.values(req.body || {}),
    ...Object.values(req.params || {})
  ].some(checkValue);

  if (suspicious) {
    logger.warn('Suspicious activity detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      query: req.query,
      body: req.body,
      params: req.params
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid request detected',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }

  next();
};

// API key validation (for external integrations)
export const validateApiKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
      code: 'API_KEY_REQUIRED'
    });
  }

  // Validate API key (this would typically check against a database)
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key', { apiKey: apiKey.substring(0, 8) + '...', ip: req.ip });
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

// Maintenance mode middleware
export const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Allow admin access during maintenance
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable for maintenance',
      code: 'MAINTENANCE_MODE'
    });
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  next();
};

export default {
  corsOptions,
  helmetConfig,
  requestId,
  ipWhitelist,
  validateUserAgent,
  requestSizeLimiter,
  honeypot,
  suspiciousActivityDetector,
  validateApiKey,
  maintenanceMode,
  securityHeaders
};