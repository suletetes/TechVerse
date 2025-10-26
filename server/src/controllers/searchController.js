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
    limit = 20
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
    suggestions = await getSearchSuggestions(q);
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

// Helper function to get search suggestions
async function getSearchSuggestions(query) {
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