import mongoose from 'mongoose';
import { Product, User, Order, Category, Cart, Wishlist, Activity } from '../models/index.js';
import logger from '../utils/logger.js';

class DatabaseOptimizationService {
  // Create optimized indexes for better performance
  async createOptimizedIndexes() {
    try {
      // Skip index creation if disabled
      if (process.env.SKIP_INDEX_CREATION === 'true') {
        logger.info('Skipping database index creation (disabled by environment variable)');
        return;
      }
      
      logger.info('Creating optimized database indexes...');

      // Product indexes for search and filtering
      await Product.collection.createIndex({ status: 1, visibility: 1 });
      await Product.collection.createIndex({ category: 1, status: 1, visibility: 1 });
      await Product.collection.createIndex({ brand: 1, status: 1 });
      await Product.collection.createIndex({ price: 1, status: 1 });
      await Product.collection.createIndex({ 'rating.average': -1, status: 1 });
      await Product.collection.createIndex({ 'sales.totalSold': -1, status: 1 });
      await Product.collection.createIndex({ createdAt: -1, status: 1 });
      await Product.collection.createIndex({ 'stock.quantity': 1, 'stock.trackQuantity': 1 });
      
      // Compound indexes for common queries
      await Product.collection.createIndex({ 
        category: 1, 
        price: 1, 
        status: 1, 
        visibility: 1 
      });
      await Product.collection.createIndex({ 
        brand: 1, 
        category: 1, 
        status: 1 
      });

      // User indexes
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ role: 1, isActive: 1 });
      await User.collection.createIndex({ createdAt: -1 });
      await User.collection.createIndex({ accountStatus: 1 });

      // Order indexes
      await Order.collection.createIndex({ user: 1, createdAt: -1 });
      await Order.collection.createIndex({ status: 1, createdAt: -1 });
      await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });
      await Order.collection.createIndex({ createdAt: -1 });
      await Order.collection.createIndex({ 'items.product': 1 });

      // Category indexes
      await Category.collection.createIndex({ slug: 1 }, { unique: true });
      await Category.collection.createIndex({ parent: 1, isActive: 1 });
      await Category.collection.createIndex({ isActive: 1, displayOrder: 1 });

      // Cart and Wishlist indexes
      await Cart.collection.createIndex({ user: 1 }, { unique: true });
      await Wishlist.collection.createIndex({ user: 1 }, { unique: true });
      await Cart.collection.createIndex({ 'items.product': 1 });
      await Wishlist.collection.createIndex({ 'items.product': 1 });

      // Activity indexes (with TTL)
      await Activity.collection.createIndex({ user: 1, timestamp: -1 });
      await Activity.collection.createIndex({ type: 1, timestamp: -1 });
      await Activity.collection.createIndex({ 
        timestamp: 1 
      }, { 
        expireAfterSeconds: 90 * 24 * 60 * 60 // 90 days
      });

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Error creating database indexes:', error);
      throw error;
    }
  }

  // Analyze query performance
  async analyzeQueryPerformance() {
    try {
      logger.info('Analyzing query performance...');

      const db = mongoose.connection.db;
      
      // Get slow operations
      const slowOps = await db.admin().command({
        currentOp: true,
        'secs_running': { $gte: 1 }
      });

      // Get database stats
      const dbStats = await db.stats();
      
      // Get collection stats
      const collections = ['products', 'users', 'orders', 'categories'];
      const collectionStats = {};
      
      for (const collection of collections) {
        try {
          collectionStats[collection] = await db.collection(collection).stats();
        } catch (error) {
          logger.warn(`Could not get stats for collection ${collection}:`, error.message);
        }
      }

      return {
        slowOperations: slowOps.inprog || [],
        databaseStats: dbStats,
        collectionStats
      };
    } catch (error) {
      logger.error('Error analyzing query performance:', error);
      throw error;
    }
  }

  // Optimize common queries
  getOptimizedQueries() {
    return {
      // Optimized product listing query
      getProductsOptimized: (filters = {}) => {
        const pipeline = [
          {
            $match: {
              status: 'active',
              visibility: 'public',
              ...filters
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
              pipeline: [{ $project: { name: 1, slug: 1 } }]
            }
          },
          {
            $unwind: '$category'
          },
          {
            $project: {
              name: 1,
              slug: 1,
              price: 1,
              comparePrice: 1,
              images: { $slice: ['$images', 1] }, // Only first image
              rating: 1,
              'stock.quantity': 1,
              'stock.trackQuantity': 1,
              category: 1,
              brand: 1,
              createdAt: 1
            }
          }
        ];
        
        return Product.aggregate(pipeline);
      },

      // Optimized order listing for admin
      getOrdersOptimized: (filters = {}) => {
        const pipeline = [
          { $match: filters },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user',
              pipeline: [
                { $project: { firstName: 1, lastName: 1, email: 1 } }
              ]
            }
          },
          {
            $unwind: '$user'
          },
          {
            $project: {
              orderNumber: 1,
              status: 1,
              totalAmount: 1,
              createdAt: 1,
              user: 1,
              itemCount: { $size: '$items' }
            }
          },
          { $sort: { createdAt: -1 } }
        ];
        
        return Order.aggregate(pipeline);
      },

      // Optimized dashboard stats
      getDashboardStatsOptimized: (startDate) => {
        return Promise.all([
          // Total counts with single queries
          User.countDocuments(),
          Product.countDocuments({ status: 'active' }),
          Order.countDocuments(),
          
          // Revenue calculation
          Order.aggregate([
            {
              $match: {
                status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                totalOrders: { $sum: 1 }
              }
            }
          ]),
          
          // New users and orders
          User.countDocuments({ createdAt: { $gte: startDate } }),
          Order.countDocuments({ createdAt: { $gte: startDate } }),
          
          // Low stock products
          Product.countDocuments({
            'stock.trackQuantity': true,
            $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
          })
        ]);
      }
    };
  }

  // Cache frequently accessed data
  async setupCaching() {
    try {
      logger.info('Setting up data caching...');
      
      // This would integrate with Redis if available
      // For now, we'll use in-memory caching for categories and other static data
      
      const cacheData = {
        categories: await Category.find({ isActive: true })
          .select('name slug parent displayOrder')
          .lean(),
        
        brands: await Product.distinct('brand', { 
          status: 'active', 
          visibility: 'public' 
        }),
        
        priceRanges: await Product.aggregate([
          {
            $match: { status: 'active', visibility: 'public' }
          },
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' }
            }
          }
        ])
      };

      // Store in global cache (in production, use Redis)
      global.appCache = {
        ...global.appCache,
        ...cacheData,
        lastUpdated: new Date()
      };

      logger.info('Data caching setup completed');
      return cacheData;
    } catch (error) {
      logger.error('Error setting up caching:', error);
      throw error;
    }
  }

  // Monitor database performance
  async monitorPerformance() {
    try {
      const db = mongoose.connection.db;
      
      // Get server status
      const serverStatus = await db.admin().command({ serverStatus: 1 });
      
      // Get profiling data if enabled
      let profilingData = null;
      try {
        profilingData = await db.collection('system.profile')
          .find({})
          .sort({ ts: -1 })
          .limit(10)
          .toArray();
      } catch (error) {
        // Profiling might not be enabled
        logger.debug('Database profiling not available');
      }

      return {
        connections: serverStatus.connections,
        opcounters: serverStatus.opcounters,
        memory: serverStatus.mem,
        profiling: profilingData
      };
    } catch (error) {
      logger.error('Error monitoring database performance:', error);
      throw error;
    }
  }

  // Initialize all optimizations
  async initialize() {
    try {
      logger.info('Initializing database optimizations...');
      
      await this.createOptimizedIndexes();
      await this.setupCaching();
      
      // Schedule periodic cache updates
      setInterval(async () => {
        try {
          await this.setupCaching();
        } catch (error) {
          logger.error('Error updating cache:', error);
        }
      }, 30 * 60 * 1000); // Update every 30 minutes

      logger.info('Database optimizations initialized successfully');
    } catch (error) {
      logger.error('Error initializing database optimizations:', error);
      throw error;
    }
  }
}

export default new DatabaseOptimizationService();