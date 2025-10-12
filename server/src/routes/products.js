import express from 'express';
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
  getQuickPicks,
  getProductsByCategory,
  addProductReview,
  getProductReviews,
  getCategories
} from '../controllers/productController.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllProducts);
router.get('/search', optionalAuth, searchProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);
router.get('/top-sellers', getTopSellingProducts);
router.get('/latest', getLatestProducts);
router.get('/on-sale', getProductsOnSale);
router.get('/quick-picks', getQuickPicks);
router.get('/category/:categoryId', optionalAuth, getProductsByCategory);
router.get('/:id', optionalAuth, getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected routes (authenticated users)
router.post('/:id/reviews', authenticate, addProductReview);

// Admin only routes
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;