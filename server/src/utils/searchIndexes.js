/**
 * Search Performance Optimization - Database Indexes
 * Creates indexes to improve search query performance
 */

import { Product, Category, User, Order, Cart, Wishlist, Review } from '../models/index.js';
import logger from './logger.js';

/**
 * Create search indexes for better performance
 */
export const createSearchIndexes = async () => {
  try {
    logger.info('Creating search performance indexes...');

    // Text search index for products
    // Note: The Product model already defines the text search index
    // We skip creating it here to avoid conflicts
    // The index will be automatically created by Mongoose when the model loads

    // Compound indexes for common search filters
    // Note: These indexes may already exist from the Product model
    // We use try-catch to skip if they already exist
    const indexes = [
      { fields: { category: 1, status: 1, visibility: 1 }, name: 'category_status_visibility' },
      { fields: { brand: 1, status: 1, visibility: 1 }, name: 'brand_status_visibility' },
      { fields: { price: 1, status: 1, visibility: 1 }, name: 'price_status_visibility' },
      { fields: { 'rating.average': -1, status: 1, visibility: 1 }, name: 'rating_status_visibility' },
      { fields: { 'stock.quantity': 1, status: 1, visibility: 1 }, name: 'stock_status_visibility' },
      { fields: { createdAt: -1 }, name: 'created_date_desc' },
      { fields: { 'sales.totalSold': -1 }, name: 'popularity_desc' },
      { fields: { featured: 1, status: 1, visibility: 1 }, name: 'featured_status_visibility' }
    ];

    for (const index of indexes) {
      try {
        await Product.collection.createIndex(index.fields, { name: index.name });
      } catch (error) {
        // Skip if index already exists
        if (error.code === 85 || error.message.includes('already exists')) {
          // Index already exists, skip silently
        } else {
          throw error;
        }
      }
    }

    // Compound index for advanced filtering
    try {
      await Product.collection.createIndex(
        {
          category: 1,
          brand: 1,
          price: 1,
          'rating.average': -1,
          'stock.quantity': 1,
          status: 1,
          visibility: 1
        },
        { name: 'advanced_search_compound' }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    // Specifications search index
    try {
      await Product.collection.createIndex(
        { 'specifications.category': 1, 'specifications.name': 1, 'specifications.value': 1 },
        { name: 'specifications_search' }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    // Tags index for tag-based filtering
    try {
      await Product.collection.createIndex(
        { tags: 1, status: 1, visibility: 1 },
        { name: 'tags_status_visibility' }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    // Category indexes
    // Note: Text index already created by fix script as 'category_search_index'
    // Skip creating it here to avoid conflicts
    
    try {
      await Category.collection.createIndex(
        { isActive: 1, name: 1 },
        { name: 'active_categories' }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    // User indexes for performance
    try {
      await User.collection.createIndex(
        { email: 1 },
        { name: 'user_email_unique', unique: true }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    try {
      await User.collection.createIndex(
        { role: 1, isActive: 1 },
        { name: 'user_role_status' }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    try {
      await User.collection.createIndex(
        { createdAt: -1 },
        { name: 'user_created_desc' }
      );
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        // Index already exists, skip silently
      } else {
        throw error;
      }
    }

    // Order indexes for performance
    const orderIndexes = [
      { fields: { user: 1, createdAt: -1 }, name: 'order_user_date' },
      { fields: { orderNumber: 1 }, name: 'order_number_unique', options: { unique: true } },
      { fields: { status: 1, createdAt: -1 }, name: 'order_status_date' },
      { fields: { 'items.product': 1 }, name: 'order_items_product' }
    ];

    for (const index of orderIndexes) {
      try {
        await Order.collection.createIndex(index.fields, { name: index.name, ...index.options });
      } catch (error) {
        if (error.code === 85 || error.message.includes('already exists')) {
          // Index already exists, skip silently
        } else {
          throw error;
        }
      }
    }

    // Cart indexes for performance
    const cartIndexes = [
      { fields: { user: 1 }, name: 'cart_user_unique', options: { unique: true } },
      { fields: { expiresAt: 1 }, name: 'cart_expires_ttl', options: { expireAfterSeconds: 0 } },
      { fields: { 'items.product': 1 }, name: 'cart_items_product' }
    ];

    for (const index of cartIndexes) {
      try {
        await Cart.collection.createIndex(index.fields, { name: index.name, ...index.options });
      } catch (error) {
        if (error.code === 85 || error.message.includes('already exists')) {
          // Index already exists, skip silently
        } else {
          throw error;
        }
      }
    }

    // Wishlist indexes for performance
    const wishlistIndexes = [
      { fields: { user: 1 }, name: 'wishlist_user_unique', options: { unique: true } },
      { fields: { 'items.product': 1 }, name: 'wishlist_items_product' },
      { fields: { 'items.addedAt': -1 }, name: 'wishlist_items_date' }
    ];

    for (const index of wishlistIndexes) {
      try {
        await Wishlist.collection.createIndex(index.fields, { name: index.name, ...index.options });
      } catch (error) {
        if (error.code === 85 || error.message.includes('already exists')) {
          // Index already exists, skip silently
        } else {
          throw error;
        }
      }
    }

    // Review indexes for performance
    const reviewIndexes = [
      { fields: { product: 1, createdAt: -1 }, name: 'review_product_date' },
      { fields: { user: 1, createdAt: -1 }, name: 'review_user_date' },
      { fields: { rating: 1, product: 1 }, name: 'review_rating_product' },
      { fields: { isVerifiedPurchase: 1, product: 1 }, name: 'review_verified_product' },
      { fields: { status: 1, createdAt: -1 }, name: 'review_status_date' }
    ];

    for (const index of reviewIndexes) {
      try {
        await Review.collection.createIndex(index.fields, { name: index.name });
      } catch (error) {
        if (error.code === 85 || error.message.includes('already exists')) {
          // Index already exists, skip silently
        } else {
          throw error;
        }
      }
    }

    logger.info('All database indexes created successfully');
  } catch (error) {
    logger.error('Error creating search indexes:', error);
    throw error;
  }
};

/**
 * Drop all search indexes (for maintenance)
 */
export const dropSearchIndexes = async () => {
  try {
    logger.info('Dropping search indexes...');

    const indexesToDrop = [
      'product_search_index',
      'category_status_visibility',
      'brand_status_visibility',
      'price_status_visibility',
      'rating_status_visibility',
      'stock_status_visibility',
      'created_date_desc',
      'popularity_desc',
      'featured_status_visibility',
      'advanced_search_compound',
      'specifications_search',
      'tags_status_visibility',
      'category_search_index',
      'active_categories'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await Product.collection.dropIndex(indexName);
        logger.info(`Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code !== 27) { // Index not found error
          logger.warn(`Failed to drop index ${indexName}:`, error.message);
        }
      }
    }

    logger.info('Search indexes dropped successfully');
  } catch (error) {
    logger.error('Error dropping search indexes:', error);
    throw error;
  }
};

/**
 * Get index statistics for monitoring
 */
export const getSearchIndexStats = async () => {
  try {
    const productIndexes = await Product.collection.listIndexes().toArray();
    const categoryIndexes = await Category.collection.listIndexes().toArray();

    return {
      productIndexes: productIndexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        size: idx.size || 'unknown'
      })),
      categoryIndexes: categoryIndexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        size: idx.size || 'unknown'
      }))
    };
  } catch (error) {
    logger.error('Error getting index stats:', error);
    return { productIndexes: [], categoryIndexes: [] };
  }
};

/**
 * Analyze search query performance
 */
export const analyzeSearchPerformance = async (query) => {
  try {
    const startTime = Date.now();
    
    // Execute the query with explain
    const explanation = await Product.find(query).explain('executionStats');
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return {
      executionTime,
      totalDocsExamined: explanation.executionStats.totalDocsExamined,
      totalDocsReturned: explanation.executionStats.totalDocsReturned,
      indexesUsed: explanation.executionStats.executionStages?.indexName || 'COLLSCAN',
      isEfficient: explanation.executionStats.totalDocsExamined <= explanation.executionStats.totalDocsReturned * 2
    };
  } catch (error) {
    logger.error('Error analyzing search performance:', error);
    return null;
  }
};

export default {
  createSearchIndexes,
  dropSearchIndexes,
  getSearchIndexStats,
  analyzeSearchPerformance
};