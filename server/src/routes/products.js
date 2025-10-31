import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getFeaturedProducts,
  getTopSellingProducts,
  getLatestProducts,
  getProductsOnSale,
  getWeeklyDeals,
  getQuickPicks,
  getProductsByCategory,
  getProductsBySection,
  addProductReview,
  getProductReviews,
  getCategories
} from '../controllers/productController.js';
import { authenticate, requireAdmin, optionalAuth, apiRateLimit } from '../middleware/passportAuth.js';
import { validate, commonValidations } from '../middleware/validation.js';
import { Product } from '../models/index.js';
import {
  cacheProductList,
  cacheProductDetail,
  cacheCategoryList,
  cacheSearchResults
} from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Validation rules
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('brand')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand must be between 2 and 100 characters'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('sections')
    .optional()
    .isArray({ max: 4 })
    .withMessage('Sections must be an array with maximum 4 items'),
  body('sections.*')
    .optional()
    .isIn(['latest', 'topSeller', 'quickPick', 'weeklyDeal'])
    .withMessage('Each section must be latest, topSeller, quickPick, or weeklyDeal'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with maximum 10 items'),
  body('features')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Features must be an array with maximum 20 items')
];

const reviewValidation = [
  param('id')
    .custom((value) => {
      // Check if it's a valid MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      // Check if it's a valid slug (letters, numbers, hyphens)
      if (/^[a-z0-9-]+$/.test(value) && value.length >= 2 && value.length <= 100) {
        return true;
      }
      throw new Error('Product identifier must be a valid MongoDB ObjectId or slug');
    }),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Review title must be between 5 and 100 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review comment must be between 10 and 1000 characters'),
  body('pros')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 pros allowed'),
  body('cons')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 cons allowed')
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'name', 'price-low', 'price-high', 'rating', 'price', 'createdAt', '-name', '-price', '-rating', '-createdAt'])
    .withMessage('Invalid sort option'),
  ...commonValidations.pagination()
];

const sectionValidation = [
  param('section')
    .isIn(['latest', 'topSeller', 'quickPick', 'weeklyDeal'])
    .withMessage('Section must be latest, topSeller, quickPick, or weeklyDeal'),
  ...commonValidations.pagination()
];

// Public routes with rate limiting and caching
router.get('/', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, optionalAuth, getAllProducts);
router.get('/search', apiRateLimit, cacheSearchResults, searchValidation, validate, optionalAuth, searchProducts);
router.get('/categories', apiRateLimit, cacheCategoryList, getCategories);
router.get('/featured', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, getFeaturedProducts);
router.get('/top-sellers', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, getTopSellingProducts);
router.get('/latest', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, getLatestProducts);
router.get('/on-sale', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, getProductsOnSale);
router.get('/weekly-deals', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, getWeeklyDeals);
router.get('/quick-picks', apiRateLimit, cacheProductList, commonValidations.pagination(), validate, getQuickPicks);
router.get('/section/:section', cacheProductList, sectionValidation, validate, getProductsBySection);
router.get('/category/:categoryId', 
  [commonValidations.mongoId('categoryId'), ...commonValidations.pagination()], 
  validate, 
  optionalAuth, 
  getProductsByCategory
);
// Custom validation for product ID or slug
const productIdOrSlugValidation = [
  param('id')
    .custom((value) => {
      // Check if it's a valid MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      // Check if it's a valid slug (letters, numbers, hyphens)
      if (/^[a-z0-9-]+$/.test(value) && value.length >= 2 && value.length <= 100) {
        return true;
      }
      throw new Error('Product identifier must be a valid MongoDB ObjectId or slug');
    })
];

router.get('/:id', cacheProductDetail, productIdOrSlugValidation, validate, optionalAuth, getProductById);
router.get('/:id/reviews', 
  [productIdOrSlugValidation[0], ...commonValidations.pagination()], 
  validate, 
  getProductReviews
);

// Get related products
router.get('/:id/related', productIdOrSlugValidation, validate, async (req, res, next) => {
  const { id } = req.params;
  const { limit = 4 } = req.query;

  try {
    // First find the product to get its ID
    let product = null;
    
    // Check if it's a valid MongoDB ObjectId format
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      product = await Product.findById(id).select('_id relatedProducts category');
    }
    
    // If not found by ID or not a valid ObjectId, try to find by slug
    if (!product) {
      product = await Product.findBySlug(id).select('_id relatedProducts category');
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    let relatedProducts = [];

    // If product has manually set related products, use those
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      relatedProducts = await Product.find({
        _id: { $in: product.relatedProducts },
        status: 'active',
        visibility: 'public'
      })
      .select('name price images rating slug')
      .limit(parseInt(limit));
    } else {
      // Otherwise, find products in the same category
      relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        status: 'active',
        visibility: 'public'
      })
      .select('name price images rating slug')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .limit(parseInt(limit));
    }

    res.status(200).json({
      success: true,
      message: 'Related products retrieved successfully',
      data: {
        products: relatedProducts
      }
    });
  } catch (error) {
    next(error);
  }
});

// Protected routes (authenticated users)
router.post('/:id/reviews', reviewValidation, validate, authenticate, addProductReview);

// Admin only routes
router.post('/', productValidation, validate, authenticate, requireAdmin, createProduct);
router.put('/:id', 
  [commonValidations.mongoId('id'), ...productValidation], 
  validate, 
  authenticate, 
  requireAdmin, 
  updateProduct
);
router.delete('/:id', commonValidations.mongoId('id'), validate, authenticate, requireAdmin, deleteProduct);

export default router;