// Form Validation Utilities
// TODO: Implement validation functions

import { VALIDATION_PATTERNS } from './constants.js';

// Email validation
export const validateEmail = (email) => {
  // TODO: Validate email format
  if (!email) return { isValid: false, message: 'Email is required' };
  
  if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true, message: '' };
};

// Password validation
export const validatePassword = (password) => {
  // TODO: Validate password strength
  if (!password) return { isValid: false, message: 'Password is required' };
  
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (!VALIDATION_PATTERNS.PASSWORD.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }
  
  return { isValid: true, message: '' };
};

// Phone validation
export const validatePhone = (phone) => {
  // TODO: Validate phone number
  if (!phone) return { isValid: false, message: 'Phone number is required' };
  
  if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }
  
  return { isValid: true, message: '' };
};

// Required field validation
export const validateRequired = (value, fieldName = 'Field') => {
  // TODO: Validate required fields
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  return { isValid: true, message: '' };
};

// Minimum length validation
export const validateMinLength = (value, minLength, fieldName = 'Field') => {
  // TODO: Validate minimum length
  if (!value || value.length < minLength) {
    return { 
      isValid: false, 
      message: `${fieldName} must be at least ${minLength} characters long` 
    };
  }
  
  return { isValid: true, message: '' };
};

// Maximum length validation
export const validateMaxLength = (value, maxLength, fieldName = 'Field') => {
  // TODO: Validate maximum length
  if (value && value.length > maxLength) {
    return { 
      isValid: false, 
      message: `${fieldName} cannot exceed ${maxLength} characters` 
    };
  }
  
  return { isValid: true, message: '' };
};

// UK postcode validation
export const validatePostcode = (postcode) => {
  // TODO: Validate UK postcode
  if (!postcode) return { isValid: false, message: 'Postcode is required' };
  
  if (!VALIDATION_PATTERNS.POSTCODE_UK.test(postcode)) {
    return { isValid: false, message: 'Please enter a valid UK postcode' };
  }
  
  return { isValid: true, message: '' };
};

// Credit card validation
export const validateCardNumber = (cardNumber) => {
  // TODO: Validate credit card number
  if (!cardNumber) return { isValid: false, message: 'Card number is required' };
  
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!VALIDATION_PATTERNS.CARD_NUMBER.test(cleaned)) {
    return { isValid: false, message: 'Please enter a valid card number' };
  }
  
  return { isValid: true, message: '' };
};

// CVV validation
export const validateCVV = (cvv) => {
  // TODO: Validate CVV
  if (!cvv) return { isValid: false, message: 'CVV is required' };
  
  if (!VALIDATION_PATTERNS.CVV.test(cvv)) {
    return { isValid: false, message: 'Please enter a valid CVV' };
  }
  
  return { isValid: true, message: '' };
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  // TODO: Validate entire form based on rules
  const errors = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break;
      }
    }
  });
  
  return { isValid, errors };
};

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePostcode,
  validateCardNumber,
  validateCVV,
  validateForm
};