import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import enhancedLogger from '../utils/enhancedLogger.js';
import securityMonitor from '../utils/securityMonitor.js';

/**
 * Enhanced Input Validation and Sanitization Middleware
 * Provides comprehensive security validation for all user inputs
 */

/**
 * Advanced validation result handler with security logging
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: typeof error.value === 'string' ? error.value.substring(0, 100) : error.value,
      location: error.location
    }));

    // Log validation failures for security monitoring
    enhancedLogger.security('Input validation failed', {
      endpoint: req.originalUrl,
      method: req.method,
      errors: errorDetails,
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    });

    // Track repeated validation failures (potential attack)
    const identifier = req.user?._id || req.ip;
    securityMonitor.trackValidationFailure(identifier, {
      endpoint: req.originalUrl,
      errorCount: errorDetails.length,
      errors: errorDetails
    });

    return res.status(400).json({
      success: false,
      message: 'Input validation failed',
      code: 'VALIDATION_ERROR',
      errors: errorDetails
    });
  }
  
  next();
};

/**
 * Advanced XSS protection and HTML sanitization
 */
export const sanitizeHTML = (fieldName, options = {}) => {
  const { allowedTags = [], allowedAttributes = {} } = options;
  
  return body(fieldName).customSanitizer((value) => {
    if (typeof value !== 'string') return value;
    
    // Use DOMPurify for comprehensive XSS protection
    const cleanHTML = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: Object.keys(allowedAttributes),
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false
    });
    
    return cleanHTML;
  });
};

/**
 * SQL injection pattern detection
 */
export const detectSQLInjection = (fieldName) => {
  return body(fieldName).custom((value, { req }) => {
    if (typeof value !== 'string') return true;
    
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|declare|cast|convert)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(or|and)\b\s+\b\d+\s*=\s*\d+)/i,
      /('|(\\')|(;)|(\\;))/,
      /(\b(information_schema|sysobjects|syscolumns)\b)/i
    ];
    
    const suspiciousPattern = sqlPatterns.find(pattern => pattern.test(value));
    if (suspiciousPattern) {
      // Log SQL injection attempt
      enhancedLogger.security('SQL injection attempt detected', {
        field: fieldName,
        pattern: suspiciousPattern.toString(),
        value: value.substring(0, 100),
        userId: req.user?._id,
        ip: req.ip,
        endpoint: req.originalUrl,
        requestId: req.id
      });
      
      // Track SQL injection attempt
      const identifier = req.user?._id || req.ip;
      securityMonitor.trackSQLInjectionAttempt(identifier, {
        endpoint: req.originalUrl,
        field: fieldName,
        pattern: suspiciousPattern.toString()
      });
      
      throw new Error('Invalid input detected');
    }
    
    return true;
  });
};

/**
 * NoSQL injection pattern detection
 */
export const detectNoSQLInjection = (fieldName) => {
  return body(fieldName).custom((value, { req }) => {
    // Check for MongoDB injection patterns
    if (typeof value === 'object' && value !== null) {
      const jsonString = JSON.stringify(value);
      const nosqlPatterns = [
        /\\$where/i,
        /\\$regex/i,
        /\\$ne/i,
        /\\$gt/i,
        /\\$lt/i,
        /\\$in/i,
        /\\$nin/i,
        /\\$exists/i,
        /\\$or/i,
        /\\$and/i
      ];
      
      const suspiciousPattern = nosqlPatterns.find(pattern => pattern.test(jsonString));
      if (suspiciousPattern) {
        enhancedLogger.security('NoSQL injection attempt detected', {
          field: fieldName,
          pattern: suspiciousPattern.toString(),
          value: jsonString.substring(0, 100),
          userId: req.user?._id,
          ip: req.ip,
          endpoint: req.originalUrl,
          requestId: req.id
        });
        
        throw new Error('Invalid input detected');
      }
    }
    
    return true;
  });
};

/**
 * Command injection detection
 */
export const detectCommandInjection = (fieldName, excludeFields = []) => {
  return body(fieldName).custom((value, { req }) => {
    if (typeof value !== 'string') return true;
    
    // Skip validation for password fields and other sensitive fields
    if (excludeFields.includes(fieldName)) return true;
    
    const commandPatterns = [
      /[;&|`${}\\[\\]]/,
      /(\\n|\\r)/,
      /(\\.\\.\\/|\\.\\.\\\\/)/,
      /(\\x[0-9a-f]{2})/i,
      /(eval\\s*\\(|exec\\s*\\(|system\\s*\\()/i
    ];
    
    const suspiciousPattern = commandPatterns.find(pattern => pattern.test(value));
    if (suspiciousPattern) {
      enhancedLogger.security('Command injection attempt detected', {
        field: fieldName,
        pattern: suspiciousPattern.toString(),
        value: value.substring(0, 100),
        userId: req.user?._id,
        ip: req.ip,
        endpoint: req.originalUrl,
        requestId: req.id
      });
      
      throw new Error('Invalid input detected');
    }
    
    return true;
  });
};

/**
 * Path traversal detection
 */
export const detectPathTraversal = (fieldName) => {
  return body(fieldName).custom((value, { req }) => {
    if (typeof value !== 'string') return true;
    
    const pathTraversalPatterns = [
      /\\.\\.\\/|\\.\\.\\\\/,
      /%2e%2e%2f|%2e%2e%5c/i,
      /\\x2e\\x2e\\x2f|\\x2e\\x2e\\x5c/i,
      /\\/etc\\/passwd|\\/windows\\/system32/i
    ];
    
    const suspiciousPattern = pathTraversalPatterns.find(pattern => pattern.test(value));
    if (suspiciousPattern) {
      enhancedLogger.security('Path traversal attempt detected', {
        field: fieldName,
        pattern: suspiciousPattern.toString(),
        value: value.substring(0, 100),
        userId: req.user?._id,
        ip: req.ip,
        endpoint: req.originalUrl,
        requestId: req.id
      });
      
      throw new Error('Invalid path detected');
    }
    
    return true;
  });
};

/**
 * Enhanced email validation with security checks
 */
export const secureEmailValidation = (fieldName = 'email') => {
  return [
    body(fieldName)
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail({
        gmail_lowercase: true,
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_lowercase: true,
        yahoo_lowercase: true,
        icloud_lowercase: true
      }),
    
    // Check for suspicious email patterns
    body(fieldName).custom((value, { req }) => {
      const suspiciousPatterns = [
        /[<>\"']/,  // HTML/script injection in email
        /javascript:/i,
        /data:/i,
        /vbscript:/i
      ];
      
      const suspiciousPattern = suspiciousPatterns.find(pattern => pattern.test(value));
      if (suspiciousPattern) {
        enhancedLogger.security('Suspicious email pattern detected', {
          email: value,
          pattern: suspiciousPattern.toString(),
          userId: req.user?._id,
          ip: req.ip,
          requestId: req.id
        });
        
        throw new Error('Invalid email format');
      }
      
      return true;
    })
  ];
};

/**
 * Enhanced password validation with security requirements
 */
export const securePasswordValidation = (fieldName = 'password', options = {}) => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    preventCommonPasswords = true
  } = options;
  
  return [
    body(fieldName)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`Password must be between ${minLength} and ${maxLength} characters`),
    
    body(fieldName).custom((value, { req }) => {
      const errors = [];
      
      if (requireUppercase && !/[A-Z]/.test(value)) {
        errors.push('at least one uppercase letter');
      }
      
      if (requireLowercase && !/[a-z]/.test(value)) {
        errors.push('at least one lowercase letter');
      }
      
      if (requireNumbers && !/\\d/.test(value)) {
        errors.push('at least one number');
      }
      
      if (requireSpecialChars && !/[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]/.test(value)) {
        errors.push('at least one special character');
      }
      
      // Check for common weak passwords
      if (preventCommonPasswords) {
        const commonPasswords = [
          'password', '123456', '123456789', 'qwerty', 'abc123',
          'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        
        if (commonPasswords.includes(value.toLowerCase())) {
          errors.push('a stronger password (avoid common passwords)');
        }
      }
      
      // Check for personal information in password (if user data available)
      if (req.body.email && value.toLowerCase().includes(req.body.email.split('@')[0].toLowerCase())) {
        errors.push('a password that doesn\\'t contain your email');
      }
      
      if (errors.length > 0) {
        throw new Error(`Password must contain ${errors.join(', ')}`);
      }
      
      return true;
    })
  ];
};

/**
 * File upload validation with security checks
 */
export const secureFileValidation = (fieldName, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'],
    scanForMalware = true
  } = options;
  
  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next();
    }
    
    const files = Array.isArray(req.files[fieldName]) 
      ? req.files[fieldName] 
      : [req.files[fieldName]];
    
    for (const file of files) {
      // Size validation
      if (file.size > maxSize) {
        enhancedLogger.security('File upload size violation', {
          filename: file.name,
          size: file.size,
          maxSize,
          userId: req.user?._id,
          ip: req.ip,
          requestId: req.id
        });
        
        return res.status(400).json({
          success: false,
          message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }
      
      // MIME type validation
      if (!allowedMimeTypes.includes(file.mimetype)) {
        enhancedLogger.security('File upload MIME type violation', {
          filename: file.name,
          mimetype: file.mimetype,
          allowedTypes: allowedMimeTypes,
          userId: req.user?._id,
          ip: req.ip,
          requestId: req.id
        });
        
        return res.status(400).json({
          success: false,
          message: `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        });
      }
      
      // Extension validation
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        enhancedLogger.security('File upload extension violation', {
          filename: file.name,
          extension: fileExtension,
          allowedExtensions,
          userId: req.user?._id,
          ip: req.ip,
          requestId: req.id
        });
        
        return res.status(400).json({
          success: false,
          message: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
          code: 'INVALID_FILE_EXTENSION'
        });
      }
      
      // Basic malware detection (check for suspicious file signatures)
      if (scanForMalware) {
        const suspiciousSignatures = [
          Buffer.from('4D5A', 'hex'), // PE executable
          Buffer.from('7F454C46', 'hex'), // ELF executable
          Buffer.from('504B0304', 'hex'), // ZIP file (could contain malware)
        ];
        
        const fileBuffer = file.data || Buffer.from([]);
        const isSuspicious = suspiciousSignatures.some(signature => 
          fileBuffer.indexOf(signature) === 0
        );
        
        if (isSuspicious) {
          enhancedLogger.security('Suspicious file upload detected', {
            filename: file.name,
            mimetype: file.mimetype,
            size: file.size,
            userId: req.user?._id,
            ip: req.ip,
            requestId: req.id
          });
          
          return res.status(400).json({
            success: false,
            message: 'File appears to contain suspicious content',
            code: 'SUSPICIOUS_FILE_CONTENT'
          });
        }
      }
    }
    
    next();
  };
};

/**
 * Rate limiting for validation failures
 */
export const validationRateLimit = (req, res, next) => {
  const identifier = req.user?._id || req.ip;
  const failures = securityMonitor.getValidationFailures(identifier);
  
  if (failures && failures.count > 10) { // More than 10 validation failures in window
    enhancedLogger.security('Validation failure rate limit exceeded', {
      identifier,
      failureCount: failures.count,
      userId: req.user?._id,
      ip: req.ip,
      endpoint: req.originalUrl,
      requestId: req.id
    });
    
    return res.status(429).json({
      success: false,
      message: 'Too many validation errors. Please try again later.',
      code: 'VALIDATION_RATE_LIMIT_EXCEEDED'
    });
  }
  
  next();
};

export default {
  handleValidationErrors,
  sanitizeHTML,
  detectSQLInjection,
  detectNoSQLInjection,
  detectCommandInjection,
  detectPathTraversal,
  secureEmailValidation,
  securePasswordValidation,
  secureFileValidation,
  validationRateLimit
};