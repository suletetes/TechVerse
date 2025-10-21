/**
 * Cache Invalidation Manager
 * Implements intelligent cache invalidation for write operations
 * Optimizes cache performance by invalidating only relevant cache entries
 */

import intelligentCache from './intelligentCache.js';
import configManager from '../../config/ConfigManager.js';

class CacheInvalidationManager {
  constructor() {
    this.invalidationRules = new Map();
    this.pendingInvalidations = new Set();
    this.batchInvalidationTimer = null;
    this.config = {
      batchDelay: 100, // Batch invalidations for 100ms
      enableLogging: configManager.get('DEBUG_MODE', false)
    };

    this.initializeDefaultRules();
  }

  /**
   * Initialize default invalidation rules for common operations
   */
  initializeDefaultRules() {
    // Product-related invalidations
    this.addRule('products', {
      patterns: [
        /^products/,
        /^categories/,
        /^featured/,
        /^top-sellers/,
        /^latest/,
        /^quick-picks/,
        /^weekly-deals/,
        /^search/
      ],
      operations: ['POST', 'PUT', 'PATCH', 'DELETE'],
      scope: 'related'
    });

    // User-related invalidations
    this.addRule('users', {
      patterns: [
        /^users/,
        /^auth\/profile/,
        /^cart/,
        /^wishlist/,
        /^orders/
      ],
      operations: ['POST', 'PUT', 'PATCH', 'DELETE'],
      scope: 'user'
    });

    // Admin-related invalidations
    this.addRule('admin', {
      patterns: [
        /^admin/,
        /^products/,
        /^categories/,
        /^users/,
        /^orders/
      ],
      operations: ['POST', 'PUT', 'PATCH', 'DELETE'],
      scope: 'global'
    });

    // Cart-related invalidations
    this.addRule('cart', {
      patterns: [
        /^cart/,
        /^products\/.*\/availability/,
        /^shipping/
      ],
      operations: ['POST', 'PUT', 'PATCH', 'DELETE'],
      scope: 'user'
    });

    // Order-related invalidations
    this.addRule('orders', {
      patterns: [
        /^orders/,
        /^cart/,
        /^products\/.*\/availability/,
        /^admin\/orders/,
        /^admin\/analytics/
      ],
      operations: ['POST', 'PUT', 'PATCH'],
      scope: 'related'
    });

    // Authentication invalidations
    this.addRule('auth', {
      patterns: [
        /^auth/,
        /^users\/profile/
      ],
      operations: ['POST', 'PUT', 'PATCH'],
      scope: 'user'
    });
  }

  /**
   * Add invalidation rule
   * @param {string} name - Rule name
   * @param {Object} rule - Rule configuration
   */
  addRule(name, rule) {
    this.invalidationRules.set(name, {
      patterns: rule.patterns || [],
      operations: rule.operations || ['POST', 'PUT', 'PATCH', 'DELETE'],
      scope: rule.scope || 'related',
      customHandler: rule.customHandler || null,
      priority: rule.priority || 'normal',
      delay: rule.delay || 0
    });

    if (this.config.enableLogging) {
      console.log('📋 Cache invalidation rule added:', name, rule);
    }
  }

  /**
   * Remove invalidation rule
   * @param {string} name - Rule name
   */
  removeRule(name) {
    const removed = this.invalidationRules.delete(name);
    
    if (this.config.enableLogging && removed) {
      console.log('🗑️ Cache invalidation rule removed:', name);
    }
    
    return removed;
  }

  /**
   * Process cache invalidation for API operation
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} options - Additional options
   */
  async processInvalidation(endpoint, method, options = {}) {
    const matchingRules = this.findMatchingRules(endpoint, method);
    
    if (matchingRules.length === 0) {
      return;
    }

    const invalidations = [];

    for (const rule of matchingRules) {
      if (rule.customHandler) {
        // Use custom invalidation handler
        const customInvalidations = await rule.customHandler(endpoint, method, options);
        invalidations.push(...customInvalidations);
      } else {
        // Use standard invalidation patterns
        const standardInvalidations = this.generateStandardInvalidations(rule, endpoint, method, options);
        invalidations.push(...standardInvalidations);
      }
    }

    // Process invalidations based on priority and batching
    this.scheduleInvalidations(invalidations);
  }

  /**
   * Find matching invalidation rules
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Array} Matching rules
   */
  findMatchingRules(endpoint, method) {
    const matchingRules = [];

    for (const [name, rule] of this.invalidationRules.entries()) {
      // Check if method matches
      if (!rule.operations.includes(method)) {
        continue;
      }

      // Check if endpoint matches any pattern
      const matches = rule.patterns.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(endpoint);
        }
        return endpoint.includes(pattern);
      });

      if (matches) {
        matchingRules.push({ name, ...rule });
      }
    }

    return matchingRules.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate standard invalidations based on rule
   * @param {Object} rule - Invalidation rule
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} options - Additional options
   * @returns {Array} Invalidation instructions
   */
  generateStandardInvalidations(rule, endpoint, method, options) {
    const invalidations = [];

    switch (rule.scope) {
      case 'global':
        // Invalidate all cache entries
        invalidations.push({
          type: 'clear',
          priority: rule.priority,
          delay: rule.delay
        });
        break;

      case 'related':
        // Invalidate related cache entries based on patterns
        for (const pattern of rule.patterns) {
          invalidations.push({
            type: 'pattern',
            pattern,
            priority: rule.priority,
            delay: rule.delay
          });
        }
        break;

      case 'user':
        // Invalidate user-specific cache entries
        const userId = options.userId || this.extractUserIdFromEndpoint(endpoint);
        if (userId) {
          invalidations.push({
            type: 'user',
            userId,
            patterns: rule.patterns,
            priority: rule.priority,
            delay: rule.delay
          });
        } else {
          // Fallback to pattern-based invalidation
          for (const pattern of rule.patterns) {
            invalidations.push({
              type: 'pattern',
              pattern,
              priority: rule.priority,
              delay: rule.delay
            });
          }
        }
        break;

      case 'specific':
        // Invalidate specific cache key
        const cacheKey = options.cacheKey || this.generateCacheKey(endpoint, options);
        invalidations.push({
          type: 'specific',
          key: cacheKey,
          priority: rule.priority,
          delay: rule.delay
        });
        break;

      case 'tags':
        // Invalidate by cache tags
        const tags = options.tags || this.extractTagsFromEndpoint(endpoint);
        if (tags && tags.length > 0) {
          invalidations.push({
            type: 'tags',
            tags,
            priority: rule.priority,
            delay: rule.delay
          });
        }
        break;
    }

    return invalidations;
  }

  /**
   * Schedule invalidations with batching and priority
   * @param {Array} invalidations - Invalidation instructions
   */
  scheduleInvalidations(invalidations) {
    // Add to pending invalidations
    invalidations.forEach(invalidation => {
      this.pendingInvalidations.add(invalidation);
    });

    // Clear existing timer
    if (this.batchInvalidationTimer) {
      clearTimeout(this.batchInvalidationTimer);
    }

    // Schedule batch processing
    this.batchInvalidationTimer = setTimeout(() => {
      this.processPendingInvalidations();
    }, this.config.batchDelay);
  }

  /**
   * Process all pending invalidations
   */
  async processPendingInvalidations() {
    if (this.pendingInvalidations.size === 0) {
      return;
    }

    const invalidations = Array.from(this.pendingInvalidations);
    this.pendingInvalidations.clear();

    // Group by priority and delay
    const grouped = this.groupInvalidationsByPriorityAndDelay(invalidations);

    // Process each group
    for (const group of grouped) {
      if (group.delay > 0) {
        setTimeout(() => this.executeInvalidations(group.invalidations), group.delay);
      } else {
        await this.executeInvalidations(group.invalidations);
      }
    }
  }

  /**
   * Group invalidations by priority and delay
   * @param {Array} invalidations - Invalidation instructions
   * @returns {Array} Grouped invalidations
   */
  groupInvalidationsByPriorityAndDelay(invalidations) {
    const groups = new Map();

    invalidations.forEach(invalidation => {
      const key = `${invalidation.priority}-${invalidation.delay || 0}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          priority: invalidation.priority,
          delay: invalidation.delay || 0,
          invalidations: []
        });
      }
      
      groups.get(key).invalidations.push(invalidation);
    });

    // Sort by priority (high first)
    return Array.from(groups.values()).sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Execute invalidations
   * @param {Array} invalidations - Invalidation instructions
   */
  async executeInvalidations(invalidations) {
    let invalidatedCount = 0;

    for (const invalidation of invalidations) {
      try {
        switch (invalidation.type) {
          case 'clear':
            intelligentCache.clear();
            invalidatedCount += 1;
            break;

          case 'pattern':
            intelligentCache.invalidate(invalidation.pattern);
            invalidatedCount += 1;
            break;

          case 'specific':
            intelligentCache.invalidate(invalidation.key);
            invalidatedCount += 1;
            break;

          case 'tags':
            intelligentCache.invalidateByTags(invalidation.tags);
            invalidatedCount += 1;
            break;

          case 'user':
            // Invalidate user-specific entries
            for (const pattern of invalidation.patterns) {
              const userPattern = new RegExp(`${pattern.source}.*${invalidation.userId}`);
              intelligentCache.invalidate(userPattern);
            }
            invalidatedCount += 1;
            break;
        }
      } catch (error) {
        console.error('Cache invalidation failed:', invalidation, error);
      }
    }

    if (this.config.enableLogging && invalidatedCount > 0) {
      console.log('🗑️ Cache invalidations executed:', {
        count: invalidatedCount,
        types: [...new Set(invalidations.map(i => i.type))]
      });
    }
  }

  /**
   * Extract user ID from endpoint
   * @param {string} endpoint - API endpoint
   * @returns {string|null} User ID
   */
  extractUserIdFromEndpoint(endpoint) {
    // Try to extract user ID from common patterns
    const patterns = [
      /\/users\/([^\/]+)/,
      /\/user\/([^\/]+)/,
      /userId=([^&]+)/,
      /user_id=([^&]+)/
    ];

    for (const pattern of patterns) {
      const match = endpoint.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract cache tags from endpoint
   * @param {string} endpoint - API endpoint
   * @returns {Array} Cache tags
   */
  extractTagsFromEndpoint(endpoint) {
    const tags = [];

    if (endpoint.includes('/products/')) {
      tags.push('products');
    }
    if (endpoint.includes('/categories/')) {
      tags.push('categories');
    }
    if (endpoint.includes('/users/')) {
      tags.push('users');
    }
    if (endpoint.includes('/orders/')) {
      tags.push('orders');
    }
    if (endpoint.includes('/admin/')) {
      tags.push('admin');
    }

    return tags;
  }

  /**
   * Generate cache key from endpoint and options
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional options
   * @returns {string} Cache key
   */
  generateCacheKey(endpoint, options) {
    let key = endpoint;

    if (options.params) {
      const params = new URLSearchParams(options.params).toString();
      key += `?${params}`;
    }

    if (options.userId) {
      key += `_user_${options.userId}`;
    }

    return key;
  }

  /**
   * Add custom invalidation handler
   * @param {string} name - Handler name
   * @param {Function} handler - Custom handler function
   */
  addCustomHandler(name, handler) {
    if (this.invalidationRules.has(name)) {
      const rule = this.invalidationRules.get(name);
      rule.customHandler = handler;
      this.invalidationRules.set(name, rule);
    } else {
      this.addRule(name, { customHandler: handler });
    }
  }

  /**
   * Invalidate cache immediately (bypass batching)
   * @param {string|RegExp} pattern - Pattern to invalidate
   */
  invalidateImmediate(pattern) {
    intelligentCache.invalidate(pattern);
    
    if (this.config.enableLogging) {
      console.log('⚡ Immediate cache invalidation:', pattern);
    }
  }

  /**
   * Invalidate by tags immediately
   * @param {string|Array} tags - Tags to invalidate
   */
  invalidateByTagsImmediate(tags) {
    intelligentCache.invalidateByTags(tags);
    
    if (this.config.enableLogging) {
      console.log('⚡ Immediate cache invalidation by tags:', tags);
    }
  }

  /**
   * Get invalidation statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      rulesCount: this.invalidationRules.size,
      pendingInvalidations: this.pendingInvalidations.size,
      rules: Array.from(this.invalidationRules.keys()),
      batchingEnabled: this.config.batchDelay > 0
    };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all pending invalidations
   */
  clearPendingInvalidations() {
    this.pendingInvalidations.clear();
    
    if (this.batchInvalidationTimer) {
      clearTimeout(this.batchInvalidationTimer);
      this.batchInvalidationTimer = null;
    }
  }

  /**
   * Export invalidation rules
   * @returns {Object} Exported rules
   */
  exportRules() {
    const rules = {};
    
    for (const [name, rule] of this.invalidationRules.entries()) {
      rules[name] = {
        patterns: rule.patterns.map(p => p instanceof RegExp ? p.source : p),
        operations: rule.operations,
        scope: rule.scope,
        priority: rule.priority,
        delay: rule.delay
      };
    }
    
    return rules;
  }

  /**
   * Import invalidation rules
   * @param {Object} rules - Rules to import
   */
  importRules(rules) {
    for (const [name, rule] of Object.entries(rules)) {
      const processedRule = {
        ...rule,
        patterns: rule.patterns.map(p => 
          typeof p === 'string' && p.startsWith('/') && p.endsWith('/') 
            ? new RegExp(p.slice(1, -1)) 
            : p
        )
      };
      
      this.addRule(name, processedRule);
    }
  }
}

// Create and export singleton instance
const cacheInvalidationManager = new CacheInvalidationManager();

export default cacheInvalidationManager;
export { CacheInvalidationManager };