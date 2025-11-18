import { Product, Category, Review, User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import imageService from '../services/imageService.js';
import logger from '../utils/logger.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';
import { formatProductImages, getBaseUrl } from '../utils/imageUtils.js';
import { cacheInvalidation } from '../middleware/cacheMiddleware.js';

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
    sort = 'newest',
    order, // Accept order parameter but don't use it for predefined sorts
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    featured,
    section,
    status = 'active'
  } = req.query;

  // Build filter object
  const filter = {
    status,
    visibility: 'public'
  };

  if (category) {
    // Handle category by name or ObjectId
    if (typeof category === 'string' && !category.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's not an ObjectId, find the category by name or slug
      try {
        const categoryDoc = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: { $regex: new RegExp(`^${category}$`, 'i') } }
          ]
        });
        
        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          // If category not found, return empty results
          return res.status(200).json({
            success: true,
            message: 'No products found for this category',
            data: {
              products: [],
              pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalProducts: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: limitNum
              }
            }
          });
        }
      } catch (error) {
        logger.error('Error finding category:', error);
        filter.category = category; // Fallback to original value
      }
    } else {
      filter.category = category;
    }
  }
  if (brand) filter.brand = { $in: Array.isArray(brand) ? brand : [brand] };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (minRating) filter['rating.average'] = { $gte: parseFloat(minRating) };
  if (featured === 'true') filter.featured = true;
  if (section) filter.sections = section;

  // Build sort object
  const sortOptions = {
    'newest': { createdAt: -1 },
    'oldest': { createdAt: 1 },
    'name': { name: 1 },
    'price-low': { price: 1 },
    'price-high': { price: -1 },
    'rating': { 'rating.average': -1 },
    'price_asc': { price: 1 },
    'price_desc': { price: -1 },
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

  // Transform products to include category name as string for frontend compatibility
  const transformedProducts = products.map(product => {
    // Ensure category is always a string, never an object
    let categoryName = '';
    if (product.category) {
      if (typeof product.category === 'string') {
        categoryName = product.category;
      } else if (product.category.name) {
        categoryName = product.category.name;
      } else if (product.category._id) {
        categoryName = product.category._id.toString();
      }
    }
    
    // Ensure stock is properly formatted for frontend
    let stockQuantity = 0;
    let stockStatus = 'out_of_stock';
    if (product.stock) {
      if (typeof product.stock === 'object') {
        stockQuantity = product.stock.quantity || 0;
        stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
      } else if (typeof product.stock === 'number') {
        stockQuantity = product.stock;
        stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
      }
    }
    
    return {
      ...product,
      categoryName,
      category: categoryName, // Always use string for category
      stockQuantity,
      stockStatus,
      // Keep original stock object for admin use but ensure it's not rendered directly
      stock: {
        quantity: stockQuantity,
        lowStockThreshold: product.stock?.lowStockThreshold || 5,
        trackQuantity: product.stock?.trackQuantity || true
      }
    };
  });

  // Format image URLs for all products
  const baseUrl = getBaseUrl(req);
  const formattedProducts = transformedProducts.map(product => ({
    ...product,
    images: formatProductImages(product.images, baseUrl)
  }));

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / limitNum);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products: formattedProducts,
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
        section,
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

  let product = null;

  // Check if it's a valid MongoDB ObjectId format
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    // Try to find by ID first
    product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('relatedProducts', 'name price images rating')
      .populate('crossSells', 'name price images rating')
      .populate('upsells', 'name price images rating');
  }

  // If not found by ID or not a valid ObjectId, try to find by slug
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

  // Format image URLs and transform category
  const baseUrl = getBaseUrl(req);
  const productObj = product.toObject();
  
  // Ensure category is always a string, never an object
  let categoryName = '';
  if (productObj.category) {
    if (typeof productObj.category === 'string') {
      categoryName = productObj.category;
    } else if (productObj.category.name) {
      categoryName = productObj.category.name;
    } else if (productObj.category._id) {
      categoryName = productObj.category._id.toString();
    }
  }
  
  // Ensure stock is properly formatted for frontend
  let stockQuantity = 0;
  let stockStatus = 'out_of_stock';
  if (productObj.stock) {
    if (typeof productObj.stock === 'object') {
      stockQuantity = productObj.stock.quantity || 0;
      stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    } else if (typeof productObj.stock === 'number') {
      stockQuantity = productObj.stock;
      stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    }
  }
  
  const formattedProduct = {
    ...productObj,
    categoryName,
    category: categoryName, // Always use string for category
    stockQuantity,
    stockStatus,
    // Keep original stock object for admin use but ensure it's not rendered directly
    stock: {
      quantity: stockQuantity,
      lowStockThreshold: productObj.stock?.lowStockThreshold || 5,
      trackQuantity: productObj.stock?.trackQuantity || true
    },
    images: formatProductImages(productObj.images, baseUrl)
  };

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: {
      product: formattedProduct
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

  // Validate category exists and convert to ObjectId if needed
  if (productData.category) {
    let category;
    
    // Check if it's a valid MongoDB ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(productData.category)) {
      category = await Category.findById(productData.category);
    } else {
      // Try to find by name or slug
      category = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${productData.category}`, 'i') } },
          { slug: productData.category.toLowerCase() }
        ]
      });
    }
    
    if (!category) {
      // For draft products, allow saving without valid category
      // For active products, require valid category
      if (productData.status === 'active') {
        return next(new AppError(`Category '${productData.category}' not found. Please select a valid category before activating the product.`, 400, 'CATEGORY_NOT_FOUND'));
      } else {
        // For drafts, log warning but allow saving
        logger.warn('Product saved with invalid category', {
          productName: productData.name,
          categoryId: productData.category,
          status: productData.status,
          userId: req.user._id
        });
        // Keep the category ID as is for now, will need to be fixed before activation
      }
    } else {
      // Update productData to use the category ObjectId
      productData.category = category._id;
    }
  }

  // Validate slug uniqueness if provided
  if (productData.slug) {
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      return next(new AppError('A product with this slug already exists', 400, 'SLUG_EXISTS'));
    }
  }

  // Ensure specifications array is properly formatted
  if (productData.specifications && Array.isArray(productData.specifications)) {
    productData.specifications = productData.specifications.filter(spec => 
      spec.name && spec.value && spec.category
    );
  }

  // Ensure variants array is properly formatted
  if (productData.variants && Array.isArray(productData.variants)) {
    productData.variants = productData.variants.filter(variant => 
      variant.name && variant.options && variant.options.length > 0
    );
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

  // Invalidate product caches
  await cacheInvalidation.invalidateProductCaches();

  logger.info('Product created successfully', {
    productId: product._id,
    name: product.name,
    slug: product.slug,
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

  // Invalidate product caches
  await cacheInvalidation.invalidateProductCaches(id);

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

  // Invalidate product caches
  await cacheInvalidation.invalidateProductCaches(id);

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
    sort = 'newest',
    category,
    brand,
    minPrice,
    maxPrice,
    minRating
  } = req.query;

  if (!searchTerm) {
    return next(new AppError('Search term is required', 400, 'SEARCH_TERM_REQUIRED'));
  }

  // Handle category filtering
  let categoryFilter = undefined;
  if (category) {
    if (typeof category === 'string' && !category.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's not an ObjectId, find the category by name or slug
      try {
        const categoryDoc = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
            { slug: { $regex: new RegExp(`^${category}$`, 'i') } }
          ]
        });
        
        if (categoryDoc) {
          categoryFilter = [categoryDoc._id];
        } else {
          // If category not found, return empty results
          return res.status(200).json({
            success: true,
            message: 'No products found for this category',
            data: {
              products: [],
              searchTerm,
              pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                totalProducts: 0,
                hasNextPage: false,
                hasPrevPage: false,
                limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT)
              }
            }
          });
        }
      } catch (error) {
        logger.error('searchProducts - Error finding category:', error);
        categoryFilter = Array.isArray(category) ? category : [category]; // Fallback
      }
    } else {
      categoryFilter = Array.isArray(category) ? category : [category];
    }
  }

  // Build search options
  const searchOptions = {
    page: parseInt(page),
    limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
    sort,
    category: categoryFilter,
    brand: brand ? (Array.isArray(brand) ? brand : [brand]) : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minRating: minRating ? parseFloat(minRating) : undefined
  };

  // Execute search
  const rawProducts = await Product.searchProducts(searchTerm, searchOptions);
  
  // Transform products to include category name as string for frontend compatibility
  const products = Array.isArray(rawProducts) ? rawProducts.map(product => {
    // Ensure category is always a string, never an object
    let categoryName = '';
    if (product.category) {
      if (typeof product.category === 'string') {
        categoryName = product.category;
      } else if (product.category.name) {
        categoryName = product.category.name;
      } else if (product.category._id) {
        categoryName = product.category._id.toString();
      }
    }
    
    // Ensure stock is properly formatted for frontend
    let stockQuantity = 0;
    let stockStatus = 'out_of_stock';
    if (product.stock) {
      if (typeof product.stock === 'object') {
        stockQuantity = product.stock.quantity || 0;
        stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
      } else if (typeof product.stock === 'number') {
        stockQuantity = product.stock;
        stockStatus = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
      }
    }
    
    return {
      ...product,
      categoryName,
      category: categoryName, // Always use string for category
      stockQuantity,
      stockStatus,
      // Keep original stock object for admin use but ensure it's not rendered directly
      stock: {
        quantity: stockQuantity,
        lowStockThreshold: product.stock?.lowStockThreshold || 5,
        trackQuantity: product.stock?.trackQuantity || true
      }
    };
  }) : [];
  
  // Build count query with same filters
  const countFilter = {
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
  };
  
  // Add category filter to count query if present
  if (categoryFilter && categoryFilter.length > 0) {
    countFilter.$and.push({ category: { $in: categoryFilter } });
  }
  
  const totalProducts = await Product.countDocuments(countFilter);

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
  const { rating, title, comment, pros, cons, orderId } = req.body;
  
  console.log('🔍 DEBUG addProductReview:', {
    productId,
    userId: req.user?._id,
    rating,
    title,
    comment,
    pros,
    cons,
    orderId
  });

  // Check if product exists - try by ID first, then by slug
  let product = null;
  if (/^[0-9a-fA-F]{24}$/.test(productId)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findBySlug(productId);
  }
  
  if (!product) {
    return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: product._id
  });

  console.log('🔍 DEBUG existingReview:', {
    exists: !!existingReview,
    hasOrder: !!existingReview?.order,
    existingOrderId: existingReview?.order?.toString(),
    newOrderId: orderId,
    match: existingReview?.order?.toString() === orderId
  });

  // If review exists and orderId is provided, update it
  if (existingReview && orderId) {
    // Update the review regardless of whether it had an order before
    existingReview.rating = rating;
    existingReview.title = title;
    existingReview.comment = comment;
    existingReview.pros = pros || [];
    existingReview.cons = cons || [];
    existingReview.order = orderId; // Set/update the order reference
    existingReview.verifiedPurchase = true;
    
    await existingReview.save();
    await existingReview.populate('user', 'firstName lastName');

    logger.info('Product review updated', {
      reviewId: existingReview._id,
      productId: product._id,
      userId: req.user._id,
      rating,
      orderId,
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: {
        review: existingReview
      }
    });
  }

  // If review exists but no orderId provided, don't allow duplicate
  if (existingReview) {
    return next(new AppError('You have already reviewed this product', 400, 'REVIEW_EXISTS'));
  }

  // Create review
  const reviewData = {
    user: req.user._id,
    product: product._id,
    rating,
    title,
    comment,
    pros: pros || [],
    cons: cons || []
  };

  // Add order reference if provided
  if (orderId) {
    reviewData.order = orderId;
    reviewData.verifiedPurchase = true;
  }

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

  // If this review is for an order, mark the order as reviewed
  if (orderId) {
    try {
      const Order = mongoose.model('Order');
      await Order.findByIdAndUpdate(orderId, {
        reviewedAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to update order reviewedAt', { orderId, error });
      // Don't fail the review creation if order update fails
    }
  }

  logger.info('Product review added', {
    reviewId: review._id,
    productId: product._id,
    userId: req.user._id,
    rating,
    orderId: orderId || null,
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

  // Check if product exists - try by ID first, then by slug
  let product = null;
  if (/^[0-9a-fA-F]{24}$/.test(productId)) {
    product = await Product.findById(productId);
  }
  if (!product) {
    product = await Product.findBySlug(productId);
  }
  
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

  // Get reviews using the actual product ObjectId
  const reviews = await Review.findByProduct(product._id, options);
  const totalReviews = await Review.countDocuments({
    product: product._id,
    status: 'approved'
  });

  // Get rating breakdown
  const ratingBreakdown = await Review.getProductRatingBreakdown(product._id);

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
  // Use getWithProductCount to include product counts and isFeatured
  const categories = await Category.getWithProductCount(false); // false = only active categories

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

  // Try to get products from 'topSeller' section first, fallback to top selling products
  let products = await Product.findBySection('topSeller', parseInt(limit));
  
  if (products.length === 0) {
    // Fallback to top selling products if no products in 'topSeller' section
    products = await Product.findTopSellers(parseInt(limit));
  }

  // Format image URLs
  const baseUrl = getBaseUrl(req);
  const formattedProducts = products.map(product => ({
    ...product.toObject(),
    images: formatProductImages(product.images, baseUrl)
  }));

  res.status(200).json({
    success: true,
    message: 'Top selling products retrieved successfully',
    data: {
      products: formattedProducts
    }
  });
});

// @desc    Get latest products
// @route   GET /api/products/latest
// @access  Public
export const getLatestProducts = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  // Try to get products from 'latest' section first, fallback to newest products
  let products = await Product.findBySection('latest', parseInt(limit));
  
  if (products.length === 0) {
    // Fallback to newest products if no products in 'latest' section
    products = await Product.findLatest(parseInt(limit));
  }

  // Format image URLs
  const baseUrl = getBaseUrl(req);
  const formattedProducts = products.map(product => ({
    ...product.toObject(),
    images: formatProductImages(product.images, baseUrl)
  }));

  res.status(200).json({
    success: true,
    message: 'Latest products retrieved successfully',
    data: {
      products: formattedProducts
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
      // Sort by compare price descending (highest discounts first)
      comparePrice: -1,
      createdAt: -1
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

// @desc    Get weekly deals
// @route   GET /api/products/weekly-deals
// @access  Public
export const getWeeklyDeals = asyncHandler(async (req, res, next) => {
  const { limit = 4 } = req.query;

  // Try to get products from 'weeklyDeal' section first, fallback to products on sale
  let products = await Product.findBySection('weeklyDeal', parseInt(limit));
  
  if (products.length === 0) {
    // Fallback to products on sale if no products in 'weeklyDeal' section
    products = await Product.find({ 
      status: 'active', 
      visibility: 'public',
      comparePrice: { $exists: true, $gt: 0 },
      $expr: { $gt: ['$comparePrice', '$price'] }
    })
      .sort({ 
        comparePrice: -1,
        createdAt: -1
      })
      .limit(parseInt(limit))
      .populate('category', 'name slug')
      .lean();
  }

  // Format image URLs
  const baseUrl = getBaseUrl(req);
  const formattedProducts = products.map(product => ({
    ...product,
    images: formatProductImages(product.images, baseUrl)
  }));

  res.status(200).json({
    success: true,
    message: 'Weekly deals retrieved successfully',
    data: {
      products: formattedProducts
    }
  });
});

// @desc    Get quick picks (featured products with high ratings)
// @route   GET /api/products/quick-picks
// @access  Public
export const getQuickPicks = asyncHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;

  // Try to get products from 'quickPick' section first, fallback to featured/high-rated products
  let products = await Product.findBySection('quickPick', parseInt(limit));
  
  if (products.length === 0) {
    // Fallback to featured/high-rated products if no products in 'quickPick' section
    products = await Product.find({ 
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
  }

  // Format image URLs
  const baseUrl = getBaseUrl(req);
  const formattedProducts = products.map(product => ({
    ...product,
    images: formatProductImages(product.images, baseUrl)
  }));

  res.status(200).json({
    success: true,
    message: 'Quick picks retrieved successfully',
    data: {
      products: formattedProducts
    }
  });
});

// @desc    Get products by section
// @route   GET /api/products/section/:section
// @access  Public
export const getProductsBySection = asyncHandler(async (req, res, next) => {
  const { section } = req.params;
  const { limit = 10 } = req.query;

  console.log(`\n🔍 [BACKEND_SECTION] ========== Get Products By Section ==========`);
  console.log(`   Section: ${section}`);
  console.log(`   Limit: ${limit}`);

  // Validate section
  const validSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
  if (!validSections.includes(section)) {
    console.error(`❌ [BACKEND_SECTION] Invalid section: ${section}`);
    return next(new AppError('Invalid section', 400, 'INVALID_SECTION'));
  }

  console.log(`📊 [BACKEND_SECTION] Querying database...`);
  const products = await Product.findBySection(section, parseInt(limit));
  
  console.log(`📦 [BACKEND_SECTION] Found ${products.length} products`);
  
  // Verify each product actually has the section
  products.forEach((product, index) => {
    const hasSections = product.sections || [];
    const hasSection = hasSections.includes(section);
    console.log(`   ${index + 1}. ${product.name} (${product._id})`);
    console.log(`      Sections: [${hasSections.join(', ')}]`);
    console.log(`      Has "${section}": ${hasSection ? '✅' : '❌'}`);
    
    if (!hasSection) {
      console.error(`      ⚠️ WARNING: Product returned but doesn't have section "${section}"!`);
    }
  });

  // Format image URLs
  const baseUrl = getBaseUrl(req);
  const formattedProducts = products.map(product => ({
    ...product.toObject(),
    images: formatProductImages(product.images, baseUrl)
  }));

  console.log(`✅ [BACKEND_SECTION] Returning ${formattedProducts.length} products`);
  console.log(`========================================\n`);

  res.status(200).json({
    success: true,
    message: `${section} products retrieved successfully`,
    data: {
      section,
      products: formattedProducts,
      count: formattedProducts.length
    }
  });
});