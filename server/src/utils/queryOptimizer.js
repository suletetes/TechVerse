import mongoose from 'mongoose';
import logger from './logger.js';

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.slowQueryThreshold = 100; // milliseconds
  }

  // Optimize MongoDB queries with intelligent population
  optimizePopulation(query, populateFields = []) {
    if (!populateFields.length) return query;

    // Smart population - only populate necessary fields
    populateFields.forEach(field => {
      if (typeof field === 'string') {
        // Simple field population
        query = query.populate(field);
      } else if (typeof field === 'object') {
        // Advanced population with field selection
        const { path, select, match, options } = field;
        
        const populateOptions = {};
        if (select) populateOptions.select = select;
        if (match) populateOptions.match = match;
        if (options) Object.assign(populateOptions, options);
        
        query = query.populate(path, populateOptions.select, populateOptions.match, populateOptions);
      }
    });

    return query;
  }

  // Add intelligent field selection
  optimizeFieldSelection(query, fields = null, excludeFields = []) {
    if (fields) {
      // Include only specified fields
      query = query.select(fields);
    } else if (excludeFields.length > 0) {
      // Exclude specified fields
      const exclusion = excludeFields.map(field => `-${field}`).join(' ');
      query = query.select(exclusion);
    }

    return query;
  }

  // Optimize sorting with compound indexes
  optimizeSorting(query, sortOptions = {}) {
    if (Object.keys(sortOptions).length === 0) return query;

    // Convert sort options to MongoDB format
    const sortQuery = {};
    
    Object.entries(sortOptions).forEach(([field, direction]) => {
      sortQuery[field] = direction === 'desc' ? -1 : 1;
    });

    return query.sort(sortQuery);
  }

  // Add intelligent pagination
  optimizePagination(query, page = 1, limit = 20, maxLimit = 100) {
    const actualLimit = Math.min(limit, maxLimit);
    const skip = (page - 1) * actualLimit;

    return query.skip(skip).limit(actualLimit);
  }

  // Build optimized aggregation pipeline
  buildAggregationPipeline(stages = []) {
    const pipeline = [];

    stages.forEach(stage => {
      switch (stage.type) {
        case 'match':
          pipeline.push({ $match: stage.conditions });
          break;
          
        case 'lookup':
          pipeline.push({
            $lookup: {
              from: stage.from,
              localField: stage.localField,
              foreignField: stage.foreignField,
              as: stage.as,
              ...(stage.pipeline && { pipeline: stage.pipeline })
            }
          });
          break;
          
        case 'unwind':
          pipeline.push({
            $unwind: {
              path: stage.path,
              preserveNullAndEmptyArrays: stage.preserveNullAndEmptyArrays || false
            }
          });
          break;
          
        case 'group':
          pipeline.push({
            $group: {
              _id: stage.id,
              ...stage.fields
            }
          });
          break;
          
        case 'sort':
          pipeline.push({ $sort: stage.fields });
          break;
          
        case 'limit':
          pipeline.push({ $limit: stage.count });
          break;
          
        case 'skip':
          pipeline.push({ $skip: stage.count });
          break;
          
        case 'project':
          pipeline.push({ $project: stage.fields });
          break;
          
        case 'addFields':
          pipeline.push({ $addFields: stage.fields });
          break;
          
        default:
          logger.warn('Unknown aggregation stage type:', stage.type);
      }
    });

    return pipeline;
  }

  // Execute optimized query with monitoring
  async executeQuery(model, queryBuilder, options = {}) {
    const startTime = Date.now();
    
    try {
      // Apply optimizations
      let query = queryBuilder;
      
      if (options.populate) {
        query = this.optimizePopulation(query, options.populate);
      }
      
      if (options.select || options.exclude) {
        query = this.optimizeFieldSelection(query, options.select, options.exclude);
      }
      
      if (options.sort) {
        query = this.optimizeSorting(query, options.sort);
      }
      
      if (options.page || options.limit) {
        query = this.optimizePagination(query, options.page, options.limit, options.maxLimit);
      }

      // Add lean option for better performance (returns plain objects)
      if (options.lean !== false) {
        query = query.lean();
      }

      // Execute query
      const result = await query.exec();
      
      // Monitor performance
      const duration = Date.now() - startTime;
      
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          model: model.modelName,
          duration: `${duration}ms`,
          options: JSON.stringify(options)
        });
      }

      logger.debug('Query executed', {
        model: model.modelName,
        duration: `${duration}ms`,
        resultCount: Array.isArray(result) ? result.length : 1
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Query execution failed', {
        model: model.modelName,
        duration: `${duration}ms`,
        error: error.message,
        options: JSON.stringify(options)
      });
      
      throw error;
    }
  }

  // Execute optimized aggregation
  async executeAggregation(model, stages, options = {}) {
    const startTime = Date.now();
    
    try {
      const pipeline = this.buildAggregationPipeline(stages);
      
      // Add pagination to aggregation if specified
      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: options.limit });
      }

      // Execute aggregation
      const result = await model.aggregate(pipeline);
      
      // Monitor performance
      const duration = Date.now() - startTime;
      
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow aggregation detected', {
          model: model.modelName,
          duration: `${duration}ms`,
          stageCount: stages.length
        });
      }

      logger.debug('Aggregation executed', {
        model: model.modelName,
        duration: `${duration}ms`,
        resultCount: result.length,
        stageCount: stages.length
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Aggregation execution failed', {
        model: model.modelName,
        duration: `${duration}ms`,
        error: error.message,
        stageCount: stages.length
      });
      
      throw error;
    }
  }

  // Batch operations for better performance
  async executeBatch(operations = []) {
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(operations.map(async (op) => {
        switch (op.type) {
          case 'find':
            return this.executeQuery(op.model, op.model.find(op.conditions), op.options);
            
          case 'findOne':
            return this.executeQuery(op.model, op.model.findOne(op.conditions), op.options);
            
          case 'aggregate':
            return this.executeAggregation(op.model, op.stages, op.options);
            
          case 'count':
            return op.model.countDocuments(op.conditions);
            
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
      }));

      const duration = Date.now() - startTime;
      
      logger.debug('Batch operations completed', {
        operationCount: operations.length,
        duration: `${duration}ms`
      });

      return results;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Batch operations failed', {
        operationCount: operations.length,
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  }

  // Query result caching
  async executeWithCache(cacheKey, queryFunction, ttl = 300) {
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      
      if (Date.now() - cached.timestamp < ttl * 1000) {
        logger.debug('Query cache hit', { key: cacheKey });
        return cached.data;
      } else {
        this.queryCache.delete(cacheKey);
      }
    }

    // Execute query
    const result = await queryFunction();
    
    // Cache result
    this.queryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    logger.debug('Query cached', { key: cacheKey });
    
    return result;
  }

  // Index analysis and recommendations
  async analyzeIndexUsage(model) {
    try {
      const collection = model.collection;
      
      // Get index stats
      const indexStats = await collection.indexStats();
      
      // Get current indexes
      const indexes = await collection.indexes();
      
      // Analyze usage
      const analysis = {
        totalIndexes: indexes.length,
        unusedIndexes: [],
        efficientIndexes: [],
        recommendations: []
      };

      indexStats.forEach((stat, index) => {
        const indexInfo = indexes[index];
        
        if (stat.accesses.ops === 0) {
          analysis.unusedIndexes.push(indexInfo);
        } else if (stat.accesses.ops > 1000) {
          analysis.efficientIndexes.push({
            ...indexInfo,
            operations: stat.accesses.ops
          });
        }
      });

      // Generate recommendations
      if (analysis.unusedIndexes.length > 0) {
        analysis.recommendations.push({
          type: 'remove_unused',
          message: `Consider removing ${analysis.unusedIndexes.length} unused indexes`,
          indexes: analysis.unusedIndexes.map(idx => idx.name)
        });
      }

      logger.info('Index analysis completed', {
        model: model.modelName,
        analysis
      });

      return analysis;

    } catch (error) {
      logger.error('Index analysis failed', {
        model: model.modelName,
        error: error.message
      });
      
      return null;
    }
  }

  // Clear query cache
  clearCache(pattern = null) {
    if (pattern) {
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
    
    logger.debug('Query cache cleared', { pattern });
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.queryCache.values())).length
    };
  }
}

// Create and export singleton instance
const queryOptimizer = new QueryOptimizer();

// Helper functions for common query patterns
export const optimizedFind = (model, conditions = {}, options = {}) => {
  return queryOptimizer.executeQuery(
    model,
    model.find(conditions),
    options
  );
};

export const optimizedFindOne = (model, conditions = {}, options = {}) => {
  return queryOptimizer.executeQuery(
    model,
    model.findOne(conditions),
    options
  );
};

export const optimizedAggregate = (model, stages = [], options = {}) => {
  return queryOptimizer.executeAggregation(model, stages, options);
};

export const optimizedCount = async (model, conditions = {}) => {
  const startTime = Date.now();
  
  try {
    const count = await model.countDocuments(conditions);
    const duration = Date.now() - startTime;
    
    logger.debug('Count query executed', {
      model: model.modelName,
      duration: `${duration}ms`,
      count
    });
    
    return count;
    
  } catch (error) {
    logger.error('Count query failed', {
      model: model.modelName,
      error: error.message
    });
    
    throw error;
  }
};

export default queryOptimizer;