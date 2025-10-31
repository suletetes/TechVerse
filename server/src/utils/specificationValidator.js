// Specification validation utility
// Validates specification data for accuracy and completeness

export const specificationValidationRules = {
  // Required specifications by category
  required: {
    phones: ['Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage', 'Battery Capacity'],
    tablets: ['Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage', 'Battery Life'],
    computers: ['Screen Size', 'Resolution', 'Processor', 'RAM', 'Storage Capacity'],
    tvs: ['Screen Size', 'Resolution', 'Display Technology', 'Refresh Rate'],
    gaming: ['Processor', 'GPU', 'RAM', 'Storage'],
    watches: ['Display Size', 'Battery Life', 'Water Resistance'],
    audio: ['Driver Size', 'Frequency Response', 'Wireless Technology'],
    cameras: ['Sensor Type', 'Resolution', 'ISO Range'],
    accessories: [],
    'home-smart-devices': [],
    'fitness-health': ['Battery Life', 'Heart Rate Monitoring']
  },

  // Valid value patterns for specifications
  patterns: {
    'Screen Size': /^\d+(\.\d+)?$/,
    'Resolution': /^\d+\s*[×x]\s*\d+$/,
    'RAM': /^\d+$/,
    'Storage': /^\d+$/,
    'Storage Capacity': /^\d+$/,
    'Battery Capacity': /^\d+$/,
    'Battery Life': /^\d+$/,
    'Refresh Rate': /^\d+$/,
    'Brightness': /^\d+$/,
    'Peak Brightness': /^\d+$/,
    'CPU Cores': /^\d+$/,
    'Base Clock Speed': /^\d+(\.\d+)?$/,
    'Boost Clock Speed': /^\d+(\.\d+)?$/,
    'Wired Charging': /^\d+$/,
    'Wireless Charging': /^\d+$/,
    'Power Adapter': /^\d+$/,
    'Display Size': /^\d+$/,
    'Autofocus Points': /^\d+$/
  },

  // Valid ranges for numeric specifications
  ranges: {
    'Screen Size': { min: 3.0, max: 100.0 },
    'RAM': { min: 1, max: 128 },
    'Storage': { min: 16, max: 8192 },
    'Storage Capacity': { min: 128, max: 8192 },
    'Battery Capacity': { min: 1000, max: 10000 },
    'Battery Life': { min: 1, max: 30 },
    'Refresh Rate': { min: 30, max: 240 },
    'Brightness': { min: 100, max: 5000 },
    'Peak Brightness': { min: 400, max: 10000 },
    'CPU Cores': { min: 2, max: 32 },
    'Base Clock Speed': { min: 1.0, max: 6.0 },
    'Boost Clock Speed': { min: 2.0, max: 8.0 },
    'Wired Charging': { min: 5, max: 200 },
    'Wireless Charging': { min: 5, max: 100 },
    'Power Adapter': { min: 18, max: 200 },
    'Display Size': { min: 20, max: 60 },
    'Autofocus Points': { min: 9, max: 1000 }
  },

  // Valid categories for specifications
  validCategories: [
    'Display & Interface',
    'Performance',
    'Camera & Imaging',
    'Audio & Sound',
    'Connectivity',
    'Battery & Power',
    'Durability & Design',
    'Health & Fitness Features',
    'Smart Features',
    'Gaming Features'
  ]
};

/**
 * Validate a single specification
 * @param {Object} specification - The specification to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateSpecification = (specification) => {
  const errors = [];

  // Check required fields
  if (!specification.name || typeof specification.name !== 'string') {
    errors.push('Specification name is required and must be a string');
  }

  if (!specification.value || typeof specification.value !== 'string') {
    errors.push('Specification value is required and must be a string');
  }

  if (!specification.category || typeof specification.category !== 'string') {
    errors.push('Specification category is required and must be a string');
  }

  if (specification.unit !== undefined && typeof specification.unit !== 'string') {
    errors.push('Specification unit must be a string if provided');
  }

  // Validate category
  if (specification.category && !specificationValidationRules.validCategories.includes(specification.category)) {
    errors.push(`Invalid category: ${specification.category}`);
  }

  // Validate value pattern if defined
  if (specification.name && specificationValidationRules.patterns[specification.name]) {
    const pattern = specificationValidationRules.patterns[specification.name];
    if (!pattern.test(specification.value)) {
      errors.push(`Invalid value format for ${specification.name}: ${specification.value}`);
    }
  }

  // Validate numeric ranges
  if (specification.name && specificationValidationRules.ranges[specification.name]) {
    const range = specificationValidationRules.ranges[specification.name];
    const numericValue = parseFloat(specification.value);
    
    if (!isNaN(numericValue)) {
      if (numericValue < range.min || numericValue > range.max) {
        errors.push(`Value for ${specification.name} must be between ${range.min} and ${range.max}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate an array of specifications for a product
 * @param {Array} specifications - Array of specifications to validate
 * @param {string} categorySlug - Product category slug
 * @returns {Object} Validation result with isValid, errors, and warnings
 */
export const validateProductSpecifications = (specifications, categorySlug) => {
  const errors = [];
  const warnings = [];

  // Check if specifications is an array
  if (!Array.isArray(specifications)) {
    return {
      isValid: false,
      errors: ['Specifications must be an array'],
      warnings: []
    };
  }

  // Validate each specification
  specifications.forEach((spec, index) => {
    const validation = validateSpecification(spec);
    if (!validation.isValid) {
      errors.push(`Specification ${index + 1}: ${validation.errors.join(', ')}`);
    }
  });

  // Check for required specifications
  const requiredSpecs = specificationValidationRules.required[categorySlug] || [];
  const specNames = specifications.map(s => s.name);
  
  requiredSpecs.forEach(requiredSpec => {
    if (!specNames.includes(requiredSpec)) {
      warnings.push(`Missing recommended specification: ${requiredSpec}`);
    }
  });

  // Check for duplicate specifications
  const duplicates = specNames.filter((name, index) => specNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate specifications found: ${duplicates.join(', ')}`);
  }

  // Check specification count
  if (specifications.length === 0) {
    warnings.push('No specifications provided');
  } else if (specifications.length < 5) {
    warnings.push('Consider adding more specifications for better product information');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Sanitize specification value
 * @param {string} value - The value to sanitize
 * @returns {string} Sanitized value
 */
export const sanitizeSpecificationValue = (value) => {
  if (typeof value !== 'string') {
    return String(value);
  }

  // Remove extra whitespace
  value = value.trim();
  
  // Normalize common patterns
  value = value.replace(/\s*x\s*/g, ' × '); // Normalize multiplication symbol
  value = value.replace(/\s+/g, ' '); // Remove multiple spaces
  
  return value;
};

/**
 * Normalize specification name
 * @param {string} name - The specification name to normalize
 * @returns {string} Normalized name
 */
export const normalizeSpecificationName = (name) => {
  if (typeof name !== 'string') {
    return String(name);
  }

  // Convert to title case and normalize
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get specification completeness score
 * @param {Array} specifications - Array of specifications
 * @param {string} categorySlug - Product category slug
 * @returns {Object} Completeness score and details
 */
export const getSpecificationCompleteness = (specifications, categorySlug) => {
  const requiredSpecs = specificationValidationRules.required[categorySlug] || [];
  const specNames = specifications.map(s => s.name);
  
  const presentRequired = requiredSpecs.filter(spec => specNames.includes(spec));
  const missingRequired = requiredSpecs.filter(spec => !specNames.includes(spec));
  
  const completenessScore = requiredSpecs.length > 0 
    ? Math.round((presentRequired.length / requiredSpecs.length) * 100)
    : 100;

  return {
    score: completenessScore,
    total: specifications.length,
    required: requiredSpecs.length,
    presentRequired: presentRequired.length,
    missingRequired,
    recommendations: generateSpecificationRecommendations(specifications, categorySlug)
  };
};

/**
 * Generate specification recommendations
 * @param {Array} specifications - Current specifications
 * @param {string} categorySlug - Product category slug
 * @returns {Array} Array of recommendation objects
 */
const generateSpecificationRecommendations = (specifications, categorySlug) => {
  const recommendations = [];
  const specNames = specifications.map(s => s.name);
  const requiredSpecs = specificationValidationRules.required[categorySlug] || [];
  
  // Recommend missing required specifications
  const missingRequired = requiredSpecs.filter(spec => !specNames.includes(spec));
  missingRequired.forEach(spec => {
    recommendations.push({
      type: 'missing_required',
      specification: spec,
      priority: 'high',
      message: `Add ${spec} specification for better product information`
    });
  });

  // Recommend additional specifications based on category
  const categoryRecommendations = {
    phones: ['Camera Features', 'Face ID/Fingerprint', 'Wireless Charging', 'Water Resistance'],
    tablets: ['Apple Pencil Support', 'Keyboard Compatibility', 'Camera Features'],
    computers: ['Graphics Card', 'Ports', 'Webcam', 'Keyboard Backlight'],
    tvs: ['Smart Platform', 'Voice Control', 'Gaming Features', 'Audio Technology'],
    gaming: ['VR Support', 'Backward Compatibility', 'Online Services'],
    watches: ['Health Sensors', 'Fitness Tracking', 'Crown Type', 'Band Options'],
    audio: ['Battery Life', 'Case Type', 'Voice Assistant', 'Multipoint Connection'],
    cameras: ['Lens Mount', 'Weather Sealing', 'Built-in Flash', 'Memory Card Support']
  };

  const categoryRecs = categoryRecommendations[categorySlug] || [];
  categoryRecs.forEach(spec => {
    if (!specNames.includes(spec)) {
      recommendations.push({
        type: 'enhancement',
        specification: spec,
        priority: 'medium',
        message: `Consider adding ${spec} for enhanced product details`
      });
    }
  });

  return recommendations.slice(0, 5); // Limit to top 5 recommendations
};

/**
 * Validate specification format for API input
 * @param {Object} specData - Specification data from API
 * @returns {Object} Validation result
 */
export const validateSpecificationInput = (specData) => {
  const errors = [];
  
  if (!specData || typeof specData !== 'object') {
    return {
      isValid: false,
      errors: ['Specification data must be an object'],
      sanitized: null
    };
  }

  const sanitized = {
    name: normalizeSpecificationName(specData.name || ''),
    value: sanitizeSpecificationValue(specData.value || ''),
    unit: specData.unit || '',
    category: specData.category || 'Other'
  };

  // Validate sanitized data
  const validation = validateSpecification(sanitized);
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    sanitized: validation.isValid ? sanitized : null
  };
};

export default {
  validateSpecification,
  validateProductSpecifications,
  sanitizeSpecificationValue,
  normalizeSpecificationName,
  getSpecificationCompleteness,
  validateSpecificationInput,
  specificationValidationRules
};