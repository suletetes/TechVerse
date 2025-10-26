import { User, Product, Order, Category, Review } from '../models/index.js';
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
});