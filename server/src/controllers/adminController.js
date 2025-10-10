import { User, Product, Order, Category, Review } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import imageService from '../services/imageService.js';
import logger from '../utils/logger.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const { period = '30' } = req.query; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Get basic counts
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    newUsers,
    newOrders,
    pendingOrders,
    lowStockProducts,
    pendingReviews
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Product.countDocuments({ status: 'active' }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    User.countDocuments({ createdAt: { $gte: startDate } }),
    Order.countDocuments({ createdAt: { $gte: startDate } }),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments({
      'stock.trackQuantity': true,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    }),
    Review.countDocuments({ status: 'pending' })
  ]);

  // Get revenue trend for the period
  const revenueTrend = await Order.getRevenueByPeriod('day', startDate);

  // Get top selling products
  const topProducts = await Product.getTopSelling(5, parseInt(period));

  // Get recent orders
  const recentOrders = await Order.find()
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber total status createdAt user');

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsers,
        newOrders,
        pendingOrders,
        lowStockProducts,
        pendingReviews
      },
      trends: {
        revenue: revenueTrend,
        period: parseInt(period)
      },
      topProducts,
      recentOrders
    }
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) filter.role = role;
  if (status) filter.accountStatus = status;

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);

  // Execute query
  const [users, totalUsers] = await Promise.all([
    User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalUsers / limitNum);

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limitNum
      }
    }
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-password -emailVerificationToken -passwordResetToken')
    .lean();

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Get user's order statistics
  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);

  // Get recent orders
  const recentOrders = await Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('orderNumber total status createdAt');

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: {
      user,
      statistics: orderStats[0] || { totalOrders: 0, totalSpent: 0, averageOrderValue: 0 },
      recentOrders
    }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { accountStatus, isActive, suspensionReason } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot modify your own account status', 400, 'CANNOT_MODIFY_SELF'));
  }

  // Update user status
  const updates = {};
  if (accountStatus !== undefined) updates.accountStatus = accountStatus;
  if (isActive !== undefined) updates.isActive = isActive;
  if (suspensionReason !== undefined) updates.suspensionReason = suspensionReason;

  const updatedUser = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  }).select('-password -emailVerificationToken -passwordResetToken');

  logger.info('User status updated by admin', {
    targetUserId: id,
    adminUserId: req.user._id,
    updates,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: {
      user: updatedUser
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF'));
  }

  // Check if user has active orders
  const activeOrders = await Order.countDocuments({
    user: id,
    status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
  });

  if (activeOrders > 0) {
    return next(new AppError('Cannot delete user with active orders', 400, 'USER_HAS_ACTIVE_ORDERS'));
  }

  // Delete user's reviews
  await Review.deleteMany({ user: id });

  // Delete user
  await User.findByIdAndDelete(id);

  logger.info('User deleted by admin', {
    deletedUserId: id,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin only)
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    status,
    dateFrom,
    dateTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);

  // Execute query
  let query = Order.find(filter)
    .populate('user', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  // Add search if provided
  if (search) {
    query = query.populate({
      path: 'user',
      match: {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  const [orders, totalOrders] = await Promise.all([
    query.exec(),
    Order.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalOrders / limitNum);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limitNum
      }
    }
  });
});

// @desc    Get order statistics
// @route   GET /api/admin/orders/stats
// @access  Private (Admin only)
export const getOrderStats = asyncHandler(async (req, res, next) => {
  const { dateFrom, dateTo, period = 'day' } = req.query;

  // Get overall stats
  const overallStats = await Order.getOrderStats(dateFrom, dateTo);

  // Get revenue by period
  const revenueByPeriod = await Order.getRevenueByPeriod(period, dateFrom, dateTo);

  // Get status breakdown
  const statusBreakdown = await Order.aggregate([
    ...(dateFrom || dateTo ? [{
      $match: {
        createdAt: {
          ...(dateFrom && { $gte: new Date(dateFrom) }),
          ...(dateTo && { $lte: new Date(dateTo) })
        }
      }
    }] : []),
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$total' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'Order statistics retrieved successfully',
    data: {
      overall: overallStats[0] || {},
      revenueByPeriod,
      statusBreakdown
    }
  });
});

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private (Admin only)
export const getAllCategories = asyncHandler(async (req, res, next) => {
  const { includeInactive = false } = req.query;

  const categories = await Category.getWithProductCount(includeInactive === 'true');

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: {
      categories
    }
  });
});

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private (Admin only)
export const createCategory = asyncHandler(async (req, res, next) => {
  const categoryData = req.body;

  // Handle image upload if provided
  if (req.file) {
    try {
      const uploadedImage = await imageService.uploadImage(req.file, 'categories');
      categoryData.image = uploadedImage;
    } catch (error) {
      logger.error('Failed to upload category image', error);
      return next(new AppError('Failed to upload image', 500, 'IMAGE_UPLOAD_ERROR'));
    }
  }

  const category = await Category.create(categoryData);

  logger.info('Category created by admin', {
    categoryId: category._id,
    name: category.name,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: {
      category
    }
  });
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin only)
export const updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  let category = await Category.findById(id);

  if (!category) {
    return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  // Handle image upload if provided
  if (req.file) {
    try {
      // Delete old image if exists
      if (category.image && category.image.publicId) {
        await imageService.deleteImage(category.image.publicId);
      }

      const uploadedImage = await imageService.uploadImage(req.file, 'categories');
      updateData.image = uploadedImage;
    } catch (error) {
      logger.error('Failed to upload category image', error);
      return next(new AppError('Failed to upload image', 500, 'IMAGE_UPLOAD_ERROR'));
    }
  }

  category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  logger.info('Category updated by admin', {
    categoryId: id,
    name: category.name,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: {
      category
    }
  });
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin only)
export const deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    return next(new AppError('Cannot delete category with products. Move products to another category first.', 400, 'CATEGORY_HAS_PRODUCTS'));
  }

  // Delete category image if exists
  if (category.image && category.image.publicId) {
    try {
      await imageService.deleteImage(category.image.publicId);
    } catch (error) {
      logger.warn('Failed to delete category image', { categoryId: id, error: error.message });
    }
  }

  await Category.findByIdAndDelete(id);

  logger.info('Category deleted by admin', {
    categoryId: id,
    name: category.name,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
export const getAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30', type = 'overview' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  let analyticsData = {};

  switch (type) {
    case 'sales':
      // Sales analytics
      const salesData = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      analyticsData = { sales: salesData };
      break;

    case 'products':
      // Product analytics
      const [topSellingProducts, lowStockProducts, categoryBreakdown] = await Promise.all([
        Product.getTopSelling(10, parseInt(period)),
        Product.getLowStockProducts(),
        Product.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
          { $unwind: '$category' },
          { $project: { name: '$category.name', count: 1 } }
        ])
      ]);

      analyticsData = {
        topSellingProducts,
        lowStockProducts,
        categoryBreakdown
      };
      break;

    case 'users':
      // User analytics
      const userGrowth = await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
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

      const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      analyticsData = {
        userGrowth,
        usersByRole
      };
      break;

    default:
      // Overview analytics
      const [revenueData, orderData, userStats, productStats] = await Promise.all([
        Order.getRevenueByPeriod('day', startDate),
        Order.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        User.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              new: [{ $match: { createdAt: { $gte: startDate } } }, { $count: 'count' }],
              active: [{ $match: { isActive: true } }, { $count: 'count' }]
            }
          }
        ]),
        Product.aggregate([
          {
            $facet: {
              total: [{ $count: 'count' }],
              active: [{ $match: { status: 'active' } }, { $count: 'count' }],
              lowStock: [
                { $match: { 'stock.trackQuantity': true, $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] } } },
                { $count: 'count' }
              ]
            }
          }
        ])
      ]);

      analyticsData = {
        revenue: revenueData,
        orders: orderData,
        users: userStats[0],
        products: productStats[0]
      };
  }

  res.status(200).json({
    success: true,
    message: 'Analytics data retrieved successfully',
    data: analyticsData
  });
});