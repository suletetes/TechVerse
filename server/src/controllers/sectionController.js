import { Product } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// @desc    Get products in a specific section
// @route   GET /api/admin/sections/:section
// @access  Private (Admin only)
export const getSectionProducts = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal'];
  
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section name', 400, 'INVALID_SECTION'));
  }

  const products = await Product.find({ 
    sections: section,
    status: 'active' 
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

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

// @desc    Set products for a specific section
// @route   POST /api/admin/sections/:section
// @access  Private (Admin only)
export const setSectionProducts = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const { productIds } = req.body;
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal'];
  
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section name', 400, 'INVALID_SECTION'));
  }

  if (!Array.isArray(productIds)) {
    return next(new AppError('Product IDs must be an array', 400, 'INVALID_PRODUCT_IDS'));
  }

  // Validate that all product IDs exist
  const existingProducts = await Product.find({ 
    _id: { $in: productIds },
    status: 'active'
  });

  if (existingProducts.length !== productIds.length) {
    return next(new AppError('Some product IDs are invalid or inactive', 400, 'INVALID_PRODUCT_IDS'));
  }

  // Remove section from all products first
  await Product.updateMany(
    { sections: section },
    { $pull: { sections: section } }
  );

  // Add section to specified products
  if (productIds.length > 0) {
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { sections: section } }
    );
  }

  // Get updated products
  const updatedProducts = await Product.find({ 
    sections: section,
    status: 'active' 
  })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  logger.info('Section products updated', {
    section,
    productCount: productIds.length,
    updatedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `${section} section updated successfully`,
    data: {
      section,
      products: updatedProducts,
      count: updatedProducts.length
    }
  });
});

// @desc    Add product to a section
// @route   PATCH /api/admin/sections/:section/add
// @access  Private (Admin only)
export const addProductToSection = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const { productId } = req.body;
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal'];
  
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section name', 400, 'INVALID_SECTION'));
  }

  if (!productId) {
    return next(new AppError('Product ID is required', 400, 'PRODUCT_ID_REQUIRED'));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  if (product.status !== 'active') {
    return next(new AppError('Cannot add inactive product to section', 400, 'PRODUCT_INACTIVE'));
  }

  // Add section to product if not already present
  await Product.findByIdAndUpdate(
    productId,
    { $addToSet: { sections: section } },
    { new: true }
  );

  logger.info('Product added to section', {
    productId,
    section,
    updatedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Product added to ${section} section successfully`
  });
});

// @desc    Remove product from a section
// @route   PATCH /api/admin/sections/:section/remove
// @access  Private (Admin only)
export const removeProductFromSection = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const { productId } = req.body;
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal'];
  
  if (!validSections.includes(section)) {
    return next(new AppError('Invalid section name', 400, 'INVALID_SECTION'));
  }

  if (!productId) {
    return next(new AppError('Product ID is required', 400, 'PRODUCT_ID_REQUIRED'));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Remove section from product
  await Product.findByIdAndUpdate(
    productId,
    { $pull: { sections: section } },
    { new: true }
  );

  logger.info('Product removed from section', {
    productId,
    section,
    updatedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: `Product removed from ${section} section successfully`
  });
});

// @desc    Get all sections with product counts
// @route   GET /api/admin/sections
// @access  Private (Admin only)
export const getAllSections = asyncHandler(async (req, res, next) => {
  const sections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal'];
  
  const sectionData = await Promise.all(
    sections.map(async (section) => {
      const count = await Product.countDocuments({ 
        sections: section,
        status: 'active'
      });
      
      return {
        name: section,
        displayName: section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1'),
        productCount: count
      };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Sections retrieved successfully',
    data: {
      sections: sectionData
    }
  });
});