/**
 * Form Validation Utilities
 * Common validation functions and patterns for React Hook Form
 */

// Email validation
export const emailValidation = {
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Please enter a valid email address',
  },
};

// Password validation
export const passwordValidation = {
  required: 'Password is required',
  minLength: {
    value: 6,
    message: 'Password must be at least 6 characters long',
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  },
};

// Strong password validation
export const strongPasswordValidation = {
  required: 'Password is required',
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters long',
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
};

// Name validation
export const nameValidation = {
  required: 'This field is required',
  minLength: {
    value: 2,
    message: 'Name must be at least 2 characters long',
  },
  maxLength: {
    value: 50,
    message: 'Name must not exceed 50 characters',
  },
  pattern: {
    value: /^[a-zA-Z\s'-]+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  },
};

// Phone validation
export const phoneValidation = {
  pattern: {
    value: /^[\+]?[1-9][\d]{0,15}$/,
    message: 'Please enter a valid phone number',
  },
};

// URL validation
export const urlValidation = {
  pattern: {
    value: /^https?:\/\/.+\..+/,
    message: 'Please enter a valid URL',
  },
};

// Zip code validation
export const zipCodeValidation = {
  pattern: {
    value: /^\d{5}(-\d{4})?$/,
    message: 'Please enter a valid zip code',
  },
};

// Credit card validation
export const creditCardValidation = {
  pattern: {
    value: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
    message: 'Please enter a valid credit card number',
  },
};

// CVV validation
export const cvvValidation = {
  pattern: {
    value: /^\d{3,4}$/,
    message: 'Please enter a valid CVV',
  },
};

// Date validation
export const dateValidation = {
  required: 'Date is required',
  validate: (value) => {
    const date = new Date(value);
    const now = new Date();
    if (date > now) {
      return 'Date cannot be in the future';
    }
    return true;
  },
};

// Age validation (18+)
export const ageValidation = {
  required: 'Date of birth is required',
  validate: (value) => {
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      return 'You must be at least 18 years old';
    }
    
    return true;
  },
};

// File validation
export const fileValidation = {
  image: {
    validate: (files) => {
      if (!files || files.length === 0) return true;
      
      const file = Array.isArray(files) ? files[0] : files;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)';
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return 'Image size must be less than 5MB';
      }
      
      return true;
    },
  },
  document: {
    validate: (files) => {
      if (!files || files.length === 0) return true;
      
      const file = Array.isArray(files) ? files[0] : files;
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(file.type)) {
        return 'Please upload a valid document file (PDF, DOC, or DOCX)';
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        return 'Document size must be less than 10MB';
      }
      
      return true;
    },
  },
};

// Custom validation functions
export const createPasswordConfirmValidation = (passwordFieldName = 'password') => ({
  required: 'Please confirm your password',
  validate: (value, formValues) => {
    if (value !== formValues[passwordFieldName]) {
      return 'Passwords do not match';
    }
    return true;
  },
});

export const createMinLengthValidation = (min, fieldName = 'field') => ({
  minLength: {
    value: min,
    message: `${fieldName} must be at least ${min} characters long`,
  },
});

export const createMaxLengthValidation = (max, fieldName = 'field') => ({
  maxLength: {
    value: max,
    message: `${fieldName} must not exceed ${max} characters`,
  },
});

export const createRangeValidation = (min, max, fieldName = 'field') => ({
  min: {
    value: min,
    message: `${fieldName} must be at least ${min}`,
  },
  max: {
    value: max,
    message: `${fieldName} must not exceed ${max}`,
  },
});

export const createRequiredValidation = (message = 'This field is required') => ({
  required: message,
});

export const createPatternValidation = (pattern, message) => ({
  pattern: {
    value: pattern,
    message,
  },
});

// Async validation functions
export const createAsyncEmailValidation = (checkEmailAvailability) => ({
  validate: async (email) => {
    if (!email) return true;
    
    try {
      const isAvailable = await checkEmailAvailability(email);
      return isAvailable || 'This email is already registered';
    } catch (error) {
      console.error('Email validation error:', error);
      return true; // Don't block form submission on validation error
    }
  },
});

export const createAsyncUsernameValidation = (checkUsernameAvailability) => ({
  validate: async (username) => {
    if (!username) return true;
    
    try {
      const isAvailable = await checkUsernameAvailability(username);
      return isAvailable || 'This username is already taken';
    } catch (error) {
      console.error('Username validation error:', error);
      return true;
    }
  },
});

// Validation rule builders
export const buildValidationRules = (rules = []) => {
  const validationObject = {};
  
  rules.forEach(rule => {
    if (typeof rule === 'string') {
      // Predefined rule
      switch (rule) {
        case 'required':
          validationObject.required = 'This field is required';
          break;
        case 'email':
          Object.assign(validationObject, emailValidation);
          break;
        case 'password':
          Object.assign(validationObject, passwordValidation);
          break;
        case 'strongPassword':
          Object.assign(validationObject, strongPasswordValidation);
          break;
        case 'name':
          Object.assign(validationObject, nameValidation);
          break;
        case 'phone':
          Object.assign(validationObject, phoneValidation);
          break;
        case 'url':
          Object.assign(validationObject, urlValidation);
          break;
        case 'zipCode':
          Object.assign(validationObject, zipCodeValidation);
          break;
        case 'creditCard':
          Object.assign(validationObject, creditCardValidation);
          break;
        case 'cvv':
          Object.assign(validationObject, cvvValidation);
          break;
        case 'date':
          Object.assign(validationObject, dateValidation);
          break;
        case 'age':
          Object.assign(validationObject, ageValidation);
          break;
        case 'imageFile':
          Object.assign(validationObject, fileValidation.image);
          break;
        case 'documentFile':
          Object.assign(validationObject, fileValidation.document);
          break;
      }
    } else if (typeof rule === 'object') {
      // Custom rule object
      Object.assign(validationObject, rule);
    }
  });
  
  return validationObject;
};

// Form schema builders for common forms
export const loginFormSchema = {
  email: buildValidationRules(['required', 'email']),
  password: buildValidationRules(['required']),
};

export const registrationFormSchema = {
  firstName: buildValidationRules(['required', 'name']),
  lastName: buildValidationRules(['required', 'name']),
  email: buildValidationRules(['required', 'email']),
  password: buildValidationRules(['required', 'password']),
  confirmPassword: createPasswordConfirmValidation(),
  acceptTerms: {
    required: 'You must accept the terms and conditions',
  },
};

export const profileFormSchema = {
  firstName: buildValidationRules(['required', 'name']),
  lastName: buildValidationRules(['required', 'name']),
  email: buildValidationRules(['required', 'email']),
  phone: buildValidationRules(['phone']),
  dateOfBirth: buildValidationRules(['date']),
};

export const passwordChangeFormSchema = {
  currentPassword: buildValidationRules(['required']),
  newPassword: buildValidationRules(['required', 'password']),
  confirmPassword: createPasswordConfirmValidation('newPassword'),
};

export const addressFormSchema = {
  firstName: buildValidationRules(['required', 'name']),
  lastName: buildValidationRules(['required', 'name']),
  address1: buildValidationRules(['required']),
  city: buildValidationRules(['required']),
  state: buildValidationRules(['required']),
  zipCode: buildValidationRules(['required', 'zipCode']),
  country: buildValidationRules(['required']),
  phone: buildValidationRules(['phone']),
};

export const contactFormSchema = {
  name: buildValidationRules(['required', 'name']),
  email: buildValidationRules(['required', 'email']),
  subject: buildValidationRules(['required']),
  message: {
    required: 'Message is required',
    minLength: {
      value: 10,
      message: 'Message must be at least 10 characters long',
    },
    maxLength: {
      value: 1000,
      message: 'Message must not exceed 1000 characters',
    },
  },
};

export default {
  emailValidation,
  passwordValidation,
  strongPasswordValidation,
  nameValidation,
  phoneValidation,
  urlValidation,
  zipCodeValidation,
  creditCardValidation,
  cvvValidation,
  dateValidation,
  ageValidation,
  fileValidation,
  createPasswordConfirmValidation,
  createMinLengthValidation,
  createMaxLengthValidation,
  createRangeValidation,
  createRequiredValidation,
  createPatternValidation,
  createAsyncEmailValidation,
  createAsyncUsernameValidation,
  buildValidationRules,
  loginFormSchema,
  registrationFormSchema,
  profileFormSchema,
  passwordChangeFormSchema,
  addressFormSchema,
  contactFormSchema,
};