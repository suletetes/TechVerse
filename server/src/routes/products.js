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
import { authenticate, requireAdmin, optionalAuth, apiRateLimit } from '../middleware/auth.js';
import { validate, commonValidations } from '../middleware/validation.js';

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
  commonValidations.mongoId('id'),
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
    .isIn(['name', 'price', 'rating', 'createdAt', '-name', '-price', '-rating', '-createdAt'])
    .withMessage('Invalid sort option'),
  ...commonValidations.pagination()
];

const sectionValidation = [
  param('section')
    .isIn(['latest', 'topSeller', 'quickPick', 'weeklyDeal'])
    .withMessage('Section must be latest, topSeller, quickPick, or weeklyDeal'),
  ...commonValidations.pagination()
];

// Public routes with rate limiting
router.get('/', apiRateLimit, commonValidations.pagination(), validate, optionalAuth, getAllProducts);
router.get('/search', apiRateLimit, searchValidation, validate, optionalAuth, searchProducts);
router.get('/categories', apiRateLimit, getCategories);
router.get('/featured', apiRateLimit, commonValidations.pagination(), validate, getFeaturedProducts);
router.get('/top-sellers', apiRateLimit, commonValidations.pagination(), validate, getTopSellingProducts);
router.get('/latest', apiRateLimit, commonValidations.pagination(), validate, getLatestProducts);
router.get('/on-sale', apiRateLimit, commonValidations.pagination(), validate, getProductsOnSale);
router.get('/weekly-deals', apiRateLimit, commonValidations.pagination(), validate, getWeeklyDeals);
router.get('/quick-picks', apiRateLimit, commonValidations.pagination(), validate, getQuickPicks);
router.get('/section/:section', sectionValidation, validate, getProductsBySection);
router.get('/category/:categoryId', 
  [commonValidations.mongoId('categoryId'), ...commonValidations.pagination()], 
  validate, 
  optionalAuth, 
  getProductsByCategory
);
router.get('/:id', commonValidations.mongoId('id'), validate, optionalAuth, getProductById);
router.get('/:id/reviews', 
  [commonValidations.mongoId('id'), ...commonValidations.pagination()], 
  validate, 
  getProductReviews
);

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