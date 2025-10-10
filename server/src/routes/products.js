import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getFeaturedProducts,
  getProductsByCategory,
  addProductReview,
  getProductReviews
} from '../controllers/productController.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getAllProducts);
router.get('/search', optionalAuth, searchProducts);
router.get('/featured', getFeaturedProducts);
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