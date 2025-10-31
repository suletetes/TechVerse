import { Product, Category } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// @desc    Advanced product search with autocomplete
// @route   GET /api/search/products
// @access  Public
export const searchProducts = asyncHandler(async (req, res, next) => {
  const {
    q = '',
    category = '',
    minPrice = 0,
    maxPrice = 999999,
    brand = '',
    rating = 0,
    inStock = false,
    sortBy = 'relevance',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
    tags = '',
    specifications = ''
  } = req.query;

  // Build search query
  const searchQuery = {
    status: 'active',
    visibility: 'public'
  };

  // Text search
  if (q) {
    searchQuery.$text = { $search: q };
  }

  // Category filter
  if (category) {
    searchQuery.category = category;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    searchQuery.price = {};
    if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
    if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
  }

  // Brand filter
  if (brand) {
    searchQuery.brand = { $regex: brand, $options: 'i' };
  }

  // Rating filter
  if (rating) {
    searchQuery['rating.average'] = { $gte: parseFloat(rating) };
  }

  // Stock filter
  if (inStock === 'true') {
    searchQuery['stock.quantity'] = { $gt: 0 };
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      searchQuery.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
    }
  }

  // Specifications filter
  if (specifications) {
    try {
      const specFilters = JSON.parse(specifications);
      const specQueries = [];
      
      Object.entries(specFilters).forEach(([category, specs]) => {
        Object.entries(specs).forEach(([specName, values]) => {
          if (Array.isArray(values) && values.length > 0) {
            specQueries.push({
              'specifications': {
                $elemMatch: {
                  category: category,
                  name: specName,
                  value: { $in: values }
                }
              }
            });
          }
        });
      });
      
      if (specQueries.length > 0) {
        searchQuery.$and = searchQuery.$and || [];
        searchQuery.$and.push(...specQueries);
      }
    } catch (error) {
      // Invalid JSON, ignore specifications filter
      console.warn('Invalid specifications filter:', error.message);
    }
  }

  // Build sort options
  let sortOptions = {};
  switch (sortBy) {
    case 'price':
      sortOptions.price = sortOrder === 'desc' ? -1 : 1;
      break;
    case 'rating':
      sortOptions['rating.average'] = -1;
      break;
    case 'newest':
      sortOptions.createdAt = -1;
      break;
    case 'name':
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
      break;
    case 'popularity':
      sortOptions['sales.totalSold'] = -1;
      break;
    case 'relevance':
    default:
      if (q) {
        sortOptions = { score: { $meta: 'textScore' } };
      } else {
        sortOptions.createdAt = -1;
      }
      break;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const limitNum = Math.min(limit, 50);

  // Execute search
  const [products, totalProducts] = await Promise.all([
    Product.find(searchQuery)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(searchQuery)
  ]);

  // Get search suggestions if no results
  let suggestions = [];
  if (products.length === 0 && q) {
    suggestions = await getSearchSuggestionsInternal(q);
  }

  // Get facets for filtering
  const facets = await getSearchFacets(searchQuery);

  const totalPages = Math.ceil(totalProducts / limitNum);

  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    data: {
      products,
      suggestions,
      facets,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limitNum
      },
      searchQuery: {
        q,
        category,
        minPrice,
        maxPrice,
        brand,
        rating,
        inStock,
        sortBy,
        sortOrder
      }
    }
  });
});

// @desc    Get search autocomplete suggestions
// @route   GET /api/search/autocomplete
// @access  Public
export const getAutocomplete = asyncHandler(async (req, res, next) => {
  const { q = '', limit = 10 } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json({
      success: true,
      data: { suggestions: [] }
    });
  }

  // Get product name suggestions
  const productSuggestions = await Product.find({
    status: 'active',
    visibility: 'public',
    name: { $regex: q, $options: 'i' }
  })
    .select('name')
    .limit(parseInt(limit))
    .lean();

  // Get brand suggestions
  const brandSuggestions = await Product.distinct('brand', {
    status: 'active',
    visibility: 'public',
    brand: { $regex: q, $options: 'i' }
  });

  // Get category suggestions
  const categorySuggestions = await Category.find({
    name: { $regex: q, $options: 'i' },
    isActive: true
  })
    .select('name')
    .limit(5)
    .lean();

  const suggestions = [
    ...productSuggestions.map(p => ({ type: 'product', text: p.name })),
    ...brandSuggestions.slice(0, 3).map(b => ({ type: 'brand', text: b })),
    ...categorySuggestions.map(c => ({ type: 'category', text: c.name }))
  ].slice(0, parseInt(limit));

  res.status(200).json({
    success: true,
    data: { suggestions }
  });
});

// @desc    Get search filters/facets
// @route   GET /api/search/filters
// @access  Public
export const getSearchFilters = asyncHandler(async (req, res, next) => {
  const { category = '' } = req.query;

  const baseQuery = {
    status: 'active',
    visibility: 'public'
  };

  if (category) {
    baseQuery.category = category;
  }

  const [
    priceRange,
    brands,
    categories,
    ratings
  ] = await Promise.all([
    // Price range
    Product.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]),

    // Available brands
    Product.distinct('brand', baseQuery),

    // Available categories
    Category.find({ isActive: true })
      .select('name slug')
      .lean(),

    // Rating distribution
    Product.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: { $floor: '$rating.average' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
      brands: brands.filter(Boolean).sort(),
      categories,
      ratings
    }
  });
});

// @desc    Get search suggestions for empty results
// @route   GET /api/search/suggestions
// @access  Public
export const getSearchSuggestions = asyncHandler(async (req, res, next) => {
  const { q = '' } = req.query;

  if (!q || q.length < 2) {
    return res.status(200).json({
      success: true,
      data: { suggestions: [] }
    });
  }

  try {
    // Get similar products based on partial matches
    const suggestions = await Product.find({
      status: 'active',
      visibility: 'public',
      $or: [
        { name: { $regex: q.split(' ')[0], $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
      .select('name brand')
      .limit(5)
      .lean();

    const suggestionList = suggestions.map(p => p.name);

    res.status(200).json({
      success: true,
      data: { suggestions: suggestionList }
    });
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    res.status(200).json({
      success: true,
      data: { suggestions: [] }
    });
  }
});

// @desc    Get popular search terms
// @route   GET /api/search/popular
// @access  Public
export const getPopularSearches = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  try {
    // For now, return static popular searches
    // In a real app, this would come from search analytics
    const popularSearches = [
      'iPhone 15',
      'MacBook Pro',
      'Samsung Galaxy',
      'iPad Air',
      'AirPods Pro',
      'PlayStation 5',
      'Nintendo Switch',
      'Dell XPS',
      'Sony WH-1000XM5',
      'Apple Watch'
    ].slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: { searches: popularSearches }
    });
  } catch (error) {
    logger.error('Error getting popular searches:', error);
    res.status(200).json({
      success: true,
      data: { searches: [] }
    });
  }
});

// @desc    Track search analytics
// @route   POST /api/search/analytics
// @access  Public
export const trackSearchAnalytics = asyncHandler(async (req, res, next) => {
  const { query, resultsCount, filters = {} } = req.body;

  try {
    // In a real app, you would save this to a search analytics collection
    // For now, just log it
    logger.info('Search Analytics:', {
      query,
      resultsCount,
      filters,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Analytics tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking search analytics:', error);
    res.status(200).json({
      success: true,
      message: 'Analytics tracking failed'
    });
  }
});

// Helper function to get search suggestions (internal use)
async function getSearchSuggestionsInternal(query) {
  try {
    // Get similar products based on partial matches
    const suggestions = await Product.find({
      status: 'active',
      visibility: 'public',
      $or: [
        { name: { $regex: query.split(' ')[0], $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .select('name brand')
      .limit(5)
      .lean();

    return suggestions.map(p => p.name);
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    return [];
  }
}

// Helper function to get search facets
async function getSearchFacets(baseQuery) {
  try {
    const [brands, priceRanges] = await Promise.all([
      Product.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      Product.aggregate([
        { $match: baseQuery },
        {
          $bucket: {
            groupBy: '$price',
            boundaries: [0, 50, 100, 200, 500, 1000, 2000],
            default: '2000+',
            output: { count: { $sum: 1 } }
          }
        }
      ])
    ]);

    return { brands, priceRanges };
  } catch (error) {
    logger.error('Error getting search facets:', error);
    return { brands: [], priceRanges: [] };
  }
}