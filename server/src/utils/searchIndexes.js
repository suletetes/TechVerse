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

    // Specifications search index
    await Product.collection.createIndex(
      { 'specifications.category': 1, 'specifications.name': 1, 'specifications.value': 1 },
      { name: 'specifications_search' }
    );

    // Tags index for tag-based filtering
    await Product.collection.createIndex(
      { tags: 1, status: 1, visibility: 1 },
      { name: 'tags_status_visibility' }
    );

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
    await User.collection.createIndex(
      { email: 1 },
      { name: 'user_email_unique', unique: true }
    );

    await User.collection.createIndex(
      { role: 1, isActive: 1 },
      { name: 'user_role_status' }
    );

    await User.collection.createIndex(
      { createdAt: -1 },
      { name: 'user_created_desc' }
    );

    // Order indexes for performance
    await Order.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'order_user_date' }
    );

    await Order.collection.createIndex(
      { orderNumber: 1 },
      { name: 'order_number_unique', unique: true }
    );

    await Order.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'order_status_date' }
    );

    await Order.collection.createIndex(
      { 'items.product': 1 },
      { name: 'order_items_product' }
    );

    // Cart indexes for performance
    await Cart.collection.createIndex(
      { user: 1 },
      { name: 'cart_user_unique', unique: true }
    );

    await Cart.collection.createIndex(
      { expiresAt: 1 },
      { name: 'cart_expires_ttl', expireAfterSeconds: 0 }
    );

    await Cart.collection.createIndex(
      { 'items.product': 1 },
      { name: 'cart_items_product' }
    );

    // Wishlist indexes for performance
    await Wishlist.collection.createIndex(
      { user: 1 },
      { name: 'wishlist_user_unique', unique: true }
    );

    await Wishlist.collection.createIndex(
      { 'items.product': 1 },
      { name: 'wishlist_items_product' }
    );

    await Wishlist.collection.createIndex(
      { 'items.addedAt': -1 },
      { name: 'wishlist_items_date' }
    );

    // Review indexes for performance
    await Review.collection.createIndex(
      { product: 1, createdAt: -1 },
      { name: 'review_product_date' }
    );

    await Review.collection.createIndex(
      { user: 1, createdAt: -1 },
      { name: 'review_user_date' }
    );

    await Review.collection.createIndex(
      { rating: 1, product: 1 },
      { name: 'review_rating_product' }
    );

    await Review.collection.createIndex(
      { isVerifiedPurchase: 1, product: 1 },
      { name: 'review_verified_product' }
    );

    await Review.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'review_status_date' }
    );

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