import mongoose from 'mongoose';
import enhancedLogger from './enhancedLogger.js';
import optionalCache from './optionalCache.js';

/**
 * Database Query Optimization Utilities
 * Provides caching, indexing, and performance monitoring for database queries
 */

class QueryOptimizer {
  constructor() {
    this.queryCache = optionalCache;
    this.slowQueryThreshold = 1000; // 1 second
    this.enableQueryLogging = process.env.NODE_ENV === 'development';
    this.queryStats = new Map();
    
    this.setupMongoosePlugins();
  }

  /**
   * Setup Mongoose plugins for query optimization
   */
  setupMongoosePlugins() {
    // Query performance monitoring plugin
    mongoose.plugin((schema) => {
      schema.pre(/^find/, function() {
        this.startTime = Date.now();
        
        if (this.enableQueryLogging) {
          enhancedLogger.debug('Query started', {
            model: this.model.modelName,
            query: this.getQuery(),
            options: this.getOptions()
          });
        }
      });

      schema.post(/^find/, function(result) {
        const duration = Date.now() - this.startTime;
        const modelName = this.model.modelName;
        
        // Track query statistics
        this.trackQueryStats(modelName, duration);
        
        // Log slow queries
        if (duration > this.slowQueryThreshold) {
          enhancedLogger.warn('Slow query detected', {
            model: modelName,
            duration,
            query: this.getQuery(),
            options: this.getOptions(),
            resultCount: Array.isArray(result) ? result.length : 1
          });
        }
      });
    });

    // Enable query explain in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        enhancedLogger.debug('Mongoose query', {
          collection: collectionName,
          method,
          query,
          doc
        });
      });
    }
  }

  /**
   * Track query statistics
   */
  trackQueryStats(modelName, duration) {
    if (!this.queryStats.has(modelName)) {
      this.queryStats.set(modelName, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        slowQueries: 0
      });
    }

    const stats = this.queryStats.get(modelName);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    
    if (duration > this.slowQueryThreshold) {
      stats.slowQueries++;
    }
  }

  /**
   * Cached find operation
   */
  async cachedFind(Model, query = {}, options = {}, cacheOptions = {}) {
    const {
      ttl = 300, // 5 minutes default
      keyPrefix = Model.modelName.toLowerCase(),
      useCache = true
    } = cacheOptions;

    if (!useCache) {
      return Model.find(query, null, options);
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(keyPrefix, query, options);
    
    // Try to get from cache first
    const cached = await this.queryCache.get(cacheKey);
    if (cached) {
      enhancedLogger.debug('Cache hit', {
        model: Model.modelName,
        cacheKey: cacheKey.substring(0, 50)
      });
      return cached;
    }

    // Execute query
    const startTime = Date.now();
    const result = await Model.find(query, null, options).lean();
    const duration = Date.now() - startTime;

    // Cache the result
    await this.queryCache.set(cacheKey, result, ttl);

    enhancedLogger.debug('Query executed and cached', {
      model: Model.modelName,
      duration,
      resultCount: result.length,
      cacheKey: cacheKey.substring(0, 50)
    });

    return result;
  }

  /**
   * Cached findOne operation
   */
  async cachedFindOne(Model, query = {}, options = {}, cacheOptions = {}) {
    const {
      ttl = 300,
      keyPrefix = Model.modelName.toLowerCase(),
      useCache = true
    } = cacheOptions;

    if (!useCache) {
      return Model.findOne(query, null, options);
    }

    const cacheKey = this.generateCacheKey(`${keyPrefix}_one`, query, options);
    
    const cached = await this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await Model.findOne(query, null, options).lean();
    
    if (result) {
      await this.queryCache.set(cacheKey, result, ttl);
    }

    return result;
  }

  /**
   * Cached count operation
   */
  async cachedCount(Model, query = {}, cacheOptions = {}) {
    const {
      ttl = 600, // 10 minutes for counts
      keyPrefix = Model.modelName.toLowerCase(),
      useCache = true
    } = cacheOptions;

    if (!useCache) {
      return Model.countDocuments(query);
    }

    const cacheKey = this.generateCacheKey(`${keyPrefix}_count`, query);
    
    const cached = await this.queryCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await Model.countDocuments(query);
    await this.queryCache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Cached aggregation operation
   */
  async cachedAggregate(Model, pipeline = [], cacheOptions = {}) {
    const {
      ttl = 300,
      keyPrefix = Model.modelName.toLowerCase(),
      useCache = true
    } = cacheOptions;

    if (!useCache) {
      return Model.aggregate(pipeline);
    }

    const cacheKey = this.generateCacheKey(`${keyPrefix}_agg`, pipeline);
    
    const cached = await this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await Model.aggregate(pipeline);
    await this.queryCache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Paginated query with caching
   */
  async paginatedFind(Model, query = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { _id: -1 },
      populate = null,
      select = null,
      useCache = true,
      cacheTTL = 300
    } = options;

    const skip = (page - 1) * limit;
    
    // Generate cache keys
    const queryKey = this.generateCacheKey(
      `${Model.modelName.toLowerCase()}_page`,
      { query, page, limit, sort, populate, select }
    );
    
    const countKey = this.generateCacheKey(
      `${Model.modelName.toLowerCase()}_count`,
      query
    );

    let results, total;

    if (useCache) {
      // Try to get cached results
      [results, total] = await Promise.all([
        this.queryCache.get(queryKey),
        this.queryCache.get(countKey)
      ]);
    }

    // Execute queries if not cached
    const promises = [];
    
    if (!results) {
      let queryBuilder = Model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      if (select) queryBuilder = queryBuilder.select(select);
      if (populate) queryBuilder = queryBuilder.populate(populate);
      
      promises.push(queryBuilder.lean());
    } else {
      promises.push(Promise.resolve(results));
    }

    if (total === null || total === undefined) {
      promises.push(Model.countDocuments(query));
    } else {
      promises.push(Promise.resolve(total));
    }

    [results, total] = await Promise.all(promises);

    // Cache results if not already cached
    if (useCache) {
      const cachePromises = [];
      
      if (!await this.queryCache.exists(queryKey)) {
        cachePromises.push(this.queryCache.set(queryKey, results, cacheTTL));
      }
      
      if (!await this.queryCache.exists(countKey)) {
        cachePromises.push(this.queryCache.set(countKey, total, cacheTTL * 2));
      }
      
      await Promise.all(cachePromises);
    }

    return {
      data: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Invalidate cache for a model
   */
  async invalidateModelCache(modelName, pattern = '*') {
    try {
      const keyPattern = `${modelName.toLowerCase()}_${pattern}`;
      
      // For Redis, we could use SCAN with pattern matching
      // For memory cache, we need to iterate through keys
      if (this.queryCache.isRedisAvailable) {
        // Redis pattern-based deletion would go here
        // This is a simplified version
        await this.queryCache.clear();
      } else {
        // For memory cache, clear all (simplified)
        await this.queryCache.clear();
      }

      enhancedLogger.info('Model cache invalidated', {
        model: modelName,
        pattern
      });
    } catch (error) {
      enhancedLogger.error('Cache invalidation error', {
        error: error.message,
        model: modelName,
        pattern
      });
    }
  }

  /**
   * Generate cache key from query parameters
   */
  generateCacheKey(prefix, ...args) {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(args))
      .digest('hex');
    
    return `${prefix}_${hash}`;
  }

  /**
   * Optimize database indexes
   */
  async optimizeIndexes(Model) {
    try {
      const collection = Model.collection;
      
      // Get current indexes
      const indexes = await collection.indexes();
      
      // Get index usage statistics
      const indexStats = await collection.aggregate([
        { $indexStats: {} }
      ]).toArray();

      // Analyze slow operations
      const slowOps = await this.analyzeSlowOperations(Model);

      enhancedLogger.info('Index optimization analysis', {
        model: Model.modelName,
        indexCount: indexes.length,
        indexStats: indexStats.length,
        slowOpsCount: slowOps.length
      });

      return {
        model: Model.modelName,
        indexes,
        indexStats,
        slowOps,
        recommendations: this.generateIndexRecommendations(indexes, indexStats, slowOps)
      };

    } catch (error) {
      enhancedLogger.error('Index optimization error', {
        error: error.message,
        model: Model.modelName
      });
      return null;
    }
  }

  /**
   * Analyze slow operations from profiler
   */
  async analyzeSlowOperations(Model) {
    try {
      // This would typically query the MongoDB profiler collection
      // For now, return query stats we've collected
      const modelStats = this.queryStats.get(Model.modelName);
      
      if (!modelStats) {
        return [];
      }

      return [{
        model: Model.modelName,
        avgDuration: modelStats.avgDuration,
        slowQueries: modelStats.slowQueries,
        totalQueries: modelStats.count
      }];

    } catch (error) {
      enhancedLogger.error('Slow operation analysis error', {
        error: error.message,
        model: Model.modelName
      });
      return [];
    }
  }

  /**
   * Generate index recommendations
   */
  generateIndexRecommendations(indexes, indexStats, slowOps) {
    const recommendations = [];

    // Check for unused indexes
    indexStats.forEach(stat => {
      if (stat.accesses.ops === 0 && stat.name !== '_id_') {
        recommendations.push({
          type: 'remove_unused_index',
          index: stat.name,
          reason: 'Index has never been used'
        });
      }
    });

    // Check for missing indexes based on slow operations
    slowOps.forEach(op => {
      if (op.avgDuration > this.slowQueryThreshold) {
        recommendations.push({
          type: 'consider_index',
          model: op.model,
          reason: `Model has ${op.slowQueries} slow queries with avg duration ${op.avgDuration}ms`
        });
      }
    });

    return recommendations;
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const stats = {};
    
    for (const [model, modelStats] of this.queryStats.entries()) {
      stats[model] = {
        ...modelStats,
        slowQueryPercentage: (modelStats.slowQueries / modelStats.count) * 100
      };
    }

    return stats;
  }

  /**
   * Reset query statistics
   */
  resetQueryStats() {
    this.queryStats.clear();
    enhancedLogger.info('Query statistics reset');
  }

  /**
   * Batch operations with caching
   */
  async batchFind(Model, queries, cacheOptions = {}) {
    const { ttl = 300, useCache = true } = cacheOptions;
    
    if (!useCache) {
      return Promise.all(queries.map(query => Model.find(query).lean()));
    }

    // Generate cache keys for all queries
    const cacheKeys = queries.map(query => 
      this.generateCacheKey(Model.modelName.toLowerCase(), query)
    );

    // Try to get cached results
    const cachedResults = await this.queryCache.mget(cacheKeys);
    
    // Identify queries that need to be executed
    const uncachedQueries = [];
    const uncachedIndexes = [];
    
    cachedResults.forEach((cached, index) => {
      if (cached === null) {
        uncachedQueries.push(queries[index]);
        uncachedIndexes.push(index);
      }
    });

    // Execute uncached queries
    let freshResults = [];
    if (uncachedQueries.length > 0) {
      freshResults = await Promise.all(
        uncachedQueries.map(query => Model.find(query).lean())
      );

      // Cache fresh results
      const cacheEntries = uncachedIndexes.map((index, i) => [
        cacheKeys[index],
        freshResults[i]
      ]);
      
      await this.queryCache.mset(cacheEntries, ttl);
    }

    // Combine cached and fresh results
    const results = [...cachedResults];
    uncachedIndexes.forEach((index, i) => {
      results[index] = freshResults[i];
    });

    return results;
  }
}

// Create singleton instance
const queryOptimizer = new QueryOptimizer();

export default queryOptimizer;