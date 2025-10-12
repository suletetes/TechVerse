import { Product, Category, Review, User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import imageService from '../services/imageService.js';
import logger from '../utils/logger.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    sort = 'newest',
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    featured,
    status = 'active'
  } = req.query;

  // Build filter object
  const filter = {
    status,
    visibility: 'public'
  };

  if (category) filter.category = category;
  if (brand) filter.brand = { $in: Array.isArray(brand) ? brand : [brand] };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (minRating) filter['rating.average'] = { $gte: parseFloat(minRating) };
  if (featured === 'true') filter.featured = true;

  // Build sort object
  const sortOptions = {
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'price_asc': { price: 1 },
    'price_desc': { price: -1 },
    'rating': { 'rating.average': -1 },
    'name_asc': { name: 1 },
    'name_desc': { name: -1 },
    'popularity': { 'sales.totalSold': -1 }
  };

  const sortBy = sortOptions[sort] || sortOptions.newest;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);

  // Execute query
  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      },
      filters: {
        category,
        brand,
        minPrice,
        maxPrice,
        minRating,
        featured,
        sort
      }
    }
  });
});

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Try to find by ID first, then by slug
  let product = await Product.findById(id)
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name price images rating')
    .populate('crossSells', 'name price images rating')
    .populate('upsells', 'name price images rating');

  if (!product) {
    product = await Product.findBySlug(id)
      .populate('category', 'name slug')
      .populate('relatedProducts', 'name price images rating')
      .populate('crossSells', 'name price images rating')
      .populate('upsells', 'name price images rating');
  }

  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Check if user can view this product
  if (product.status !== 'active' || product.visibility !== 'public') {
    // Only admin or product creator can view inactive/private products
    if (!req.user || (req.user.role !== 'admin' && product.createdBy.toString() !== req.user._id.toString())) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }
  }

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: {
      product
    }
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
export const createProduct = asyncHandler(async (req, res, next) => {
  const productData = {
    ...req.body,
    createdBy: req.user._id
  };

  // Validate category exists
  if (productData.category) {
    const category = await Category.findById(productData.category);
    if (!category) {
      return next(new AppError('Category not found', 400, 'CATEGORY_NOT_FOUND'));
    }
  }

  // Handle image uploads if any
  if (req.files && req.files.images) {
    try {
      const uploadedImages = await imageService.uploadMultipleImages(req.files.images, 'products');
      productData.images = uploadedImages;
    } catch (error) {
      logger.error('Failed to upload product images', error);
      return next(new AppError('Failed to upload images', 500, 'IMAGE_UPLOAD_ERROR'));
    }
  }

  const product = await Product.create(productData);

  // Populate the created product
  await product.populate('category', 'name slug');

  logger.info('Product created successfully', {
    productId: product._id,
    name: product.name,
    createdBy: req.user._id,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      product
    }
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  let product = await Product.findById(id);

  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Validate category if being updated
  if (req.body.category && req.body.category !== product.category.toString()) {
    const category = await Category.findById(req.body.category);
    if (!category) {
      return next(new AppError('Category not found', 400, 'CATEGORY_NOT_FOUND'));
    }
  }

  // Handle image uploads if any
  if (req.files && req.files.images) {
    try {
      const uploadedImages = await imageService.uploadMultipleImages(req.files.images, 'products');

      // If replacing all images, delete old ones
      if (req.body.replaceImages === 'true') {
        // Delete old images
        for (const image of product.images) {
          if (image.publicId) {
            await imageService.deleteImage(image.publicId);
          }
        }
        req.body.images = uploadedImages;
      } else {
        // Add to existing images
        req.body.images = [...product.images, ...uploadedImages];
      }
    } catch (error) {
      logger.error('Failed to upload product images', error);
      return next(new AppError('Failed to upload images', 500, 'IMAGE_UPLOAD_ERROR'));
    }
  }

  // Update product
  const updateData = {
    ...req.body,
    updatedBy: req.user._id
  };

  product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('category', 'name slug');

  logger.info('Product updated successfully', {
    productId: product._id,
    name: product.name,
    updatedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: {
      product
    }
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Delete associated images
  for (const image of product.images) {
    if (image.publicId) {
      try {
        await imageService.deleteImage(image.publicId);
      } catch (error) {
        logger.warn('Failed to delete product image', {
          productId: id,
          imageId: image.publicId,
          error: error.message
        });
      }
    }
  }

  // Delete reviews associated with this product
  await Review.deleteMany({ product: id });

  // Remove product
  await Product.findByIdAndDelete(id);

  logger.info('Product deleted successfully', {
    productId: id,
    name: product.name,
    deletedBy: req.user._id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
export const searchProducts = asyncHandler(async (req, res, next) => {
  const {
    q: searchTerm,
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    sort = 'relevance',
    category,
    brand,
    minPrice,
    maxPrice,
    minRating
  } = req.query;

  if (!searchTerm) {
    return next(new AppError('Search term is required', 400, 'SEARCH_TERM_REQUIRED'));
  }

  // Build search options
  const searchOptions = {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
    sort,
    category: category ? (Array.isArray(category) ? category : [category]) : undefined,
    brand: brand ? (Array.isArray(brand) ? brand : [brand]) : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minRating: minRating ? parseFloat(minRating) : undefined
  };

  // Execute search
  const products = await Product.searchProducts(searchTerm, searchOptions);
  const totalProducts = await Product.countDocuments({
    $and: [
      { status: 'active', visibility: 'public' },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          { brand: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalProducts / searchOptions.limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    data: {
      products,
      searchTerm,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit: searchOptions.limit
      }
    }
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const products = await Product.findFeatured(parseInt(limit));

  res.status(200).json({
    success: true,
    message: 'Featured products retrieved successfully',
    data: {
      products
    }
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    sort = 'newest',
    brand,
    minPrice,
    maxPrice,
    minRating
  } = req.query;

  // Validate category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
  }

  // Build options
  const options = {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
    sort,
    brand: brand ? (Array.isArray(brand) ? brand : [brand]) : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minRating: minRating ? parseFloat(minRating) : undefined
  };

  // Get products
  const products = await Product.findByCategory(categoryId, options);
  const totalProducts = await Product.countDocuments({
    category: categoryId,
    status: 'active',
    visibility: 'public'
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalProducts / options.limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Category products retrieved successfully',
    data: {
      products,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit: options.limit
      }
    }
  });
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const addProductReview = asyncHandler(async (req, res, next) => {
  const { id: productId } = req.params;
  const { rating, title, comment, pros, cons } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this product', 400, 'REVIEW_EXISTS'));
  }

  // Create review
  const reviewData = {
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    pros: pros || [],
    cons: cons || []
  };

  // Handle image uploads if any
  if (req.files && req.files.images) {
    try {
      const uploadedImages = await imageService.uploadMultipleImages(req.files.images, 'reviews');
      reviewData.images = uploadedImages;
    } catch (error) {
      logger.error('Failed to upload review images', error);
      return next(new AppError('Failed to upload images', 500, 'IMAGE_UPLOAD_ERROR'));
    }
  }

  const review = await Review.create(reviewData);
  await review.populate('user', 'firstName lastName');

  logger.info('Product review added', {
    reviewId: review._id,
    productId,
    userId: req.user._id,
    rating,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: {
      review
    }
  });
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req, res, next) => {
  const { id: productId } = req.params;
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    sort = 'newest',
    rating,
    verified
  } = req.query;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Build options
  const options = {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
    sort,
    rating: rating ? parseInt(rating) : undefined,
    verified: verified === 'true' ? true : undefined
  };

  // Get reviews
  const reviews = await Review.findByProduct(productId, options);
  const totalReviews = await Review.countDocuments({
    product: productId,
    status: 'approved'
  });

  // Get rating breakdown
  const ratingBreakdown = await Review.getProductRatingBreakdown(productId);

  // Calculate pagination
  const totalPages = Math.ceil(totalReviews / options.limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Product reviews retrieved successfully',
    data: {
      reviews,
      ratingBreakdown: ratingBreakdown[0] || { ratings: [], totalReviews: 0, averageRating: 0 },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReviews,
        hasNextPage,
        hasPrevPage,
        limit: options.limit
      }
    }
  });
});
// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .select('name slug description image parent displayOrder productCount')
    .populate('parent', 'name slug')
    .sort({ displayOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories
  });
});
// @desc    Get top selling products
// @route   GET /api/products/top-sellers
// @access  Public
export const getTopSellingProducts = asyncHandler(async (req, res, next) => {
  const { limit = 10, timeframe } = req.query;

  const products = await Product.getTopSelling(
    parseInt(limit), 
    timeframe ? parseInt(timeframe) : null
  );

  res.status(200).json({
    success: true,
    message: 'Top selling products retrieved successfully',
    data: {
      products
    }
  });
});

// @desc    Get latest products
// @route   GET /api/products/latest
// @access  Public
export const getLatestProducts = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ 
    status: 'active', 
    visibility: 'public' 
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('category', 'name slug')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Latest products retrieved successfully',
    data: {
      products
    }
  });
});

// @desc    Get products on sale (with comparePrice > price)
// @route   GET /api/products/on-sale
// @access  Public
export const getProductsOnSale = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ 
    status: 'active', 
    visibility: 'public',
    comparePrice: { $exists: true, $gt: 0 },
    $expr: { $gt: ['$comparePrice', '$price'] }
  })
    .sort({ 
      // Sort by discount percentage (highest first)
      $expr: { 
        $divide: [
          { $subtract: ['$comparePrice', '$price'] },
          '$comparePrice'
        ]
      }
    })
    .limit(parseInt(limit))
    .populate('category', 'name slug')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Products on sale retrieved successfully',
    data: {
      products
    }
  });
});

// @desc    Get quick picks (featured products with high ratings)
// @route   GET /api/products/quick-picks
// @access  Public
export const getQuickPicks = asyncHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ 
    status: 'active', 
    visibility: 'public',
    $or: [
      { featured: true },
      { 'rating.average': { $gte: 4.5 } }
    ]
  })
    .sort({ 'rating.average': -1, featured: -1 })
    .limit(parseInt(limit))
    .populate('category', 'name slug')
    .lean();

  res.status(200).json({
    success: true,
    message: 'Quick picks retrieved successfully',
    data: {
      products
    }
  });
});