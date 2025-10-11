/**
 * Seed Helper Utilities
 * 
 * Utility functions to support database seeding operations
 */

import mongoose from 'mongoose';
import { User, Product, Category, Order, Review } from '../models/index.js';

/**
 * Check if database is empty
 */
export const isDatabaseEmpty = async () => {
  const collections = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Review.countDocuments()
  ]);
  
  return collections.every(count => count === 0);
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  const stats = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Review.countDocuments()
  ]);
  
  return {
    users: stats[0],
    products: stats[1],
    categories: stats[2],
    orders: stats[3],
    reviews: stats[4],
    total: stats.reduce((sum, count) => sum + count, 0)
  };
};

/**
 * Validate environment for seeding
 */
export const validateSeedEnvironment = () => {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn if running in production
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: You are about to seed data in PRODUCTION environment!');
    console.warn('   This will DELETE ALL existing data.');
    console.warn('   Press Ctrl+C to cancel, or wait 10 seconds to continue...');
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('🚀 Proceeding with production seeding...');
        resolve();
      }, 10000);
    });
  }
  
  return Promise.resolve();
};

/**
 * Clear all collections safely
 */
export const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data...');
  
  const collections = [
    { model: Review, name: 'Reviews' },
    { model: Order, name: 'Orders' },
    { model: Product, name: 'Products' },
    { model: User, name: 'Users' },
    { model: Category, name: 'Categories' }
  ];
  
  for (const { model, name } of collections) {
    const count = await model.countDocuments();
    if (count > 0) {
      await model.deleteMany({});
      console.log(`   ✅ Cleared ${count} ${name}`);
    }
  }
};

/**
 * Create indexes after seeding
 */
export const ensureIndexes = async () => {
  console.log('📊 Ensuring database indexes...');
  
  const models = [User, Product, Category, Order, Review];
  
  for (const model of models) {
    try {
      await model.ensureIndexes();
      console.log(`   ✅ Indexes created for ${model.modelName}`);
    } catch (error) {
      console.warn(`   ⚠️  Index creation warning for ${model.modelName}:`, error.message);
    }
  }
};

/**
 * Generate realistic timestamps for historical data
 */
export const generateTimestamp = (daysAgo = 0, hoursAgo = 0) => {
  const now = new Date();
  const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));
  return timestamp;
};

/**
 * Generate random number within range
 */
export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate random array element
 */
export const randomChoice = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate random boolean with probability
 */
export const randomBoolean = (probability = 0.5) => {
  return Math.random() < probability;
};

/**
 * Generate UK postcode
 */
export const generateUKPostcode = () => {
  const areas = ['SW1A', 'M1', 'EH2', 'CF10', 'B1', 'LS1', 'NE1', 'S1', 'L1', 'BS1'];
  const area = randomChoice(areas);
  const district = randomBetween(1, 9);
  const sector = randomChoice(['AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH']);
  
  return `${area} ${district}${sector}`;
};

/**
 * Generate realistic product SKU
 */
export const generateSKU = (brand, category, index) => {
  const brandCode = brand.substring(0, 3).toUpperCase();
  const categoryCode = category.substring(0, 3).toUpperCase();
  const number = String(index).padStart(4, '0');
  
  return `${brandCode}-${categoryCode}-${number}`;
};

/**
 * Generate realistic order number
 */
export const generateOrderNumber = (date = new Date()) => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = randomBetween(1000, 9999);
  
  return `ORD${year}${month}${day}${sequence}`;
};

/**
 * Calculate realistic shipping cost
 */
export const calculateShipping = (subtotal, weight = 1) => {
  if (subtotal >= 50) return 0; // Free shipping over £50
  if (weight > 5) return 9.99; // Heavy items
  return 4.99; // Standard shipping
};

/**
 * Generate realistic review text variations
 */
export const generateReviewVariations = (baseReview, rating) => {
  const positiveAdjectives = ['excellent', 'outstanding', 'amazing', 'fantastic', 'superb', 'brilliant'];
  const negativeAdjectives = ['disappointing', 'poor', 'mediocre', 'average', 'lacking'];
  
  const variations = {
    5: {
      titles: ['Absolutely love it!', 'Perfect product!', 'Exceeded expectations!', 'Highly recommend!'],
      adjectives: positiveAdjectives
    },
    4: {
      titles: ['Very good product', 'Happy with purchase', 'Good value', 'Solid choice'],
      adjectives: [...positiveAdjectives, 'good', 'solid', 'reliable']
    },
    3: {
      titles: ['It\'s okay', 'Average product', 'Does the job', 'Mixed feelings'],
      adjectives: ['decent', 'okay', 'average', 'acceptable']
    },
    2: {
      titles: ['Not impressed', 'Could be better', 'Some issues', 'Disappointing'],
      adjectives: negativeAdjectives
    },
    1: {
      titles: ['Very disappointed', 'Poor quality', 'Waste of money', 'Terrible'],
      adjectives: [...negativeAdjectives, 'awful', 'terrible', 'useless']
    }
  };
  
  const ratingVariations = variations[rating] || variations[3];
  
  return {
    title: randomChoice(ratingVariations.titles),
    adjective: randomChoice(ratingVariations.adjectives)
  };
};

/**
 * Validate seeded data integrity
 */
export const validateSeededData = async () => {
  console.log('🔍 Validating seeded data integrity...');
  
  const issues = [];
  
  // Check for orphaned products
  const productsWithoutCategory = await Product.countDocuments({ category: null });
  if (productsWithoutCategory > 0) {
    issues.push(`${productsWithoutCategory} products without category`);
  }
  
  // Check for orders without users
  const ordersWithoutUser = await Order.countDocuments({ user: null });
  if (ordersWithoutUser > 0) {
    issues.push(`${ordersWithoutUser} orders without user`);
  }
  
  // Check for reviews without products or users
  const reviewsWithoutProduct = await Review.countDocuments({ product: null });
  const reviewsWithoutUser = await Review.countDocuments({ user: null });
  if (reviewsWithoutProduct > 0) {
    issues.push(`${reviewsWithoutProduct} reviews without product`);
  }
  if (reviewsWithoutUser > 0) {
    issues.push(`${reviewsWithoutUser} reviews without user`);
  }
  
  // Check for categories without products
  const categoriesWithProducts = await Category.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $match: {
        'products.0': { $exists: false },
        parent: null // Only check root categories
      }
    }
  ]);
  
  if (categoriesWithProducts.length > 0) {
    issues.push(`${categoriesWithProducts.length} root categories without products`);
  }
  
  if (issues.length > 0) {
    console.warn('⚠️  Data integrity issues found:');
    issues.forEach(issue => console.warn(`   - ${issue}`));
  } else {
    console.log('   ✅ Data integrity validation passed');
  }
  
  return issues;
};

/**
 * Generate performance report after seeding
 */
export const generateSeedReport = async (startTime) => {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const stats = await getDatabaseStats();
  
  console.log('\n📊 Seeding Performance Report');
  console.log('============================');
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Total documents created: ${stats.total}`);
  console.log(`Average documents/second: ${(stats.total / duration).toFixed(2)}`);
  console.log('\nCollection breakdown:');
  console.log(`  Categories: ${stats.categories}`);
  console.log(`  Users: ${stats.users}`);
  console.log(`  Products: ${stats.products}`);
  console.log(`  Orders: ${stats.orders}`);
  console.log(`  Reviews: ${stats.reviews}`);
  
  return {
    duration,
    stats,
    documentsPerSecond: stats.total / duration
  };
};

export default {
  isDatabaseEmpty,
  getDatabaseStats,
  validateSeedEnvironment,
  clearDatabase,
  ensureIndexes,
  generateTimestamp,
  randomBetween,
  randomChoice,
  randomBoolean,
  generateUKPostcode,
  generateSKU,
  generateOrderNumber,
  calculateShipping,
  generateReviewVariations,
  validateSeededData,
  generateSeedReport
};