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
    const { period = '30', detailed = 'false' } = req.query;
    
    logger.info('[admin/dashboard] Request received', { 
      requestId, 
      period, 
      detailed,
      query: req.query 
    });
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Basic dashboard stats
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueResult
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    const responseData = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        newUsers: 0,
        newOrders: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        pendingReviews: 0
      },
      trends: {
        revenue: [],
        period: parseInt(period)
      },
      topProducts: [],
      recentOrders: [],
      metadata: {
        generatedAt: new Date(),
        period: parseInt(period),
        detailed: detailed === 'true',
        requestId
      }
    };
    
    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: responseData
    });
  } catch (error) {
    logger.error('[admin/dashboard] Error occurred', { 
      requestId, 
      message: error.message, 
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: error.message
    });
  }
});

// @desc    Get all reviews (Admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = '',
      rating = '',
      productId = '',
      userId = '',
      search = '',
      dateFrom = '',
      dateTo = '',
      sortBy = '',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    // Status filter
    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }
    
    // Rating filter
    if (rating) {
      if (rating.includes(',')) {
        filter.rating = { $in: rating.split(',').map(Number) };
      } else {
        filter.rating = Number(rating);
      }
    }
    
    // Product filter
    if (productId) {
      filter.product = productId;
    }
    
    // User filter
    if (userId) {
      filter.user = userId;
    }
    
    // Date filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 100);

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum }
    ];

    const Review = (await import('../models/Review.js')).default;
    
    const reviews = await Review.aggregate(pipeline);
    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          hasNextPage: page * limitNum < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin only)
export const getAllOrders = asyncHandler(async (req, res, next) => {
  console.log('[getAllOrders] Request received:', req.query);
  
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    status,
    dateFrom,
    dateTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    minAmount,
    maxAmount,
    paymentStatus,
    shippingStatus,
    userId
  } = req.query;

  // Build comprehensive filter
  const filter = {};
  
  // Status filter
  if (status) {
    if (status.includes(',')) {
      filter.status = { $in: status.split(',') };
    } else {
      filter.status = status;
    }
  }
  
  // Date range filter
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  // Amount range filter
  if (minAmount || maxAmount) {
    filter.total = {};
    if (minAmount) filter.total.$gte = parseFloat(minAmount);
    if (maxAmount) filter.total.$lte = parseFloat(maxAmount);
  }

  // Payment status filter
  if (paymentStatus) {
    filter['payment.status'] = paymentStatus;
  }

  // Shipping status filter
  if (shippingStatus) {
    filter['shipping.status'] = shippingStatus;
  }

  // User filter
  if (userId) {
    filter.user = userId;
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);

  // Build aggregation pipeline for enhanced search
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { 
      $unwind: { 
        path: '$userInfo', 
        preserveNullAndEmptyArrays: true 
      } 
    },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    }
  ];

  // Add search filter if provided
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'userInfo.firstName': { $regex: search, $options: 'i' } },
          { 'userInfo.lastName': { $regex: search, $options: 'i' } },
          { 'userInfo.email': { $regex: search, $options: 'i' } },
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'productInfo.name': { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  // Add sorting and pagination
  pipeline.push(
    { $sort: sort },
    { $skip: skip },
    { $limit: limitNum },
    {
      $project: {
        orderNumber: 1,
        status: 1,
        total: 1,
        subtotal: 1,
        tax: 1,
        shipping: 1,
        payment: 1,
        items: 1,
        createdAt: 1,
        updatedAt: 1,
        notes: 1,
        user: {
          _id: '$userInfo._id',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          email: '$userInfo.email'
        }
      }
    }
  );

  // Execute queries with error handling
  let orders, totalOrders, orderStats;
  
  try {
    [orders, totalOrders] = await Promise.all([
      Order.aggregate(pipeline),
      Order.countDocuments(filter)
    ]);
  } catch (aggregationError) {
    console.error('Orders aggregation error:', aggregationError);
    // Fallback to simple query if aggregation fails
    [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('user', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);
  }

  // Get basic order statistics (simplified)
  try {
    const statsResult = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    orderStats = statsResult[0] || {
      totalRevenue: 0,
      avgOrderValue: 0,
      count: 0
    };
  } catch (statsError) {
    console.error('Order stats error:', statsError);
    orderStats = {
      totalRevenue: 0,
      avgOrderValue: 0,
      count: totalOrders
    };
  }

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
      },
      statistics: {
        totalRevenue: orderStats.totalRevenue || 0,
        avgOrderValue: orderStats.avgOrderValue || 0,
        totalOrders: orderStats.count || totalOrders
      },
      filters: {
        status, dateFrom, dateTo, search, minAmount, maxAmount,
        paymentStatus, shippingStatus, userId, sortBy, sortOrder
      }
    }
  });
  
  console.log('[getAllOrders] Success:', {
    ordersCount: orders.length,
    totalOrders,
    totalPages
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
    brand = '',
    priceMin = '',
    priceMax = '',
    stockStatus = '',
    featured = '',
    sections = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    fields = ''
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  // Build comprehensive search query
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Status filter
  if (status) {
    query.status = status;
  } else {
    // Exclude deleted products by default
    query.status = { $ne: 'deleted' };
  }

  // Brand filter
  if (brand) {
    query.brand = { $regex: brand, $options: 'i' };
  }

  // Price range filter
  if (priceMin || priceMax) {
    query.price = {};
    if (priceMin) query.price.$gte = parseFloat(priceMin);
    if (priceMax) query.price.$lte = parseFloat(priceMax);
  }

  // Stock status filter
  if (stockStatus) {
    switch (stockStatus) {
      case 'in-stock':
        query['stock.quantity'] = { $gt: 0 };
        query.$expr = { $gt: ['$stock.quantity', '$stock.lowStockThreshold'] };
        break;
      case 'low-stock':
        query['stock.quantity'] = { $gt: 0 };
        query.$expr = { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] };
        break;
      case 'out-of-stock':
        query['stock.quantity'] = 0;
        break;
    }
  }

  // Featured filter
  if (featured !== '') {
    query.featured = featured === 'true';
  }

  // Sections filter
  if (sections) {
    const sectionArray = sections.split(',');
    query.sections = { $in: sectionArray };
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Field selection
  let selectFields = '';
  if (fields) {
    selectFields = fields.split(',').join(' ');
  }

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .select(selectFields)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Product.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  // Add calculated fields to products
  const enhancedProducts = products.map(product => ({
    ...product,
    stockStatus: product.stock?.quantity === 0 ? 'out-of-stock' :
                 product.stock?.quantity <= product.stock?.lowStockThreshold ? 'low-stock' : 'in-stock',
    totalValue: product.price * (product.stock?.quantity || 0),
    hasDiscount: product.hasDiscount || false,
    discountPercentage: product.discountPercentage || 0
  }));

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products: enhancedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit)
      },
      filters: {
        search, category, status, brand, priceMin, priceMax, 
        stockStatus, featured, sections, sortBy, sortOrder
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
  const productData = { ...req.body, createdBy: req.user._id };

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

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  // Build search query
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Role filter
  if (role) {
    query.role = role;
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select('-password -refreshToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: parseInt(limit)
      },
      filters: {
        search, role, status, sortBy, sortOrder
      }
    }
  });
});

// @desc    Get single user (Admin)
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password -refreshToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'User retrieved successfully',
    data: { user }
  });
});

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove sensitive fields that shouldn't be updated directly
  delete updateData.password;
  delete updateData.refreshToken;

  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  logger.info('User updated by admin', {
    userId: user._id,
    adminId: req.user._id,
    userEmail: user.email,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  });
});

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Soft delete by updating status
  user.status = 'deleted';
  user.deletedAt = new Date();
  await user.save();

  logger.info('User deleted by admin', {
    userId: user._id,
    adminId: req.user._id,
    userEmail: user.email,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: { user: { _id: user._id, email: user.email, status: user.status } }
  });
});

// Stub implementations for missing functions to prevent import errors
// These should be properly implemented later

export const updateUserStatus = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const bulkUpdateUserStatus = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getUserAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const exportUsers = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const sendUserNotification = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getOrderStats = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getAdminCategories = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getCategorySpecifications = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const updateCategorySpecifications = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const setProductsInSection = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getProductsInSection = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const removeProductFromSection = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const addProductToSection = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getSectionOverview = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const clearSection = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getAvailableProducts = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const bulkUpdateProductSections = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getLowStockProducts = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const updateProductStock = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const bulkUpdateStock = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getInventoryAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

// getUserActivities removed - Activity feature deprecated

// Activity analytics removed - feature deprecated

export const getComprehensiveAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getRealtimeMetrics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const bulkUpdateProducts = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const duplicateProduct = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getProductAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const exportProducts = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const bulkUpdateOrderStatus = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getOrderAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const processRefund = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const exportOrders = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getAdminProfile = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const updateAdminProfile = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getAllReviews = asyncHandler(async (req, res, next) => {
  // Redirect to the existing getReviews function
  return getReviews(req, res);
});

export const getPendingReviews = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const moderateReview = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const bulkModerateReviews = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const getReviewAnalytics = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

export const deleteReview = asyncHandler(async (req, res, next) => {
  res.status(501).json({ success: false, message: 'Function not implemented yet' });
});

// Activity log removed - feature deprecated
