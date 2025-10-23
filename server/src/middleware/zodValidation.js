import { z } from 'zod';
import logger from '../utils/logger.js';

/**
 * Zod Validation Middleware
 * Replaces express-validator with Zod for consistent validation
 */

// Create validation middleware for request body
export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      const result = await schema.safeParseAsync(req.body);

      if (!result.success) {
        const errors = formatZodErrors(result.error);

        logger.warn('Request body validation failed', {
          endpoint: req.originalUrl,
          method: req.method,
          errors,
          body: req.body,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
          code: 'VALIDATION_ERROR',
        });
      }

      // Replace req.body with validated and transformed data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
        code: 'VALIDATION_SERVICE_ERROR',
      });
    }
  };
};

// Create validation middleware for query parameters
export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const result = await schema.safeParseAsync(req.query);

      if (!result.success) {
        const errors = formatZodErrors(result.error);

        logger.warn('Query parameters validation failed', {
          endpoint: req.originalUrl,
          method: req.method,
          errors,
          query: req.query,
          ip: req.ip,
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors,
          code: 'VALIDATION_ERROR',
        });
      }

      // Replace req.query with validated and transformed data
      req.query = result.data;
      next();
    } catch (error) {
      logger.error('Query validation middleware error', {
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
        code: 'VALIDATION_SERVICE_ERROR',
      });
    }
  };
};

// Create validation middleware for URL parameters
export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const result = await schema.safeParseAsync(req.params);

      if (!result.success) {
        const errors = formatZodErrors(result.error);

        logger.warn('URL parameters validation failed', {
          endpoint: req.originalUrl,
          method: req.method,
          errors,
          params: req.params,
          ip: req.ip,
        });

        return res.status(400).json({
          success: false,
          message: 'Invalid URL parameters',
          errors,
          code: 'VALIDATION_ERROR',
        });
      }

      // Replace req.params with validated and transformed data
      req.params = result.data;
      next();
    } catch (error) {
      logger.error('Params validation middleware error', {
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
        code: 'VALIDATION_SERVICE_ERROR',
      });
    }
  };
};

// Combined validation middleware
export const validate = (schemas) => {
  const middlewares = [];

  if (schemas.body) {
    middlewares.push(validateBody(schemas.body));
  }

  if (schemas.query) {
    middlewares.push(validateQuery(schemas.query));
  }

  if (schemas.params) {
    middlewares.push(validateParams(schemas.params));
  }

  return middlewares;
};

// Format Zod errors for API response
const formatZodErrors = (zodError) => {
  const errors = {};

  zodError.issues.forEach((issue) => {
    const path = issue.path.join('.');
    const field = path || 'root';

    if (!errors[field]) {
      errors[field] = [];
    }

    errors[field].push({
      message: issue.message,
      code: issue.code,
      expected: issue.expected,
      received: issue.received,
    });
  });

  // Flatten single-error fields
  Object.keys(errors).forEach((field) => {
    if (errors[field].length === 1) {
      errors[field] = errors[field][0].message;
    }
  });

  return errors;
};

// Common parameter schemas
export const commonSchemas = {
  // MongoDB ObjectId parameter
  mongoId: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),

  // Pagination query parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Search query parameters
  search: z.object({
    q: z.string().max(200).optional(),
    category: z.string().optional(),
    status: z.string().optional(),
  }),

  // Date range query parameters
  dateRange: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).refine((data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['dateTo'],
  }),
};

// Validation helpers
export const createIdValidation = (paramName = 'id') => {
  return z.object({
    [paramName]: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  });
};

export const createPaginationValidation = (options = {}) => {
  const {
    maxLimit = 100,
    defaultLimit = 20,
    sortFields = [],
  } = options;

  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
    sortBy: sortFields.length > 0 ? z.enum(sortFields).optional() : z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
};

// Async validation helper
export const createAsyncValidation = (asyncValidator) => {
  return async (req, res, next) => {
    try {
      const isValid = await asyncValidator(req.body, req);

      if (isValid !== true) {
        const errorMessage = typeof isValid === 'string' ? isValid : 'Validation failed';

        return res.status(400).json({
          success: false,
          message: errorMessage,
          code: 'ASYNC_VALIDATION_ERROR',
        });
      }

      next();
    } catch (error) {
      logger.error('Async validation error', {
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'Validation service error',
        code: 'VALIDATION_SERVICE_ERROR',
      });
    }
  };
};

// File validation helper
export const validateFile = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = [],
    maxFiles = 1,
  } = options;

  return (req, res, next) => {
    try {
      const files = req.files || [];
      const file = req.file;

      if (required && !file && files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File is required',
          code: 'FILE_REQUIRED',
        });
      }

      const filesToCheck = file ? [file] : files;

      if (filesToCheck.length > maxFiles) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} allowed`,
          code: 'TOO_MANY_FILES',
        });
      }

      for (const fileToCheck of filesToCheck) {
        if (fileToCheck.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File size must not exceed ${Math.round(maxSize / 1024 / 1024)}MB`,
            code: 'FILE_TOO_LARGE',
          });
        }

        if (allowedTypes.length > 0 && !allowedTypes.includes(fileToCheck.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            code: 'INVALID_FILE_TYPE',
          });
        }
      }

      next();
    } catch (error) {
      logger.error('File validation error', {
        error: error.message,
        stack: error.stack,
        endpoint: req.originalUrl,
      });

      return res.status(500).json({
        success: false,
        message: 'File validation error',
        code: 'FILE_VALIDATION_ERROR',
      });
    }
  };
};

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate,
  commonSchemas,
  createIdValidation,
  createPaginationValidation,
  createAsyncValidation,
  validateFile,
};