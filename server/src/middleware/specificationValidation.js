// Specification validation middleware
import { validateProductSpecifications, validateSpecificationInput } from '../utils/specificationValidator.js';

/**
 * Middleware to validate product specifications
 */
export const validateSpecifications = (req, res, next) => {
  const { specifications, category } = req.body;

  if (!specifications) {
    return next(); // Skip validation if no specifications provided
  }

  // Validate specifications array
  const validation = validateProductSpecifications(specifications, category);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid specifications',
      errors: validation.errors,
      warnings: validation.warnings
    });
  }

  // Add validation results to request for logging
  req.specificationValidation = validation;
  next();
};

/**
 * Middleware to validate single specification input
 */
export const validateSingleSpecification = (req, res, next) => {
  const validation = validateSpecificationInput(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid specification data',
      errors: validation.errors
    });
  }

  // Replace request body with sanitized data
  req.body = validation.sanitized;
  next();
};

/**
 * Middleware to add specification completeness info
 */
export const addSpecificationCompleteness = (req, res, next) => {
  const { specifications, category } = req.body;

  if (specifications && category) {
    const completeness = getSpecificationCompleteness(specifications, category);
    req.specificationCompleteness = completeness;
  }

  next();
};

export default {
  validateSpecifications,
  validateSingleSpecification,
  addSpecificationCompleteness
};