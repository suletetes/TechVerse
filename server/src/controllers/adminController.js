import { User, Product, Order, Category, Review, Activity } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import imageService from '../services/imageService.js';
import logger from '../utils/logger.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { period = '30' } = req.query; // days
    
    logger.info('[admin/dashboard] Request received', { 
      requestId, 
      period, 
      query: req.query 
    });
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic counts with error handling
    let totalUsers = 0;
    let totalProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    let newUsers = 0;
    let newOrders = 0;
    let pendingOrders = 0;
    let lowStockProducts = 0;
    let pendingReviews = 0;

    try {
      totalUsers = await User.countDocuments() || 0;
      logger.info(`[admin/dashboard] Users count: ${totalUsers}`, { requestId });
    } catch (e) { logger.warn('Error counting users:', e.message); }

    try {
      totalProducts = await Product.countDocuments({ status: 'active' }) || 0;
      logger.info(`[admin/dashboard] Products count: ${totalProducts}`, { requestId });
    } catch (e) { logger.warn('Error counting products:', e.message); }

    try {
      totalOrders = await Order.countDocuments() || 0;
    } catch (e) { logger.warn('Error counting orders:', e.message); }

    try {
      const revenueResult = await Order.aggregate([
        { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      totalRevenue = (Array.isArray(revenueResult) && revenueResult[0]) ? revenueResult[0].total || 0 : 0;
    } catch (e) { logger.warn('Error calculating revenue:', e.message); }

    try {
      newUsers = await User.countDocuments({ createdAt: { $gte: startDate } }) || 0;
    } catch (e) { logger.warn('Error counting new users:', e.message); }

    try {
      newOrders = await Order.countDocuments({ createdAt: { $gte: startDate } }) || 0;
    } catch (e) { logger.warn('Error counting new orders:', e.message); }

    try {
      pendingOrders = await Order.countDocuments({ status: 'pending' }) || 0;
    } catch (e) { logger.warn('Error counting pending orders:', e.message); }

    try {
      lowStockProducts = await Product.countDocuments({
        'stock.trackQuantity': true,
        $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
      }) || 0;
    } catch (e) { logger.warn('Error counting low stock products:', e.message); }

    try {
      pendingReviews = await Review.countDocuments({ status: 'pending' }) || 0;
    } catch (e) { logger.warn('Error counting pending reviews:', e.message); }

    // Get revenue trend for the period
    let revenueTrend = [];
    try {
      logger.info(`[admin/dashboard] Getting revenue trend`, { requestId });
      const revenueTrendRaw = await Order.getRevenueByPeriod('day', startDate);
      logger.info(`[admin/dashboard] Revenue trend raw result:`, { requestId, type: typeof revenueTrendRaw, isArray: Array.isArray(revenueTrendRaw) });
      revenueTrend = Array.isArray(revenueTrendRaw) ? revenueTrendRaw : [];
      logger.info(`[admin/dashboard] Revenue trend retrieved: ${revenueTrend.length} items`, { requestId });
    } catch (e) { 
      logger.error('Error getting revenue trend:', { requestId, error: e.message, stack: e.stack });
      revenueTrend = [];
    }

    // Get top selling products
    let topProducts = [];
    try {
      logger.info(`[admin/dashboard] Getting top products`, { requestId });
      const topProductsRaw = await Product.getTopSelling(5, parseInt(period));
      topProducts = Array.isArray(topProductsRaw) ? topProductsRaw : [];
      logger.info(`[admin/dashboard] Top products retrieved: ${topProducts.length} items`, { requestId });
    } catch (e) { 
      logger.warn('Error getting top products:', e.message);
      topProducts = [];
    }

    // Get recent orders
    let recentOrders = [];
    try {
      logger.info(`[admin/dashboard] Getting recent orders`, { requestId });
      const recentOrdersRaw = await Order.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber total status createdAt user');
      recentOrders = Array.isArray(recentOrdersRaw) ? recentOrdersRaw : [];
      logger.info(`[admin/dashboard] Recent orders retrieved: ${recentOrders.length} items`, { requestId });
    } catch (e) { 
      logger.warn('Error getting recent orders:', e.message);
      recentOrders = [];
    }

    logger.info(`[admin/dashboard] Building response data`, { requestId });
    
    const responseData = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
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
    };
    
    logger.info(`[admin/dashboard] Response data built successfully`, { requestId });

    logger.info('[admin/dashboard] Response prepared', { 
      requestId, 
      overviewKeys: Object.keys(responseData.overview),
      trendsCount: responseData.trends.revenue.length,
      topProductsCount: responseData.topProducts.length,
      recentOrdersCount: responseData.recentOrders.length
    });
    
    // Send response with proper error handling
    try {
      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: responseData
      });
      logger.debug('[admin/dashboard] Response sent successfully', { requestId });
    } catch (jsonError) {
      logger.error('[admin/dashboard] JSON serialization error', { requestId, error: jsonError.message });
      // Send simplified response if JSON serialization fails
      res.status(200).json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          overview: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            newUsers,
            newOrders,
            pendingOrders,
            lowStockProducts,
            pendingReviews
          },
          trends: { revenue: [], period: parseInt(period) },
          topProducts: [],
          recentOrders: []
        }
      });
    }
  } catch (error) {
    logger.error('[admin/dashboard] Error occurred', { 
      requestId, 
      message: error.message, 
      stack: error.stack,
      query: req.query,
      errorName: error.name,
      errorCode: error.code
    });
    
    // Return a safe fallback response with default data
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully (with fallback data)',
      data: {
        overview: {
          totalUsers: 0,
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          newUsers: 0,
          newOrders: 0,
          pendingOrders: 0,
          lowStockProducts: 0,
          pendingReviews: 0
        },
        trends: {
          revenue: [],
          period: parseInt(req.query.period || '30')
        },
        topProducts: [],
        recentOrders: []
      }
    });
  }
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
  const revenueByPeriod = await Order.getRevenueByPeriod(period, dateFrom, dateTo) || [];

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
      overall: (Array.isArray(overallStats) && overallStats[0]) ? overallStats[0] : {},
      revenueByPeriod: Array.isArray(revenueByPeriod) ? revenueByPeriod : [],
      statusBreakdown: Array.isArray(statusBreakdown) ? statusBreakdown : []
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

// @desc    Set product order in section
// @route   POST /api/admin/sections/:section
// @access  Private (Admin only)
export const setProductsInSection = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const { productIds } = req.body;

  // Validate section
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section', 400, 'INVALID_SECTION'));
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return next(new AppError('Product IDs array is required', 400, 'PRODUCT_IDS_REQUIRED'));
  }

  // Verify all products exist
  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== productIds.length) {
    return next(new AppError('One or more products not found', 404, 'PRODUCTS_NOT_FOUND'));
  }

  // Remove all products from this section first
  await Product.updateMany(
    { sections: section },
    { $pull: { sections: section } }
  );

  // Add selected products to the section
  await Product.updateMany(
    { _id: { $in: productIds } },
    { $addToSet: { sections: section } }
  );

  logger.info('Products assigned to section by admin', {
    section,
    productCount: productIds.length,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Products successfully assigned to ${section} section`,
    data: {
      section,
      productCount: productIds.length
    }
  });
});

// @desc    Get products in section for admin management
// @route   GET /api/admin/sections/:section
// @access  Private (Admin only)
export const getProductsInSection = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const { limit = 20 } = req.query;

  // Validate section
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section', 400, 'INVALID_SECTION'));
  }

  const products = await Product.find({
    sections: section,
    status: 'active'
  })
    .populate('category', 'name slug')
    .select('name slug price images rating sections status createdAt')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    message: `Products in ${section} section retrieved successfully`,
    data: {
      section,
      products,
      count: products.length
    }
  });
});

// @desc    Remove product from section
// @route   DELETE /api/admin/sections/:section/products/:productId
// @access  Private (Admin only)
export const removeProductFromSection = asyncHandler(async (req, res, next) => {
  const { section, productId } = req.params;

  // Validate section
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section', 400, 'INVALID_SECTION'));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Remove product from section
  await product.removeFromSection(section);

  logger.info('Product removed from section by admin', {
    productId,
    section,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Product removed from ${section} section successfully`
  });
});

// @desc    Add product to section
// @route   POST /api/admin/sections/:section/products/:productId
// @access  Private (Admin only)
export const addProductToSection = asyncHandler(async (req, res, next) => {
  const { section, productId } = req.params;

  // Validate section
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section', 400, 'INVALID_SECTION'));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Add product to section
  await product.addToSection(section);

  logger.info('Product added to section by admin', {
    productId,
    section,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Product added to ${section} section successfully`
  });
});

// @desc    Get section overview (all sections with product counts)
// @route   GET /api/admin/sections
// @access  Private (Admin only)
export const getSectionOverview = asyncHandler(async (req, res, next) => {
  const sections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  
  const sectionData = await Promise.all(
    sections.map(async (section) => {
      const products = await Product.find({
        sections: section,
        status: 'active'
      }).select('_id name price images rating');
      
      return {
        section,
        productCount: products.length,
        products: products.slice(0, 5) // First 5 products for preview
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Section overview retrieved successfully',
    data: {
      sections: sectionData,
      totalSections: sections.length
    }
  });
});

// @desc    Clear all products from a section
// @route   DELETE /api/admin/sections/:section
// @access  Private (Admin only)
export const clearSection = asyncHandler(async (req, res, next) => {
  const { section } = req.params;

  // Validate section
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section', 400, 'INVALID_SECTION'));
  }

  // Remove all products from this section
  const result = await Product.updateMany(
    { sections: section },
    { $pull: { sections: section } }
  );

  logger.info('Section cleared by admin', {
    section,
    productsAffected: result.modifiedCount,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `All products removed from ${section} section successfully`,
    data: {
      section,
      productsRemoved: result.modifiedCount
    }
  });
});

// @desc    Get products available for section assignment
// @route   GET /api/admin/products/available
// @access  Private (Admin only)
export const getAvailableProducts = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    excludeSection
  } = req.query;

  // Build filter
  const filter = {
    status: 'active',
    visibility: 'public'
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (excludeSection) {
    filter.sections = { $ne: excludeSection };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(limit, 50); // Max 50 products per page

  // Execute query
  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .select('name slug price images rating sections status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);

  res.status(200).json({
    success: true,
    message: 'Available products retrieved successfully',
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: limitNum
      },
      filters: {
        search,
        category,
        excludeSection
      }
    }
  });
});

// @desc    Bulk update product sections
// @route   PUT /api/admin/products/sections
// @access  Private (Admin only)
export const bulkUpdateProductSections = asyncHandler(async (req, res, next) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return next(new AppError('Updates array is required', 400, 'UPDATES_REQUIRED'));
  }

  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const update of updates) {
    try {
      const { productId, sections } = update;

      if (!productId) {
        errors.push({ productId, error: 'Product ID is required' });
        errorCount++;
        continue;
      }

      // Validate sections
      if (sections && !sections.every(section => validSections.includes(section))) {
        errors.push({ productId, error: 'Invalid section name' });
        errorCount++;
        continue;
      }

      // Update product
      const product = await Product.findById(productId);
      if (!product) {
        errors.push({ productId, error: 'Product not found' });
        errorCount++;
        continue;
      }

      product.sections = sections || [];
      await product.save();
      successCount++;

    } catch (error) {
      errors.push({ productId: update.productId, error: error.message });
      errorCount++;
    }
  }

  logger.info('Bulk section update completed by admin', {
    totalUpdates: updates.length,
    successCount,
    errorCount,
    adminUserId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Bulk section update completed',
    data: {
      totalUpdates: updates.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    }
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
        topSellingProducts: topSellingProducts || [],
        lowStockProducts: lowStockProducts || [],
        categoryBreakdown: categoryBreakdown || []
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
        revenue: revenueData || [],
        orders: orderData || [],
        users: userStats[0] || { total: [{ count: 0 }], new: [{ count: 0 }], active: [{ count: 0 }] },
        products: productStats[0] || { total: [{ count: 0 }], active: [{ count: 0 }], lowStock: [{ count: 0 }] }
      };
  }

  res.status(200).json({
    success: true,
    message: 'Analytics data retrieved successfully',
    data: analyticsData
  });

  res.status(200).json({
    success: true,
    message: `Bulk stock update completed. ${successful} successful, ${failed} failed`,
    data: {
      results,
      summary: {
        total: updates.length,
        successful,
        failed
      }
    }
  });
});

// @desc    Get low stock products
// @route   GET /api/admin/inventory/low-stock
// @access  Private (Admin only)
export const getLowStockProducts = asyncHandler(async (req, res, next) => {
  const { threshold } = req.query;
  
  const products = await Product.find({
    'stock.trackQuantity': true,
    status: 'active',
    $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
  })
  .select('name sku stock category sales')
  .populate('category', 'name')
  .sort({ 'stock.quantity': 1 });

  res.status(200).json({
    success: true,
    message: 'Low stock products retrieved successfully',
    data: {
      products,
      count: products.length
    }
  });
});

// @desc    Update product stock
// @route   PUT /api/admin/inventory/:id/stock
// @access  Private (Admin only)
export const updateProductStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { quantity, reason = 'manual_update' } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  const oldQuantity = product.stock.quantity;
  product.stock.quantity = quantity;
  
  await product.save();

  logger.info('Stock updated by admin', {
    productId: id,
    adminId: req.user._id,
    oldQuantity,
    newQuantity: quantity,
    reason,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: {
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock
      }
    }
  });
});

// @desc    Bulk update stock
// @route   PUT /api/admin/inventory/bulk-update
// @access  Private (Admin only)
export const bulkUpdateStock = asyncHandler(async (req, res, next) => {
  const { updates } = req.body; // Array of {productId, quantity, reason}

  if (!Array.isArray(updates) || updates.length === 0) {
    return next(new AppError('Updates array is required', 400, 'INVALID_INPUT'));
  }

  const results = [];
  
  for (const update of updates) {
    try {
      const product = await Product.findById(update.productId);
      if (!product) {
        results.push({ 
          productId: update.productId, 
          success: false, 
          error: 'Product not found' 
        });
        continue;
      }

      const oldQuantity = product.stock.quantity;
      product.stock.quantity = update.quantity;
      await product.save();

      results.push({ 
        productId: update.productId, 
        success: true, 
        oldQuantity, 
        newQuantity: update.quantity 
      });
    } catch (error) {
      results.push({ 
        productId: update.productId, 
        success: false, 
        error: error.message 
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  logger.info('Bulk stock update completed', {
    adminId: req.user._id,
    total: updates.length,
    successful,
    failed,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Bulk stock update completed. ${successful} successful, ${failed} failed`,
    data: {
      results,
      summary: {
        total: updates.length,
        successful,
        failed
      }
    }
  });
});

// @desc    Get inventory analytics
// @route   GET /api/admin/inventory/analytics
// @access  Private (Admin only)
export const getInventoryAnalytics = asyncHandler(async (req, res, next) => {
  const [
    totalProducts,
    lowStockCount,
    outOfStockCount,
    totalStockValue,
    topSellingProducts
  ] = await Promise.all([
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({
      'stock.trackQuantity': true,
      status: 'active',
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    }),
    Product.countDocuments({
      'stock.trackQuantity': true,
      status: 'active',
      'stock.quantity': 0
    }),
    Product.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$stock.quantity', '$price'] } } } }
    ]),
    Product.find({ status: 'active' })
      .sort({ 'sales.totalSold': -1 })
      .limit(10)
      .select('name sales.totalSold stock.quantity')
  ]);

  res.status(200).json({
    success: true,
    message: 'Inventory analytics retrieved successfully',
    data: {
      overview: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalStockValue: totalStockValue[0]?.total || 0
      },
      topSellingProducts
    }
  });
});

// @desc    Get user activities
// @route   GET /api/admin/users/:id/activities
// @access  Private (Admin only)
export const getUserActivities = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { 
    type, 
    limit = 50, 
    page = 1, 
    startDate, 
    endDate 
  } = req.query;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  const skip = (page - 1) * limit;
  const activities = await Activity.getUserActivities(id, {
    type,
    limit: parseInt(limit),
    skip,
    startDate,
    endDate
  });

  const totalActivities = await Activity.countDocuments({
    user: id,
    ...(type && { type }),
    ...(startDate || endDate) && {
      timestamp: {
        ...(startDate && { $gte: new Date(startDate) }),
        ...(endDate && { $lte: new Date(endDate) })
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'User activities retrieved successfully',
    data: {
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalActivities / limit),
        totalActivities,
        hasNext: skip + activities.length < totalActivities,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get activity statistics
// @route   GET /api/admin/analytics/activities
// @access  Private (Admin only)
export const getActivityAnalytics = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const [
    totalActivities,
    activityByType,
    activityByDay,
    topActiveUsers
  ] = await Promise.all([
    Activity.countDocuments({ timestamp: { $gte: startDate } }),
    
    Activity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    Activity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    Activity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          count: 1,
          'user.firstName': 1,
          'user.lastName': 1,
          'user.email': 1
        }
      }
    ])
  ]);

  res.status(200).json({
    success: true,
    message: 'Activity analytics retrieved successfully',
    data: {
      overview: {
        totalActivities,
        period: `${days} days`
      },
      activityByType,
      activityByDay,
      topActiveUsers
    }
  });
});

// @desc    Get comprehensive analytics dashboard
// @route   GET /api/admin/analytics/comprehensive
// @access  Private (Admin only)
export const getComprehensiveAnalytics = asyncHandler(async (req, res, next) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range based on period
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  const [
    // Revenue Analytics
    revenueData,
    revenueByDay,
    revenueByCategory,
    
    // Order Analytics
    orderStats,
    ordersByStatus,
    ordersByDay,
    
    // Product Analytics
    topSellingProducts,
    lowStockProducts,
    productsByCategory,
    
    // User Analytics
    userGrowth,
    usersByStatus,
    userActivity,
    
    // Geographic Analytics
    ordersByRegion
  ] = await Promise.all([
    // Revenue Analytics
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'delivered'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ]),
    
    // Revenue by day
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'delivered'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Revenue by category
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'delivered'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ]),
    
    // Order Statistics
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]),
    
    // Orders by status
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    // Orders by day
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Top selling products
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'delivered'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          totalSold: 1,
          revenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]),
    
    // Low stock products
    Product.find({
      'stock.trackQuantity': true,
      status: 'active',
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    })
    .select('name stock')
    .limit(10),
    
    // Products by category
    Product.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $group: { _id: '$category.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    // User growth
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Users by status
    User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    // User activity (if Activity model exists)
    Activity.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          activities: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          _id: 1,
          activities: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Orders by region (based on shipping address)
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$shippingAddress.state',
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { orders: -1 } },
      { $limit: 10 }
    ])
  ]);

  res.status(200).json({
    success: true,
    message: 'Comprehensive analytics retrieved successfully',
    data: {
      period,
      dateRange: { startDate, endDate: now },
      revenue: {
        overview: revenueData[0] || { totalRevenue: 0, averageOrderValue: 0, totalOrders: 0 },
        byDay: revenueByDay,
        byCategory: revenueByCategory
      },
      orders: {
        overview: orderStats[0] || { totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0 },
        byStatus: ordersByStatus,
        byDay: ordersByDay
      },
      products: {
        topSelling: topSellingProducts,
        lowStock: lowStockProducts,
        byCategory: productsByCategory
      },
      users: {
        growth: userGrowth,
        byStatus: usersByStatus,
        activity: userActivity
      },
      geographic: {
        ordersByRegion
      }
    }
  });
});

// @desc    Get real-time dashboard metrics
// @route   GET /api/admin/analytics/realtime
// @access  Private (Admin only)
export const getRealtimeMetrics = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

  const [
    activeUsers,
    recentOrders,
    recentActivities,
    systemHealth
  ] = await Promise.all([
    // Active users (users with activity in last hour)
    Activity.distinct('user', { timestamp: { $gte: lastHour } }).then(users => users.length),
    
    // Recent orders (last 24 hours)
    Order.find({ createdAt: { $gte: last24Hours } })
      .populate('user', 'firstName lastName email')
      .select('_id totalAmount status createdAt')
      .sort({ createdAt: -1 })
      .limit(10),
    
    // Recent activities (last hour)
    Activity.find({ timestamp: { $gte: lastHour } })
      .populate('user', 'firstName lastName')
      .select('type description timestamp user')
      .sort({ timestamp: -1 })
      .limit(20),
    
    // System health metrics
    Promise.resolve({
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: now
    })
  ]);

  res.status(200).json({
    success: true,
    message: 'Real-time metrics retrieved successfully',
    data: {
      activeUsers,
      recentOrders,
      recentActivities,
      systemHealth,
      timestamp: now
    }
  });
});

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private (Admin only)
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    category = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  // Build search query
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get single product (Admin)
// @route   GET /api/admin/products/:id
// @access  Private (Admin only)
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate('reviews.user', 'firstName lastName');

  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: { product }
  });
});

// @desc    Create new product (Admin)
// @route   POST /api/admin/products
// @access  Private (Admin only)
export const createProduct = asyncHandler(async (req, res, next) => {
  const productData = {
    ...req.body,
    createdBy: req.user._id
  };

  const product = await Product.create(productData);
  await product.populate('category', 'name slug');

  logger.info('Product created by admin', {
    productId: product._id,
    adminId: req.user._id,
    productName: product.name,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private (Admin only)
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(
    id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  logger.info('Product updated by admin', {
    productId: product._id,
    adminId: req.user._id,
    productName: product.name,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Soft delete by updating status
  product.status = 'deleted';
  product.deletedAt = new Date();
  product.deletedBy = req.user._id;
  await product.save();

  logger.info('Product deleted by admin', {
    productId: product._id,
    adminId: req.user._id,
    productName: product.name,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: { product: { _id: product._id, name: product.name, status: product.status } }
  });
});

// @desc    Get single order (Admin)
// @route   GET /api/admin/orders/:id
// @access  Private (Admin only)
export const getOrderById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name price images sku');

  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: { order }
  });
});

// @desc    Update order status (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin only)
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid order status', 400, 'INVALID_STATUS'));
  }

  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
  }

  // Update order status
  order.status = status;
  if (notes) {
    order.statusHistory.push({
      status,
      notes,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
  }

  await order.save();
  await order.populate('user', 'firstName lastName email');

  logger.info('Order status updated by admin', {
    orderId: order._id,
    adminId: req.user._id,
    oldStatus: order.status,
    newStatus: status,
    notes,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    data: { order }
  });
});

// @desc    Get database performance metrics
// @route   GET /api/admin/performance/database
// @access  Private (Admin only)
export const getDatabasePerformance = asyncHandler(async (req, res, next) => {
  const databaseOptimization = await import('../services/databaseOptimization.js');
  
  const [performanceData, queryAnalysis] = await Promise.all([
    databaseOptimization.default.monitorPerformance(),
    databaseOptimization.default.analyzeQueryPerformance()
  ]);

  res.status(200).json({
    success: true,
    message: 'Database performance metrics retrieved successfully',
    data: {
      performance: performanceData,
      queryAnalysis
    }
  });
});

// @desc    Optimize database indexes
// @route   POST /api/admin/performance/optimize
// @access  Private (Admin only)
export const optimizeDatabase = asyncHandler(async (req, res, next) => {
  const databaseOptimization = await import('../services/databaseOptimization.js');
  
  await databaseOptimization.default.createOptimizedIndexes();
  await databaseOptimization.default.setupCaching();

  logger.info('Database optimization triggered by admin', {
    adminId: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Database optimization completed successfully'
  });
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
export const getAdminProfile = asyncHandler(async (req, res, next) => {
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('[admin/profile] Get profile request received', { 
      requestId, 
      adminId: req.user._id 
    });

    // Get admin user data (excluding sensitive fields)
    const admin = await User.findById(req.user._id).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
    
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: {
        profile: admin
      }
    });

  } catch (error) {
    logger.error('[admin/profile] Error getting admin profile', {
      requestId,
      error: error.message,
      stack: error.stack,
      adminId: req.user._id
    });
    
    return next(new AppError('Failed to retrieve admin profile', 500));
  }
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
export const updateAdminProfile = asyncHandler(async (req, res, next) => {
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('[admin/profile] Update profile request received', { 
      requestId, 
      adminId: req.user._id,
      updateFields: Object.keys(req.body)
    });

    const { firstName, lastName, email, phone, bio, preferences } = req.body;

    // Find admin user
    const admin = await User.findById(req.user._id);
    
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Update allowed fields
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (preferences !== undefined) updateData.preferences = { ...admin.preferences, ...preferences };

    // Update the admin profile
    const updatedAdmin = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

    logger.info('[admin/profile] Admin profile updated successfully', {
      requestId,
      adminId: req.user._id,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully',
      data: {
        profile: updatedAdmin
      }
    });

  } catch (error) {
    logger.error('[admin/profile] Error updating admin profile', {
      requestId,
      error: error.message,
      stack: error.stack,
      adminId: req.user._id
    });
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation error: ${validationErrors.join(', ')}`, 400));
    }
    
    return next(new AppError('Failed to update admin profile', 500));
  }
});