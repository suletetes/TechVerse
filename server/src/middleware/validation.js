import { validationResult, body, param, query } from 'express-validator';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Main validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    // Enhanced debugging
    console.log('=== VALIDATION FAILED DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Validation errors:', errorMessages);
    console.log('Raw errors:', errors.array());
    console.log('==============================');
    
    logger.warn('Validation failed', {
      endpoint: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      requestBody: req.body,
      userId: req.user?._id
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      code: 'VALIDATION_ERROR',
      errors: errorMessages
    });
  }
  
  next();
};

// Common validation rules
export const commonValidations = {
  // MongoDB ObjectId validation
  mongoId: (fieldName = 'id') => 
    param(fieldName)
      .isMongoId()
      .withMessage(`Invalid ${fieldName} format`),

  // Email validation
  email: (fieldName = 'email', required = true) => {
    const validator = body(fieldName)
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address');
    
    return required ? validator.notEmpty() : validator.optional();
  },

  // Password validation
  password: (fieldName = 'password', minLength = 6) =>
    body(fieldName)
      .isLength({ min: minLength })
      .withMessage(`Password must be at least ${minLength} characters long`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  // Name validation
  name: (fieldName, minLength = 2, maxLength = 50) =>
    body(fieldName)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`),

  // Phone validation
  phone: (fieldName = 'phone', required = false) => {
    const validator = body(fieldName)
      .isMobilePhone()
      .withMessage('Please provide a valid phone number');
    
    return required ? validator.notEmpty() : validator.optional();
  },

  // UK Postcode validation
  postcode: (fieldName = 'postcode') =>
    body(fieldName)
      .matches(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i)
      .withMessage('Please provide a valid UK postcode'),

  // Price validation
  price: (fieldName = 'price', min = 0) =>
    body(fieldName)
      .isFloat({ min })
      .withMessage(`${fieldName} must be a number greater than or equal to ${min}`)
      .toFloat(),

  // Quantity validation
  quantity: (fieldName = 'quantity', min = 1, max = 99) =>
    body(fieldName)
      .isInt({ min, max })
      .withMessage(`${fieldName} must be between ${min} and ${max}`)
      .toInt(),

  // Rating validation
  rating: (fieldName = 'rating') =>
    body(fieldName)
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5')
      .toInt(),

  // Text validation
  text: (fieldName, minLength = 1, maxLength = 1000) =>
    body(fieldName)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`),

  // URL validation
  url: (fieldName, required = false) => {
    const validator = body(fieldName)
      .isURL()
      .withMessage(`${fieldName} must be a valid URL`);
    
    return required ? validator.notEmpty() : validator.optional();
  },

  // Date validation
  date: (fieldName, required = false) => {
    const validator = body(fieldName)
      .isISO8601()
      .withMessage(`${fieldName} must be a valid date`)
      .toDate();
    
    return required ? validator.notEmpty() : validator.optional();
  },

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt()
  ],

  // Sort validation
  sort: (allowedFields = []) =>
    query('sort')
      .optional()
      .isIn(allowedFields)
      .withMessage(`Sort must be one of: ${allowedFields.join(', ')}`),

  // Array validation
  array: (fieldName, itemValidator, minLength = 0, maxLength = 100) =>
    body(fieldName)
      .isArray({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be an array with ${minLength}-${maxLength} items`)
      .custom((value) => {
        // Additional validation for array items can be added here
        return true;
      })
};

// Specific validation sets for different endpoints
export const validationSets = {
  // User registration
  userRegistration: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email('email', true),
    commonValidations.password('password'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    commonValidations.phone('phone', false)
  ],

  // User login
  userLogin: [
    commonValidations.email('email', true),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Password change
  passwordChange: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password('newPassword'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],

  // Product creation/update
  product: [
    commonValidations.text('name', 2, 200),
    commonValidations.text('description', 10, 2000),
    commonValidations.price('price', 0),
    commonValidations.mongoId('category'),
    body('brand')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Brand must be between 2 and 100 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('features')
      .optional()
      .isArray()
      .withMessage('Features must be an array')
  ],

  // Order creation
  order: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.product')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('Quantity must be between 1 and 99'),
    body('shippingAddress.firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name is required'),
    body('shippingAddress.lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name is required'),
    body('shippingAddress.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address is required'),
    body('shippingAddress.city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City is required'),
    commonValidations.postcode('shippingAddress.postcode')
  ],

  // Review creation
  review: [
    commonValidations.mongoId('product'),
    commonValidations.rating('rating'),
    commonValidations.text('title', 5, 100),
    commonValidations.text('comment', 10, 1000),
    body('pros')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 pros allowed'),
    body('cons')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 cons allowed')
  ],

  // Category creation/update
  category: [
    commonValidations.text('name', 2, 100),
    commonValidations.text('description', 0, 500),
    body('parent')
      .optional()
      .isMongoId()
      .withMessage('Invalid parent category ID'),
    body('displayOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Display order must be a non-negative integer')
  ],

  // Address validation
  address: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    body('address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be between 5 and 200 characters'),
    body('city')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be between 2 and 100 characters'),
    commonValidations.postcode('postcode'),
    body('type')
      .optional()
      .isIn(['home', 'work', 'other'])
      .withMessage('Address type must be home, work, or other')
  ]
};

// Custom validation for file uploads
export const validateFileUpload = (fieldName, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 1
  } = options;

  return (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      if (options.required) {
        return res.status(400).json({
          success: false,
          message: `${fieldName} is required`,
          code: 'FILE_REQUIRED'
        });
      }
      return next();
    }

    const files = Array.isArray(req.files[fieldName]) 
      ? req.files[fieldName] 
      : [req.files[fieldName]];

    if (files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} file(s) allowed`,
        code: 'TOO_MANY_FILES'
      });
    }

    for (const file of files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type must be one of: ${allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        });
      }
    }

    next();
  };
};

// Sanitize input middleware
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);

  next();
};

export default {
  validate,
  commonValidations,
  validationSets,
  validateFileUpload,
  sanitizeInput
};