import { User, Product, Order, Review } from '../models/index.js';
import logger from '../utils/logger.js';

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch new data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Get sales analytics
  async getSalesAnalytics(startDate, endDate, groupBy = 'day') {
    const cacheKey = `sales_${startDate}_${endDate}_${groupBy}`;
    
    return await this.getCachedData(cacheKey, async () => {
      const matchStage = {
        status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
      };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const groupStage = this.getGroupStage(groupBy);

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: groupStage,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$total' },
            items: { $sum: { $size: '$items' } }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const results = await Order.aggregate(pipeline);
      
      // Defensive guard: ensure results is an array before calling reduce
      console.debug('[analytics] Revenue results:', Array.isArray(results), results && results.length);
      const safeResults = Array.isArray(results) ? results : [];
      
      // Calculate totals
      const totals = safeResults.reduce((acc, item) => ({
        totalRevenue: acc.totalRevenue + (item?.revenue ?? 0),
        totalOrders: acc.totalOrders + (item?.orders ?? 0),
        totalItems: acc.totalItems + (item?.items ?? 0)
      }), { totalRevenue: 0, totalOrders: 0, totalItems: 0 });

      return {
        data: safeResults,
        totals: {
          ...totals,
          averageOrderValue: totals.totalOrders > 0 ? totals.totalRevenue / totals.totalOrders : 0
        }
      };
    });
  }

  // Get product analytics
  async getProductAnalytics(startDate, endDate) {
    const cacheKey = `products_${startDate}_${endDate}`;
    
    return await this.getCachedData(cacheKey, async () => {
      // Top selling products
      const topSelling = await Product.aggregate([
        { $match: { status: 'active' } },
        { $sort: { 'sales.totalSold': -1 } },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            totalSold: '$sales.totalSold',
            revenue: '$sales.revenue',
            price: 1,
            rating: '$rating.average'
          }
        }
      ]);

      // Products by category
      const categoryBreakdown = await Product.aggregate([
        { $match: { status: 'active' } },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          $group: {
            _id: '$category',
            name: { $first: '$categoryInfo.name' },
            count: { $sum: 1 },
            totalSold: { $sum: '$sales.totalSold' },
            revenue: { $sum: '$sales.revenue' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Low stock products
      const lowStock = await Product.find({
        'stock.trackQuantity': true,
        $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
      }).select('name stock.quantity stock.lowStockThreshold');

      // Product performance metrics
      const performanceMetrics = await Product.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            averageRating: { $avg: '$rating.average' },
            totalStock: { $sum: '$stock.quantity' }
          }
        }
      ]);

      return {
        topSelling,
        categoryBreakdown,
        lowStock,
        metrics: performanceMetrics[0] || {}
      };
    });
  }

  // Get user analytics
  async getUserAnalytics(startDate, endDate) {
    const cacheKey = `users_${startDate}_${endDate}`;
    
    return await this.getCachedData(cacheKey, async () => {
      const matchStage = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      // User growth over time
      const userGrowth = await User.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // User demographics
      const demographics = await User.aggregate([
        {
          $facet: {
            byRole: [
              { $group: { _id: '$role', count: { $sum: 1 } } }
            ],
            byStatus: [
              { $group: { _id: '$accountStatus', count: { $sum: 1 } } }
            ],
            byActivity: [
              { $group: { _id: '$isActive', count: { $sum: 1 } } }
            ]
          }
        }
      ]);

      // Top customers by spending
      const topCustomers = await User.aggregate([
        { $match: { role: 'user' } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            email: 1,
            totalSpent: 1,
            totalOrders: 1,
            averageOrderValue: 1
          }
        }
      ]);

      return {
        growth: userGrowth,
        demographics: demographics[0],
        topCustomers
      };
    });
  }

  // Get order analytics
  async getOrderAnalytics(startDate, endDate) {
    const cacheKey = `orders_${startDate}_${endDate}`;
    
    return await this.getCachedData(cacheKey, async () => {
      const matchStage = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      // Order status breakdown
      const statusBreakdown = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$total' }
          }
        }
      ]);

      // Average order processing time
      const processingTimes = await Order.aggregate([
        {
          $match: {
            ...matchStage,
            status: { $in: ['delivered', 'shipped'] },
            confirmedAt: { $exists: true },
            shippedAt: { $exists: true }
          }
        },
        {
          $project: {
            processingTime: {
              $divide: [
                { $subtract: ['$shippedAt', '$confirmedAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averageProcessingTime: { $avg: '$processingTime' },
            minProcessingTime: { $min: '$processingTime' },
            maxProcessingTime: { $max: '$processingTime' }
          }
        }
      ]);

      // Payment method breakdown
      const paymentMethods = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$payment.method',
            count: { $sum: 1 },
            totalValue: { $sum: '$total' }
          }
        }
      ]);

      return {
        statusBreakdown,
        processingTimes: processingTimes[0] || {},
        paymentMethods
      };
    });
  }

  // Get review analytics
  async getReviewAnalytics(startDate, endDate) {
    const cacheKey = `reviews_${startDate}_${endDate}`;
    
    return await this.getCachedData(cacheKey, async () => {
      const matchStage = { status: 'approved' };
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      // Rating distribution
      const ratingDistribution = await Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Average rating over time
      const ratingTrends = await Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Most reviewed products
      const mostReviewed = await Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$product',
            reviewCount: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $project: {
            productName: '$productInfo.name',
            reviewCount: 1,
            averageRating: 1
          }
        },
        { $sort: { reviewCount: -1 } },
        { $limit: 10 }
      ]);

      return {
        ratingDistribution,
        ratingTrends,
        mostReviewed
      };
    });
  }

  // Get comprehensive dashboard data
  async getDashboardAnalytics(period = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [sales, products, users, orders, reviews] = await Promise.all([
      this.getSalesAnalytics(startDate, endDate),
      this.getProductAnalytics(startDate, endDate),
      this.getUserAnalytics(startDate, endDate),
      this.getOrderAnalytics(startDate, endDate),
      this.getReviewAnalytics(startDate, endDate)
    ]);

    return {
      period,
      sales,
      products,
      users,
      orders,
      reviews,
      generatedAt: new Date()
    };
  }

  // Helper method to get group stage for date grouping
  getGroupStage(groupBy) {
    switch (groupBy) {
      case 'hour':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
      case 'day':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
      case 'week':
        return {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
      case 'month':
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
      case 'year':
        return {
          year: { $year: '$createdAt' }
        };
      default:
        return {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    logger.info('Analytics cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new AnalyticsService();