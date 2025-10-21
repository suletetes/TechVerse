// Enhanced Validation Utilities
// Consolidates and enhances validation functions from multiple files

import { VALIDATION_PATTERNS, ERROR_CODES } from '../constants/index.js';

// Base validation result structure
const createValidationResult = (isValid, message = '', code = null, data = null) => ({
  isValid,
  message,
  code,
  data
});

// Email validation with enhanced checks
export const validateEmail = (email, options = {}) => {
  const { required = true, allowEmpty = false } = options;
  
  if (!email || email.trim() === '') {
    if (required && !allowEmpty) {
      return createValidationResult(false, 'Email is required', ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmedEmail)) {
    return createValidationResult(false, 'Please enter a valid email address', ERROR_CODES.INVALID_FORMAT);
  }
  
  // Additional email checks
  if (trimmedEmail.length > 254) {
    return createValidationResult(false, 'Email address is too long', ERROR_CODES.VALIDATION_ERROR);
  }
  
  const [localPart, domain] = trimmedEmail.split('@');
  if (localPart.length > 64) {
    return createValidationResult(false, 'Email local part is too long', ERROR_CODES.VALIDATION_ERROR);
  }
  
  return createValidationResult(true, '', null, { normalizedEmail: trimmedEmail });
};

// Password validation with strength checking
export const validatePassword = (password, options = {}) => {
  const { 
    minLength = 6, 
    requireStrong = false, 
    required = true,
    allowEmpty = false 
  } = options;
  
  if (!password) {
    if (required && !allowEmpty) {
      return createValidationResult(false, 'Password is required', ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  if (password.length < minLength) {
    return createValidationResult(
      false, 
      `Password must be at least ${minLength} characters long`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  const pattern = requireStrong ? VALIDATION_PATTERNS.STRONG_PASSWORD : VALIDATION_PATTERNS.PASSWORD;
  
  if (!pattern.test(password)) {
    const message = requireStrong 
      ? 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      : 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    
    return createValidationResult(false, message, ERROR_CODES.VALIDATION_ERROR);
  }
  
  // Calculate password strength
  const strength = calculatePasswordStrength(password);
  
  return createValidationResult(true, '', null, { strength });
};

// Phone number validation with international support
export const validatePhone = (phone, options = {}) => {
  const { required = true, allowEmpty = false, country = 'international' } = options;
  
  if (!phone || phone.trim() === '') {
    if (required && !allowEmpty) {
      return createValidationResult(false, 'Phone number is required', ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  const cleanedPhone = phone.replace(/\s/g, '');
  
  if (!VALIDATION_PATTERNS.PHONE.test(cleanedPhone)) {
    return createValidationResult(false, 'Please enter a valid phone number', ERROR_CODES.INVALID_FORMAT);
  }
  
  return createValidationResult(true, '', null, { cleanedPhone });
};

// Required field validation
export const validateRequired = (value, fieldName = 'Field', options = {}) => {
  const { allowZero = false, allowFalse = false } = options;
  
  if (value === null || value === undefined) {
    return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
  }
  
  if (typeof value === 'number' && value === 0 && !allowZero) {
    return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
  }
  
  if (typeof value === 'boolean' && value === false && !allowFalse) {
    return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
  }
  
  return createValidationResult(true);
};

// Length validation
export const validateLength = (value, options = {}) => {
  const { 
    minLength, 
    maxLength, 
    fieldName = 'Field',
    required = true,
    allowEmpty = false 
  } = options;
  
  if (!value || value.length === 0) {
    if (required && !allowEmpty) {
      return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  const length = typeof value === 'string' ? value.length : value?.length || 0;
  
  if (minLength !== undefined && length < minLength) {
    return createValidationResult(
      false, 
      `${fieldName} must be at least ${minLength} characters long`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  if (maxLength !== undefined && length > maxLength) {
    return createValidationResult(
      false, 
      `${fieldName} cannot exceed ${maxLength} characters`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  return createValidationResult(true, '', null, { length });
};

// URL validation
export const validateUrl = (url, options = {}) => {
  const { required = true, allowEmpty = false, protocols = ['http', 'https'] } = options;
  
  if (!url || url.trim() === '') {
    if (required && !allowEmpty) {
      return createValidationResult(false, 'URL is required', ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  if (!VALIDATION_PATTERNS.URL.test(url)) {
    return createValidationResult(false, 'Please enter a valid URL', ERROR_CODES.INVALID_FORMAT);
  }
  
  try {
    const urlObj = new URL(url);
    if (!protocols.includes(urlObj.protocol.slice(0, -1))) {
      return createValidationResult(
        false, 
        `URL must use one of these protocols: ${protocols.join(', ')}`, 
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    return createValidationResult(true, '', null, { parsedUrl: urlObj });
  } catch (error) {
    return createValidationResult(false, 'Please enter a valid URL', ERROR_CODES.INVALID_FORMAT);
  }
};

// Number validation
export const validateNumber = (value, options = {}) => {
  const { 
    min, 
    max, 
    integer = false, 
    positive = false,
    fieldName = 'Number',
    required = true,
    allowEmpty = false 
  } = options;
  
  if (value === null || value === undefined || value === '') {
    if (required && !allowEmpty) {
      return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return createValidationResult(false, `${fieldName} must be a valid number`, ERROR_CODES.INVALID_FORMAT);
  }
  
  if (integer && !Number.isInteger(num)) {
    return createValidationResult(false, `${fieldName} must be a whole number`, ERROR_CODES.VALIDATION_ERROR);
  }
  
  if (positive && num <= 0) {
    return createValidationResult(false, `${fieldName} must be a positive number`, ERROR_CODES.VALIDATION_ERROR);
  }
  
  if (min !== undefined && num < min) {
    return createValidationResult(false, `${fieldName} must be at least ${min}`, ERROR_CODES.VALIDATION_ERROR);
  }
  
  if (max !== undefined && num > max) {
    return createValidationResult(false, `${fieldName} cannot exceed ${max}`, ERROR_CODES.VALIDATION_ERROR);
  }
  
  return createValidationResult(true, '', null, { number: num });
};

// Date validation
export const validateDate = (date, options = {}) => {
  const { 
    minDate, 
    maxDate, 
    futureOnly = false, 
    pastOnly = false,
    fieldName = 'Date',
    required = true,
    allowEmpty = false 
  } = options;
  
  if (!date) {
    if (required && !allowEmpty) {
      return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
    }
    if (allowEmpty) {
      return createValidationResult(true);
    }
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return createValidationResult(false, `${fieldName} must be a valid date`, ERROR_CODES.INVALID_FORMAT);
  }
  
  const now = new Date();
  
  if (futureOnly && dateObj <= now) {
    return createValidationResult(false, `${fieldName} must be in the future`, ERROR_CODES.VALIDATION_ERROR);
  }
  
  if (pastOnly && dateObj >= now) {
    return createValidationResult(false, `${fieldName} must be in the past`, ERROR_CODES.VALIDATION_ERROR);
  }
  
  if (minDate && dateObj < new Date(minDate)) {
    return createValidationResult(
      false, 
      `${fieldName} cannot be earlier than ${new Date(minDate).toLocaleDateString()}`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  if (maxDate && dateObj > new Date(maxDate)) {
    return createValidationResult(
      false, 
      `${fieldName} cannot be later than ${new Date(maxDate).toLocaleDateString()}`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  return createValidationResult(true, '', null, { date: dateObj });
};

// File validation
export const validateFile = (file, options = {}) => {
  const { 
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    fieldName = 'File',
    required = true 
  } = options;
  
  if (!file) {
    if (required) {
      return createValidationResult(false, `${fieldName} is required`, ERROR_CODES.REQUIRED_FIELD);
    }
    return createValidationResult(true);
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return createValidationResult(
      false, 
      `${fieldName} size cannot exceed ${maxSizeMB}MB`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return createValidationResult(
      false, 
      `${fieldName} must be one of: ${allowedTypes.join(', ')}`, 
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  
  return createValidationResult(true, '', null, { 
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
  });
};

// Form validation helper
export const validateForm = (formData, validationRules, options = {}) => {
  const { stopOnFirstError = false } = options;
  const errors = {};
  const validatedData = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(field => {
    if (stopOnFirstError && !isValid) return;
    
    const rules = Array.isArray(validationRules[field]) ? validationRules[field] : [validationRules[field]];
    const value = formData[field];
    
    for (const rule of rules) {
      let result;
      
      if (typeof rule === 'function') {
        result = rule(value);
      } else if (typeof rule === 'object' && rule.validator) {
        result = rule.validator(value, rule.options || {});
      } else {
        console.warn(`Invalid validation rule for field ${field}`);
        continue;
      }
      
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break;
      } else if (result.data) {
        validatedData[field] = result.data;
      }
    }
  });
  
  return { 
    isValid, 
    errors, 
    validatedData,
    errorCount: Object.keys(errors).length 
  };
};

// Password strength calculator
const calculatePasswordStrength = (password) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
    noCommon: !isCommonPassword(password)
  };
  
  Object.values(checks).forEach(check => {
    if (check) score++;
  });
  
  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  
  return {
    score,
    strength,
    checks,
    percentage: Math.round((score / 6) * 100)
  };
};

// Common password checker (basic implementation)
const isCommonPassword = (password) => {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  return commonPasswords.includes(password.toLowerCase());
};

// Validation rule builders for common patterns
export const ValidationRules = {
  required: (fieldName, options = {}) => (value) => validateRequired(value, fieldName, options),
  email: (options = {}) => (value) => validateEmail(value, options),
  password: (options = {}) => (value) => validatePassword(value, options),
  phone: (options = {}) => (value) => validatePhone(value, options),
  length: (options = {}) => (value) => validateLength(value, options),
  number: (options = {}) => (value) => validateNumber(value, options),
  date: (options = {}) => (value) => validateDate(value, options),
  url: (options = {}) => (value) => validateUrl(value, options),
  file: (options = {}) => (value) => validateFile(value, options)
};

// Export all validators
export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateLength,
  validateUrl,
  validateNumber,
  validateDate,
  validateFile,
  validateForm,
  ValidationRules,
  createValidationResult
};