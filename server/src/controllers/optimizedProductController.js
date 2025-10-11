import { Product, Category, Review } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { cache, cacheService } from '../middleware/caching.js';
import queryOptimizer, { optimizedFind, optimizedFindOne, optimizedAggregate, optimizedCount } from '../utils/queryOptimizer.js';
import logger from '../utils/logger.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';

// @desc    Get all products with advanced optimization
// @route   GET /api/products
// @access  Public
export const getOptimizedProducts = [
  // Cache middleware with intelligent key generation
  cache({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
      const { page, limit, sort, category, brand, minPrice, maxPrice, minRating, featured } = req.query;
      return `products:${page || 1}:${limit || 20}:${sort || 'newest'}:${category || 'all'}:${brand || 'all'}:${minPrice || 0}:${maxPrice || 'max'}:${minRating || 0}:${featured || 'all'}`;
    },
    condition: (req) => req.method === 'GET'
  }),
  
  asyncHandler(async (req, res, next) => {
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

    // Build optimized filter conditions
    const conditions = {
      status,
      visibility: 'public'
    };

    if (category) conditions.category = category;
    if (brand) conditions.brand = { $in: Array.isArray(brand) ? brand : [brand] };
    if (minPrice || maxPrice) {
      conditions.price = {};
      if (minPrice) conditions.price.$gte = parseFloat(minPrice);
      if (maxPrice) conditions.price.$lte = parseFloat(maxPrice);
    }
    if (minRating) conditions['rating.average'] = { $gte: parseFloat(minRating) };
    if (featured === 'true') conditions.featured = true;

    // Optimized sort options
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'price_asc': { price: 1 },
      'price_desc': { price: -1 },
      'rating': { 'rating.average': -1, 'rating.count': -1 },
      'name_asc': { name: 1 },
      'name_desc': { name: -1 },
      'popularity': { 'sales.totalSold': -1, 'rating.average': -1 }
    };

    // Execute optimized queries in parallel
    const [products, totalProducts] = await Promise.all([
      optimizedFind(Product, conditions, {
        populate: [
          { path: 'category', select: 'name slug' }
        ],
        select: 'name slug price comparePrice images rating sales featured brand status createdAt',
        sort: sortOptions[sort] || sortOptions.newest,
        page: parseInt(page),
        limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
        lean: true
      }),
      optimizedCount(Product, conditions)
    ]);

    // Calculate pagination info
    const actualLimit = Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT);
    const totalPages = Math.ceil(totalProducts / actualLimit);
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
          limit: actualLimit
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
  })
];

// @desc    Get single product with optimized loading
// @route   GET /api/products/:id
// @access  Public
export const getOptimizedProductById = [
  cache({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => `product:${req.params.id}`,
    condition: (req) => req.method === 'GET'
  }),
  
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug with optimized population
    let product = await optimizedFindOne(Product, { _id: id }, {
      populate: [
        { path: 'category', select: 'name slug description' },
        { path: 'relatedProducts', select: 'name price images rating slug' },
        { path: 'crossSells', select: 'name price images rating slug' },
        { path: 'upsells', select: 'name price images rating slug' }
      ],
      lean: false // Need full document for methods
    });

    if (!product) {
      product = await optimizedFindOne(Product, { slug: id }, {
        populate: [
          { path: 'category', select: 'name slug description' },
          { path: 'relatedProducts', select: 'name price images rating slug' },
          { path: 'crossSells', select: 'name price images rating slug' },
          { path: 'upsells', select: 'name price images rating slug' }
        ],
        lean: false
      });
    }

    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Check visibility permissions
    if (product.status !== 'active' || product.visibility !== 'public') {
      if (!req.user || (req.user.role !== 'admin' && product.createdBy.toString() !== req.user._id.toString())) {
        return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: { product }
    });
  })
];

// @desc    Search products with optimized full-text search
// @route   GET /api/products/search
// @access  Public
export const optimizedSearchProducts = [
  cache({
    ttl: 180, // 3 minutes (shorter for search results)
    keyGenerator: (req) => {
      const { q, page, limit, sort, category, brand, minPrice, maxPrice } = req.query;
      return `search:${q}:${page || 1}:${limit || 20}:${sort || 'relevance'}:${category || 'all'}:${brand || 'all'}:${minPrice || 0}:${maxPrice || 'max'}`;
    }
  }),
  
  asyncHandler(async (req, res, next) => {
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

    // Build aggregation pipeline for optimized search
    const searchStages = [
      {
        type: 'match',
        conditions: {
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
        }
      }
    ];

    // Add filters
    const additionalFilters = {};
    if (category) additionalFilters.category = { $in: Array.isArray(category) ? category : [category] };
    if (brand) additionalFilters.brand = { $in: Array.isArray(brand) ? brand : [brand] };
    if (minPrice) additionalFilters.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) additionalFilters.price = { ...additionalFilters.price, $lte: parseFloat(maxPrice) };
    if (minRating) additionalFilters['rating.average'] = { $gte: parseFloat(minRating) };

    if (Object.keys(additionalFilters).length > 0) {
      searchStages[0].conditions.$and.push(additionalFilters);
    }

    // Add lookup for category
    searchStages.push({
      type: 'lookup',
      from: 'categories',
      localField: 'category',
      foreignField: '_id',
      as: 'category'
    });

    searchStages.push({
      type: 'unwind',
      path: '$category',
      preserveNullAndEmptyArrays: true
    });

    // Add sorting
    const sortOptions = {
      'relevance': { score: { $meta: 'textScore' }, 'rating.average': -1 },
      'price_asc': { price: 1 },
      'price_desc': { price: -1 },
      'rating': { 'rating.average': -1 },
      'newest': { createdAt: -1 },
      'popularity': { 'sales.totalSold': -1 }
    };

    if (sortOptions[sort]) {
      searchStages.push({
        type: 'sort',
        fields: sortOptions[sort]
      });
    }

    // Add projection to limit fields
    searchStages.push({
      type: 'project',
      fields: {
        name: 1,
        slug: 1,
        price: 1,
        comparePrice: 1,
        images: 1,
        rating: 1,
        brand: 1,
        'category.name': 1,
        'category.slug': 1,
        createdAt: 1
      }
    });

    // Execute search with pagination
    const actualLimit = Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (parseInt(page) - 1) * actualLimit;

    const [products, totalCount] = await Promise.all([
      optimizedAggregate(Product, [
        ...searchStages,
        { type: 'skip', count: skip },
        { type: 'limit', count: actualLimit }
      ]),
      optimizedAggregate(Product, [
        ...searchStages.slice(0, -1), // Exclude projection for count
        { type: 'group', id: null, fields: { count: { $sum: 1 } } }
      ])
    ]);

    const totalProducts = totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalProducts / actualLimit);
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
          limit: actualLimit
        }
      }
    });
  })
];

// @desc    Get featured products with caching
// @route   GET /api/products/featured
// @access  Public
export const getOptimizedFeaturedProducts = [
  cache({
    ttl: 1800, // 30 minutes
    keyGenerator: () => 'featured_products',
    condition: (req) => req.method === 'GET'
  }),
  
  asyncHandler(async (req, res, next) => {
    const { limit = 10 } = req.query;
    
    const products = await optimizedFind(Product, 
      { featured: true, status: 'active', visibility: 'public' },
      {
        select: 'name slug price comparePrice images rating brand featured',
        sort: { 'sales.totalSold': -1, 'rating.average': -1 },
        limit: parseInt(limit),
        lean: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Featured products retrieved successfully',
      data: { products }
    });
  })
];

// @desc    Get product reviews with optimized aggregation
// @route   GET /api/products/:id/reviews
// @access  Public
export const getOptimizedProductReviews = [
  cache({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
      const { page, limit, sort, rating } = req.query;
      return `reviews:${req.params.id}:${page || 1}:${limit || 20}:${sort || 'newest'}:${rating || 'all'}`;
    }
  }),
  
  asyncHandler(async (req, res, next) => {
    const { id: productId } = req.params;
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      sort = 'newest',
      rating,
      verified
    } = req.query;

    // Verify product exists (with caching)
    const cacheKey = `product_exists:${productId}`;
    let productExists = await cacheService.get(cacheKey);
    
    if (productExists === null) {
      const product = await optimizedFindOne(Product, { _id: productId }, {
        select: '_id',
        lean: true
      });
      productExists = !!product;
      await cacheService.set(cacheKey, productExists, 600); // Cache for 10 minutes
    }

    if (!productExists) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Build aggregation pipeline for reviews
    const reviewStages = [
      {
        type: 'match',
        conditions: {
          product: productId,
          status: 'approved'
        }
      }
    ];

    // Add filters
    if (rating) {
      reviewStages[0].conditions.rating = parseInt(rating);
    }
    if (verified === 'true') {
      reviewStages[0].conditions.verified = true;
    }

    // Add user lookup
    reviewStages.push({
      type: 'lookup',
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'user'
    });

    reviewStages.push({
      type: 'unwind',
      path: '$user'
    });

    // Add sorting
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'rating_high': { rating: -1, createdAt: -1 },
      'rating_low': { rating: 1, createdAt: -1 },
      'helpful': { 'helpful.length': -1, createdAt: -1 }
    };

    reviewStages.push({
      type: 'sort',
      fields: sortOptions[sort] || sortOptions.newest
    });

    // Add projection
    reviewStages.push({
      type: 'project',
      fields: {
        rating: 1,
        title: 1,
        comment: 1,
        verified: 1,
        helpful: 1,
        createdAt: 1,
        'user.firstName': 1,
        'user.lastName': 1,
        'user.avatar': 1
      }
    });

    // Execute queries in parallel
    const actualLimit = Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (parseInt(page) - 1) * actualLimit;

    const [reviews, totalReviews, ratingBreakdown] = await Promise.all([
      optimizedAggregate(Product.collection.db.collection('reviews'), [
        ...reviewStages,
        { type: 'skip', count: skip },
        { type: 'limit', count: actualLimit }
      ]),
      
      optimizedCount(Review, { product: productId, status: 'approved' }),
      
      // Get rating breakdown
      optimizedAggregate(Product.collection.db.collection('reviews'), [
        {
          type: 'match',
          conditions: { product: productId, status: 'approved' }
        },
        {
          type: 'group',
          id: '$rating',
          fields: { count: { $sum: 1 } }
        },
        {
          type: 'sort',
          fields: { _id: -1 }
        }
      ])
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(totalReviews / actualLimit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format rating breakdown
    const formattedBreakdown = {
      totalReviews,
      averageRating: 0,
      ratings: [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: ratingBreakdown.find(r => r._id === rating)?.count || 0
      }))
    };

    if (totalReviews > 0) {
      const totalRatingPoints = formattedBreakdown.ratings.reduce(
        (sum, r) => sum + (r.rating * r.count), 0
      );
      formattedBreakdown.averageRating = Math.round((totalRatingPoints / totalReviews) * 10) / 10;
    }

    res.status(200).json({
      success: true,
      message: 'Product reviews retrieved successfully',
      data: {
        reviews,
        ratingBreakdown: formattedBreakdown,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews,
          hasNextPage,
          hasPrevPage,
          limit: actualLimit
        }
      }
    });
  })
];

// @desc    Get products by category with optimization
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getOptimizedProductsByCategory = [
  cache({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
      const { page, limit, sort, brand, minPrice, maxPrice } = req.query;
      return `category_products:${req.params.categoryId}:${page || 1}:${limit || 20}:${sort || 'newest'}:${brand || 'all'}:${minPrice || 0}:${maxPrice || 'max'}`;
    }
  }),
  
  asyncHandler(async (req, res, next) => {
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

    // Validate category exists (with caching)
    const cacheKey = `category:${categoryId}`;
    let category = await cacheService.get(cacheKey);
    
    if (!category) {
      category = await optimizedFindOne(Category, { _id: categoryId }, {
        select: 'name slug description',
        lean: true
      });
      
      if (category) {
        await cacheService.set(cacheKey, category, 1800); // Cache for 30 minutes
      }
    }

    if (!category) {
      return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Build filter conditions
    const conditions = {
      category: categoryId,
      status: 'active',
      visibility: 'public'
    };

    if (brand) conditions.brand = { $in: Array.isArray(brand) ? brand : [brand] };
    if (minPrice) conditions.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) conditions.price = { ...conditions.price, $lte: parseFloat(maxPrice) };
    if (minRating) conditions['rating.average'] = { $gte: parseFloat(minRating) };

    // Sort options
    const sortOptions = {
      'newest': { createdAt: -1 },
      'oldest': { createdAt: 1 },
      'price_asc': { price: 1 },
      'price_desc': { price: -1 },
      'rating': { 'rating.average': -1, 'rating.count': -1 },
      'name_asc': { name: 1 },
      'name_desc': { name: -1 },
      'popularity': { 'sales.totalSold': -1 }
    };

    // Execute optimized queries
    const [products, totalProducts] = await Promise.all([
      optimizedFind(Product, conditions, {
        select: 'name slug price comparePrice images rating brand sales featured createdAt',
        sort: sortOptions[sort] || sortOptions.newest,
        page: parseInt(page),
        limit: Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT),
        lean: true
      }),
      optimizedCount(Product, conditions)
    ]);

    // Calculate pagination
    const actualLimit = Math.min(parseInt(limit), PAGINATION_DEFAULTS.MAX_LIMIT);
    const totalPages = Math.ceil(totalProducts / actualLimit);
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
          limit: actualLimit
        }
      }
    });
  })
];

export default {
  getOptimizedProducts,
  getOptimizedProductById,
  optimizedSearchProducts,
  getOptimizedFeaturedProducts,
  getOptimizedProductReviews,
  getOptimizedProductsByCategory
};