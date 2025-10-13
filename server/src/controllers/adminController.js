import { HomepageSection, Product, Category, User, Order, Store, Page } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// @desc    Get homepage sections configuration
// @route   GET /api/admin/sections
// @access  Private (Admin only)
export const getHomepageSections = asyncHandler(async (req, res, next) => {
  const sections = await HomepageSection.find({})
    .sort({ displayOrder: 1 })
    .populate('productIds', 'name price images slug')
    .populate('autoConfig.filters.category', 'name slug');

  res.status(200).json({
    success: true,
    message: 'Homepage sections retrieved successfully',
    data: { sections }
  });
});

// @desc    Update homepage section
// @route   PUT /api/admin/sections/:sectionType
// @access  Private (Admin only)
export const updateHomepageSection = asyncHandler(async (req, res, next) => {
  const { sectionType } = req.params;
  const updateData = {
    ...req.body,
    updatedBy: req.user._id
  };

  // Validate section type
  const validSectionTypes = ['latest', 'topSellers', 'quickPicks', 'weeklyDeals'];
  if (!validSectionTypes.includes(sectionType)) {
    return next(new AppError('Invalid section type', 400, 'INVALID_SECTION_TYPE'));
  }

  // If manual mode, validate product IDs
  if (updateData.mode === 'manual' && updateData.productIds) {
    const products = await Product.find({
      _id: { $in: updateData.productIds },
      status: 'active'
    });

    if (products.length !== updateData.productIds.length) {
      return next(new AppError('Some products not found or inactive', 400, 'INVALID_PRODUCTS'));
    }
  }

  let section = await HomepageSection.findOneAndUpdate(
    { sectionType },
    updateData,
    { new: true, upsert: true, runValidators: true }
  ).populate('productIds', 'name price images slug');

  logger.info('Homepage section updated', {
    sectionType,
    mode: section.mode,
    updatedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Homepage section updated successfully',
    data: { section }
  });
});

// @desc    Get homepage sections with products
// @route   GET /api/admin/sections/preview
// @access  Private (Admin only)
export const getHomepageSectionsPreview = asyncHandler(async (req, res, next) => {
  const sectionsWithProducts = await HomepageSection.getAllSectionsWithProducts();

  res.status(200).json({
    success: true,
    message: 'Homepage sections preview retrieved successfully',
    data: sectionsWithProducts
  });
});

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const [
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    Product.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({}),
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price'),
    Product.find({
      'stock.trackQuantity': true,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    }).limit(10)
  ]);

  const stats = {
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    recentOrders,
    lowStockProducts
  };

  res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: stats
  });
});

// @desc    Get all stores
// @route   GET /api/admin/stores
// @access  Private (Admin only)
export const getStores = asyncHandler(async (req, res, next) => {
  const stores = await Store.find({})
    .sort({ displayOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    message: 'Stores retrieved successfully',
    data: { stores }
  });
});

// @desc    Create store
// @route   POST /api/admin/stores
// @access  Private (Admin only)
export const createStore = asyncHandler(async (req, res, next) => {
  const store = await Store.create(req.body);

  logger.info('Store created', {
    storeId: store._id,
    name: store.name,
    createdBy: req.user._id,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Store created successfully',
    data: { store }
  });
});

// @desc    Update store
// @route   PUT /api/admin/stores/:id
// @access  Private (Admin only)
export const updateStore = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const store = await Store.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!store) {
    return next(new AppError('Store not found', 404, 'STORE_NOT_FOUND'));
  }

  logger.info('Store updated', {
    storeId: store._id,
    name: store.name,
    updatedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Store updated successfully',
    data: { store }
  });
});

// @desc    Delete store
// @route   DELETE /api/admin/stores/:id
// @access  Private (Admin only)
export const deleteStore = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const store = await Store.findByIdAndDelete(id);

  if (!store) {
    return next(new AppError('Store not found', 404, 'STORE_NOT_FOUND'));
  }

  logger.info('Store deleted', {
    storeId: id,
    name: store.name,
    deletedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Store deleted successfully'
  });
});