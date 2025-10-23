import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Zod Resolver Utilities
 * Enhanced Zod resolver with additional features for React Hook Form
 */

// Create enhanced Zod resolver with custom error formatting
export const createZodResolver = (schema, options = {}) => {
  const {
    errorMap,
    async = false,
    raw = false,
  } = options;

  return zodResolver(schema, {
    errorMap,
    async,
    raw,
  });
};

// Custom error map for better user experience
export const customErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.expected === 'string' && issue.received === 'undefined') {
        return { message: 'This field is required' };
      }
      if (issue.expected === 'number' && issue.received === 'nan') {
        return { message: 'Please enter a valid number' };
      }
      break;
    
    case 'too_small':
      if (issue.type === 'string') {
        if (issue.minimum === 1) {
          return { message: 'This field is required' };
        }
        return { message: `Must be at least ${issue.minimum} characters long` };
      }
      if (issue.type === 'number') {
        return { message: `Must be at least ${issue.minimum}` };
      }
      if (issue.type === 'array') {
        return { message: `Must have at least ${issue.minimum} item${issue.minimum === 1 ? '' : 's'}` };
      }
      break;
    
    case 'too_big':
      if (issue.type === 'string') {
        return { message: `Must not exceed ${issue.maximum} characters` };
      }
      if (issue.type === 'number') {
        return { message: `Must not exceed ${issue.maximum}` };
      }
      if (issue.type === 'array') {
        return { message: `Must have at most ${issue.maximum} item${issue.maximum === 1 ? '' : 's'}` };
      }
      break;
    
    case 'invalid_string':
      switch (issue.validation) {
        case 'email':
          return { message: 'Please enter a valid email address' };
        case 'url':
          return { message: 'Please enter a valid URL' };
        case 'regex':
          return { message: 'Invalid format' };
        default:
          return { message: 'Invalid input' };
      }
    
    case 'custom':
      return { message: issue.message || 'Invalid input' };
    
    default:
      return { message: ctx.defaultError };
  }
  
  return { message: ctx.defaultError };
};

// Pre-configured resolvers for common schemas
export const createAuthResolver = (schemaName) => {
  const authSchemas = import('../schemas/authSchemas.js');
  return authSchemas.then(schemas => 
    createZodResolver(schemas.authSchemas[schemaName], {
      errorMap: customErrorMap,
    })
  );
};

export const createProductResolver = (schemaName) => {
  const productSchemas = import('../schemas/productSchemas.js');
  return productSchemas.then(schemas => 
    createZodResolver(schemas.productSchemas[schemaName], {
      errorMap: customErrorMap,
    })
  );
};

export const createOrderResolver = (schemaName) => {
  const orderSchemas = import('../schemas/orderSchemas.js');
  return orderSchemas.then(schemas => 
    createZodResolver(schemas.orderSchemas[schemaName], {
      errorMap: customErrorMap,
    })
  );
};

// Async validation helper
export const createAsyncZodResolver = (schema, asyncValidators = {}) => {
  return async (values, context, options) => {
    // First run synchronous validation
    const syncResult = schema.safeParse(values);
    
    if (!syncResult.success) {
      return {
        values: {},
        errors: syncResult.error.formErrors.fieldErrors,
      };
    }
    
    // Then run async validations
    const asyncErrors = {};
    
    for (const [field, validator] of Object.entries(asyncValidators)) {
      if (values[field]) {
        try {
          const isValid = await validator(values[field], values);
          if (isValid !== true) {
            asyncErrors[field] = {
              type: 'async',
              message: typeof isValid === 'string' ? isValid : 'Validation failed',
            };
          }
        } catch (error) {
          console.error(`Async validation error for ${field}:`, error);
          // Don't block form submission on async validation errors
        }
      }
    }
    
    if (Object.keys(asyncErrors).length > 0) {
      return {
        values: {},
        errors: asyncErrors,
      };
    }
    
    return {
      values: syncResult.data,
      errors: {},
    };
  };
};

// Schema transformation utilities
export const transformSchemaForForm = (schema, transformations = {}) => {
  // Apply transformations to schema fields
  let transformedSchema = schema;
  
  Object.entries(transformations).forEach(([field, transform]) => {
    if (typeof transform === 'function') {
      transformedSchema = transformedSchema.transform((data) => ({
        ...data,
        [field]: transform(data[field]),
      }));
    }
  });
  
  return transformedSchema;
};

// Validation helpers
export const validateField = async (schema, fieldName, value) => {
  try {
    const fieldSchema = schema.shape[fieldName];
    if (!fieldSchema) {
      throw new Error(`Field ${fieldName} not found in schema`);
    }
    
    const result = await fieldSchema.safeParseAsync(value);
    return {
      isValid: result.success,
      error: result.success ? null : result.error.issues[0]?.message,
    };
  } catch (error) {
    console.error('Field validation error:', error);
    return {
      isValid: false,
      error: 'Validation error',
    };
  }
};

export const validateForm = async (schema, values) => {
  try {
    const result = await schema.safeParseAsync(values);
    return {
      isValid: result.success,
      data: result.success ? result.data : null,
      errors: result.success ? {} : result.error.formErrors.fieldErrors,
    };
  } catch (error) {
    console.error('Form validation error:', error);
    return {
      isValid: false,
      data: null,
      errors: { _form: 'Validation error' },
    };
  }
};

// Schema composition utilities
export const mergeSchemas = (...schemas) => {
  return schemas.reduce((merged, schema) => merged.merge(schema));
};

export const extendSchema = (baseSchema, extensions) => {
  return baseSchema.extend(extensions);
};

export const pickSchemaFields = (schema, fields) => {
  return schema.pick(fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {}));
};

export const omitSchemaFields = (schema, fields) => {
  return schema.omit(fields.reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {}));
};

// Export utilities
export default {
  createZodResolver,
  customErrorMap,
  createAuthResolver,
  createProductResolver,
  createOrderResolver,
  createAsyncZodResolver,
  transformSchemaForForm,
  validateField,
  validateForm,
  mergeSchemas,
  extendSchema,
  pickSchemaFields,
  omitSchemaFields,
};