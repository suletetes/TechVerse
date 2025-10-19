import mongoose from 'mongoose';
import logger from './logger.js';
import { Product, User, Order, Category } from '../models/index.js';

class PerformanceOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueries = [];
    this.indexRecommendations = [];
  }

  // Monitor query performance
  startQueryMonitoring() {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      const startTime = Date.now();
      
      // Track query execution time
      const originalExec = mongoose.Query.prototype.exec;
      mongoose.Query.prototype.exec = function() {
        const queryStartTime = Date.now();
        const result = originalExec.apply(this, arguments);
        
        if (result && result.then) {
          return result.then(res => {
            const executionTime = Date.now() - queryStartTime;
            this.recordQueryStats(collectionName, method, query, executionTime);
            return res;
          });
        }
        
        const executionTime = Date.now() - queryStartTime;
        this.recordQueryStats(collectionName, method, query, executionTime);
        return result;
      }.bind(this);
    });
  }

  recordQueryStats(collection, method, query, executionTime) {
    const queryKey = `${collection}.${method}`;
    
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        queries: []
      });
    }
    
    const stats = this.queryStats.get(queryKey);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.queries.push({ query, executionTime, timestamp: new Date() });
    
    // Keep only last 100 queries per type
    if (stats.queries.length > 100) {
      stats.queries = stats.queries.slice(-100);
    }
    
    // Flag slow queries (>100ms)
    if (executionTime > 100) {
      this.slowQueries.push({
        collection,
        method,
        query,
        executionTime,
        timestamp: new Date()
      });
      
      // Keep only last 50 slow queries
      if (this.slowQueries.length > 50) {
        this.slowQueries = this.slowQueries.slice(-50);
      }
    }
  }

  // Analyze current indexes
  async analyzeIndexes() {
    const collections = ['products', 'users', 'orders', 'categories'];
    const indexAnalysis = {};
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const indexes = await collection.indexes();
        const stats = await collection.stats();
        
        indexAnalysis[collectionName] = {
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique || false,
            sparse: idx.sparse || false,
            background: idx.background || false
          })),
          stats: {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            storageSize: stats.storageSize,
            totalIndexSize: stats.totalIndexSize,
            indexSizes: stats.indexSizes
          }
        };
      } catch (error) {
        logger.error(`Error analyzing indexes for ${collectionName}:`, error);
        indexAnalysis[collectionName] = { error: error.message };
      }
    }
    
    return indexAnalysis;
  }

  // Check for missing indexes based on common query patterns
  async checkMissingIndexes() {
    const recommendations = [];
    
    // Product model index recommendations
    const productRecommendations = await this.analyzeProductIndexes();
    recommendations.push(...productRecommendations);
    
    // User model index recommendations
    const userRecommendations = await this.analyzeUserIndexes();
    recommendations.push(...userRecommendations);
    
    // Order model index recommendations
    const orderRecommendations = await this.analyzeOrderIndexes();
    recommendations.push(...orderRecommendations);
    
    // Category model index recommendations
    const categoryRecommendations = await this.analyzeCategoryIndexes();
    recommendations.push(...categoryRecommendations);
    
    this.indexRecommendations = recommendations;
    return recommendations;
  }

  async analyzeProductIndexes() {
    const recommendations = [];
    const collection = mongoose.connection.db.collection('products');
    const existingIndexes = await collection.indexes();
    const indexNames = existingIndexes.map(idx => Object.keys(idx.key).join('_'));
    
    // Check for common query patterns
    const commonQueries = [
      { fields: ['status', 'visibility', 'sections'], reason: 'Section-based product queries' },
      { fields: ['category', 'status', 'visibility'], reason: 'Category filtering with status' },
      { fields: ['brand', 'status', 'visibility'], reason: 'Brand filtering with status' },
      { fields: ['price', 'status', 'visibility'], reason: 'Price range filtering' },
      { fields: ['rating.average', 'status', 'visibility'], reason: 'Rating-based sorting' },
      { fields: ['sales.totalSold', 'status', 'visibility'], reason: 'Top sellers queries' },
      { fields: ['createdAt', 'status', 'visibility'], reason: 'Latest products queries' },
      { fields: ['featured', 'status', 'visibility'], reason: 'Featured products queries' },
      { fields: ['stock.quantity', 'stock.trackQuantity'], reason: 'Stock management queries' }
    ];
    
    for (const query of commonQueries) {
      const indexName = query.fields.join('_');
      if (!indexNames.includes(indexName)) {
        recommendations.push({
          collection: 'products',
          index: query.fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
          reason: query.reason,
          priority: 'high'
        });
      }
    }
    
    return recommendations;
  }

  async analyzeUserIndexes() {
    const recommendations = [];
    const collection = mongoose.connection.db.collection('users');
    const existingIndexes = await collection.indexes();
    const indexNames = existingIndexes.map(idx => Object.keys(idx.key).join('_'));
    
    const commonQueries = [
      { fields: ['email', 'isActive'], reason: 'Login and user lookup queries' },
      { fields: ['role', 'isActive'], reason: 'Admin user filtering' },
      { fields: ['accountStatus', 'isActive'], reason: 'Account status filtering' },
      { fields: ['lastLogin'], reason: 'User activity tracking' },
      { fields: ['totalSpent'], reason: 'Customer value analysis' },
      { fields: ['referralCode'], reason: 'Referral system lookups' }
    ];
    
    for (const query of commonQueries) {
      const indexName = query.fields.join('_');
      if (!indexNames.includes(indexName)) {
        recommendations.push({
          collection: 'users',
          index: query.fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
          reason: query.reason,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  async analyzeOrderIndexes() {
    const recommendations = [];
    const collection = mongoose.connection.db.collection('orders');
    const existingIndexes = await collection.indexes();
    const indexNames = existingIndexes.map(idx => Object.keys(idx.key).join('_'));
    
    const commonQueries = [
      { fields: ['user', 'status', 'createdAt'], reason: 'User order history with status filtering' },
      { fields: ['status', 'createdAt'], reason: 'Order management by status and date' },
      { fields: ['payment.status', 'createdAt'], reason: 'Payment status tracking' },
      { fields: ['items.product'], reason: 'Product sales tracking' },
      { fields: ['tracking.trackingNumber'], reason: 'Order tracking lookups' },
      { fields: ['fraudScore'], reason: 'Fraud detection queries' },
      { fields: ['orderNumber'], reason: 'Order lookup by number' }
    ];
    
    for (const query of commonQueries) {
      const indexName = query.fields.join('_');
      if (!indexNames.includes(indexName)) {
        recommendations.push({
          collection: 'orders',
          index: query.fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
          reason: query.reason,
          priority: 'high'
        });
      }
    }
    
    return recommendations;
  }

  async analyzeCategoryIndexes() {
    const recommendations = [];
    const collection = mongoose.connection.db.collection('categories');
    const existingIndexes = await collection.indexes();
    const indexNames = existingIndexes.map(idx => Object.keys(idx.key).join('_'));
    
    const commonQueries = [
      { fields: ['parent', 'isActive', 'displayOrder'], reason: 'Category hierarchy queries' },
      { fields: ['isFeatured', 'isActive'], reason: 'Featured categories' },
      { fields: ['showInMenu', 'isActive', 'displayOrder'], reason: 'Menu category queries' },
      { fields: ['slug'], reason: 'Category lookup by slug' }
    ];
    
    for (const query of commonQueries) {
      const indexName = query.fields.join('_');
      if (!indexNames.includes(indexName)) {
        recommendations.push({
          collection: 'categories',
          index: query.fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
          reason: query.reason,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  // Create recommended indexes
  async createRecommendedIndexes(recommendations = null) {
    const indexesToCreate = recommendations || this.indexRecommendations;
    const results = [];
    
    for (const recommendation of indexesToCreate) {
      try {
        const collection = mongoose.connection.db.collection(recommendation.collection);
        
        // Check if index already exists
        const existingIndexes = await collection.indexes();
        const indexKey = JSON.stringify(recommendation.index);
        const exists = existingIndexes.some(idx => JSON.stringify(idx.key) === indexKey);
        
        if (!exists) {
          await collection.createIndex(recommendation.index, { background: true });
          results.push({
            collection: recommendation.collection,
            index: recommendation.index,
            status: 'created',
            reason: recommendation.reason
          });
          logger.info(`Created index on ${recommendation.collection}:`, recommendation.index);
        } else {
          results.push({
            collection: recommendation.collection,
            index: recommendation.index,
            status: 'exists',
            reason: recommendation.reason
          });
        }
      } catch (error) {
        results.push({
          collection: recommendation.collection,
          index: recommendation.index,
          status: 'error',
          error: error.message,
          reason: recommendation.reason
        });
        logger.error(`Error creating index on ${recommendation.collection}:`, error);
      }
    }
    
    return results;
  }

  // Analyze query performance
  async analyzeQueryPerformance() {
    const analysis = {
      totalQueries: 0,
      slowQueries: this.slowQueries.length,
      averageExecutionTime: 0,
      queryBreakdown: {},
      recommendations: []
    };
    
    let totalTime = 0;
    let totalQueries = 0;
    
    for (const [queryKey, stats] of this.queryStats) {
      analysis.queryBreakdown[queryKey] = {
        count: stats.count,
        avgTime: Math.round(stats.avgTime * 100) / 100,
        maxTime: stats.maxTime,
        totalTime: stats.totalTime
      };
      
      totalTime += stats.totalTime;
      totalQueries += stats.count;
      
      // Generate recommendations for slow queries
      if (stats.avgTime > 50) {
        analysis.recommendations.push({
          query: queryKey,
          issue: `Average execution time is ${Math.round(stats.avgTime)}ms`,
          suggestion: 'Consider adding appropriate indexes or optimizing query structure'
        });
      }
    }
    
    analysis.totalQueries = totalQueries;
    analysis.averageExecutionTime = totalQueries > 0 ? Math.round((totalTime / totalQueries) * 100) / 100 : 0;
    
    return analysis;
  }

  // Check for request deduplication issues
  async checkRequestDeduplication() {
    const issues = [];
    
    // Analyze recent queries for potential duplicates
    const recentQueries = [];
    for (const [queryKey, stats] of this.queryStats) {
      const recent = stats.queries.filter(q => 
        Date.now() - q.timestamp.getTime() < 60000 // Last minute
      );
      
      if (recent.length > 0) {
        recentQueries.push({
          queryKey,
          queries: recent
        });
      }
    }
    
    // Look for identical queries within short time windows
    for (const queryGroup of recentQueries) {
      const duplicates = new Map();
      
      for (const query of queryGroup.queries) {
        const queryStr = JSON.stringify(query.query);
        if (!duplicates.has(queryStr)) {
          duplicates.set(queryStr, []);
        }
        duplicates.get(queryStr).push(query);
      }
      
      for (const [queryStr, instances] of duplicates) {
        if (instances.length > 1) {
          // Check if queries happened within 1 second of each other
          instances.sort((a, b) => a.timestamp - b.timestamp);
          for (let i = 1; i < instances.length; i++) {
            const timeDiff = instances[i].timestamp - instances[i-1].timestamp;
            if (timeDiff < 1000) { // Less than 1 second apart
              issues.push({
                type: 'potential_duplicate',
                queryKey: queryGroup.queryKey,
                query: queryStr,
                timeDifference: timeDiff,
                instances: instances.length,
                suggestion: 'Implement request deduplication or caching'
              });
              break;
            }
          }
        }
      }
    }
    
    return {
      issues,
      totalIssues: issues.length,
      recommendations: issues.length > 0 ? [
        'Implement request deduplication middleware',
        'Add caching layer for frequently accessed data',
        'Use debouncing for user-triggered requests',
        'Implement proper loading states to prevent multiple requests'
      ] : []
    };
  }

  // Optimize image serving
  async optimizeImageServing() {
    const recommendations = [];
    
    // Check for image optimization opportunities
    try {
      const products = await Product.find({}, 'images').limit(100);
      let totalImages = 0;
      let unoptimizedImages = 0;
      
      for (const product of products) {
        totalImages += product.images.length;
        
        for (const image of product.images) {
          // Check if image URL suggests it's not optimized
          if (!image.url.includes('webp') && !image.url.includes('optimized')) {
            unoptimizedImages++;
          }
        }
      }
      
      if (unoptimizedImages > 0) {
        recommendations.push({
          type: 'image_optimization',
          issue: `${unoptimizedImages} out of ${totalImages} images may not be optimized`,
          suggestions: [
            'Implement WebP format conversion',
            'Add image compression middleware',
            'Use CDN for image delivery',
            'Implement responsive image sizes',
            'Add lazy loading for images'
          ]
        });
      }
      
      // Check static asset serving configuration
      recommendations.push({
        type: 'static_assets',
        suggestions: [
          'Enable gzip compression for static assets',
          'Set appropriate cache headers (max-age: 31536000 for images)',
          'Use ETags for cache validation',
          'Implement progressive image loading',
          'Consider using a CDN for global distribution'
        ]
      });
      
    } catch (error) {
      logger.error('Error analyzing image optimization:', error);
    }
    
    return {
      recommendations,
      totalRecommendations: recommendations.length
    };
  }

  // Generate comprehensive performance report
  async generatePerformanceReport() {
    logger.info('Generating comprehensive performance report...');
    
    const report = {
      timestamp: new Date(),
      database: {
        indexes: await this.analyzeIndexes(),
        missingIndexes: await this.checkMissingIndexes(),
        queryPerformance: await this.analyzeQueryPerformance()
      },
      requests: await this.checkRequestDeduplication(),
      images: await this.optimizeImageServing(),
      summary: {
        criticalIssues: 0,
        recommendations: 0,
        performanceScore: 100
      }
    };
    
    // Calculate performance score
    let score = 100;
    
    // Deduct points for slow queries
    if (report.database.queryPerformance.slowQueries > 0) {
      score -= Math.min(report.database.queryPerformance.slowQueries * 5, 30);
    }
    
    // Deduct points for missing indexes
    if (report.database.missingIndexes.length > 0) {
      score -= Math.min(report.database.missingIndexes.length * 3, 20);
    }
    
    // Deduct points for request duplication issues
    if (report.requests.issues.length > 0) {
      score -= Math.min(report.requests.issues.length * 2, 15);
    }
    
    report.summary.performanceScore = Math.max(score, 0);
    report.summary.criticalIssues = report.database.queryPerformance.slowQueries + 
                                   report.requests.issues.length;
    report.summary.recommendations = report.database.missingIndexes.length + 
                                   report.requests.recommendations.length + 
                                   report.images.totalRecommendations;
    
    return report;
  }

  // Auto-optimize based on analysis
  async autoOptimize(options = {}) {
    const { createIndexes = true, logOnly = false } = options;
    const results = {
      indexesCreated: [],
      optimizationsApplied: [],
      errors: []
    };
    
    try {
      // Create missing indexes
      if (createIndexes) {
        const missingIndexes = await this.checkMissingIndexes();
        const highPriorityIndexes = missingIndexes.filter(idx => idx.priority === 'high');
        
        if (!logOnly) {
          const indexResults = await this.createRecommendedIndexes(highPriorityIndexes);
          results.indexesCreated = indexResults.filter(r => r.status === 'created');
        } else {
          logger.info('Would create indexes:', highPriorityIndexes);
        }
      }
      
      // Log optimization recommendations
      const imageOptimizations = await this.optimizeImageServing();
      results.optimizationsApplied.push(...imageOptimizations.recommendations);
      
      logger.info('Performance optimization completed:', {
        indexesCreated: results.indexesCreated.length,
        optimizationsRecommended: results.optimizationsApplied.length
      });
      
    } catch (error) {
      logger.error('Error during auto-optimization:', error);
      results.errors.push(error.message);
    }
    
    return results;
  }

  // Clear monitoring data
  clearStats() {
    this.queryStats.clear();
    this.slowQueries = [];
    this.indexRecommendations = [];
  }

  // Get current stats
  getStats() {
    return {
      queryStats: Object.fromEntries(this.queryStats),
      slowQueries: this.slowQueries,
      indexRecommendations: this.indexRecommendations
    };
  }
}

export default new PerformanceOptimizer();