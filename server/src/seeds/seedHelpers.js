import fs from 'fs/promises';
import path from 'path';

/**
 * Seed Helper Functions - Utility functions for seeding operations
 */

/**
 * Load JSON seed file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed JSON data
 */
export async function loadSeedFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load seed file ${filePath}: ${error.message}`);
  }
}

/**
 * Validate seed data against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
export function validateSeedData(data, schema) {
  const errors = [];
  const warnings = [];

  // Basic validation - can be extended with more sophisticated schema validation
  if (schema.required) {
    for (const field of schema.required) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  if (schema.types) {
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (data[field] !== undefined && typeof data[field] !== expectedType) {
        errors.push(`Field ${field} should be of type ${expectedType}, got ${typeof data[field]}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate slug from text
 * @param {string} text - Text to slugify
 * @returns {string} URL-safe slug
 */
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize currency code
 * @param {string} currency - Currency to normalize
 * @returns {string} Normalized currency code
 */
export function normalizeCurrency(currency) {
  const currencyMap = {
    '$': 'USD',
    '£': 'GBP',
    '€': 'EUR'
  };
  
  return currencyMap[currency] || currency?.toUpperCase() || 'USD';
}

/**
 * Parse price from string
 * @param {string|number} price - Price to parse
 * @returns {number} Parsed price
 */
export function parsePrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  
  const cleaned = price.toString().replace(/[£$€,]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Copy image file to server directory
 * @param {string} sourcePath - Source image path
 * @param {string} targetDir - Target directory
 * @returns {Promise<Object>} Copy result
 */
export async function copyImageFile(sourcePath, targetDir) {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    
    const fileName = path.basename(sourcePath);
    const targetPath = path.join(targetDir, fileName);
    
    await fs.copyFile(sourcePath, targetPath);
    
    return {
      success: true,
      sourcePath,
      targetPath,
      fileName
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      sourcePath
    };
  }
}

/**
 * Create database indexes for better performance
 * @param {Object} model - Mongoose model
 * @param {string[]} fields - Fields to index
 * @returns {Promise<void>}
 */
export async function createIndexes(model, fields) {
  try {
    for (const field of fields) {
      await model.createIndex({ [field]: 1 });
    }
  } catch (error) {
    console.warn(`Warning: Could not create indexes for ${model.modelName}:`, error.message);
  }
}

/**
 * Batch insert with error handling
 * @param {Object} model - Mongoose model
 * @param {Array} records - Records to insert
 * @param {Object} options - Insert options
 * @returns {Promise<Object>} Insert result
 */
export async function batchInsert(model, records, options = {}) {
  const results = {
    inserted: 0,
    skipped: 0,
    errors: []
  };

  const batchSize = options.batchSize || 100;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      if (options.upsert) {
        // Use upsert for each record
        for (const record of batch) {
          try {
            const filter = { [options.uniqueField || 'slug']: record[options.uniqueField || 'slug'] };
            await model.findOneAndUpdate(filter, record, { upsert: true, new: true });
            results.inserted++;
          } catch (error) {
            results.errors.push({
              record: record[options.uniqueField || 'slug'] || record.id,
              error: error.message
            });
            results.skipped++;
          }
        }
      } else {
        // Bulk insert
        const inserted = await model.insertMany(batch, { ordered: false });
        results.inserted += inserted.length;
      }
    } catch (error) {
      if (error.writeErrors) {
        // Handle bulk write errors
        results.inserted += error.result.nInserted || 0;
        results.skipped += error.writeErrors.length;
        results.errors.push(...error.writeErrors.map(e => ({
          record: e.err.op?.[options.uniqueField || 'slug'] || 'unknown',
          error: e.err.errmsg
        })));
      } else {
        results.errors.push({
          batch: `${i}-${i + batchSize}`,
          error: error.message
        });
        results.skipped += batch.length;
      }
    }
  }

  return results;
}

/**
 * Clear collection with confirmation
 * @param {Object} model - Mongoose model
 * @param {boolean} force - Force deletion without confirmation
 * @returns {Promise<Object>} Deletion result
 */
export async function clearCollection(model, force = false) {
  try {
    const count = await model.countDocuments();
    
    if (count === 0) {
      return {
        success: true,
        deleted: 0,
        message: `Collection ${model.collection.name} is already empty`
      };
    }

    if (!force) {
      console.log(`Warning: About to delete ${count} records from ${model.collection.name}`);
      // In a real CLI, you'd prompt for confirmation here
    }

    const result = await model.deleteMany({});
    
    return {
      success: true,
      deleted: result.deletedCount,
      message: `Deleted ${result.deletedCount} records from ${model.collection.name}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      collection: model.collection.name
    };
  }
}

/**
 * Validate foreign key relationships
 * @param {Object} models - Object containing all models
 * @param {Object} data - Data to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateRelationships(models, data) {
  const issues = [];

  // Validate product -> category relationships
  if (data.products && data.categories) {
    const categoryIds = new Set(data.categories.map(c => c.slug));
    
    for (const product of data.products) {
      if (product.category && !categoryIds.has(product.category)) {
        issues.push({
          type: 'missing_category',
          product: product.slug,
          category: product.category
        });
      }
    }
  }

  // Validate review -> product relationships
  if (data.reviews && data.products) {
    const productIds = new Set(data.products.map(p => p.slug));
    
    for (const review of data.reviews) {
      if (review.productId && !productIds.has(review.productId)) {
        issues.push({
          type: 'missing_product',
          review: review.id,
          product: review.productId
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Generate summary report
 * @param {Object} results - Seeding results
 * @returns {Object} Summary report
 */
export function generateSummaryReport(results) {
  const summary = {
    totalCollections: Object.keys(results).length,
    totalInserted: 0,
    totalSkipped: 0,
    totalErrors: 0,
    collections: {},
    timestamp: new Date().toISOString()
  };

  for (const [collection, result] of Object.entries(results)) {
    summary.collections[collection] = {
      inserted: result.inserted || 0,
      skipped: result.skipped || 0,
      errors: result.errors?.length || 0
    };
    
    summary.totalInserted += result.inserted || 0;
    summary.totalSkipped += result.skipped || 0;
    summary.totalErrors += result.errors?.length || 0;
  }

  return summary;
}

/**
 * Log seeding progress
 * @param {string} message - Progress message
 * @param {string} level - Log level (info, warn, error)
 */
export function logProgress(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}