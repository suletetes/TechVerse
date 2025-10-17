import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAllOrders,
  getOrderStats,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  setProductsInSection,
  getProductsInSection,
  removeProductFromSection,
  addProductToSection,
  getSectionOverview,
  clearSection,
  getAvailableProducts,
  bulkUpdateProductSections,
  getAnalytics
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Order management routes
router.get('/orders', getAllOrders);
router.get('/orders/stats', getOrderStats);

// Category management routes
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Section management routes
router.get('/sections', getSectionOverview);
router.post('/sections/:section', setProductsInSection);
router.get('/sections/:section', getProductsInSection);
router.delete('/sections/:section', clearSection);
router.post('/sections/:section/products/:productId', addProductToSection);
router.delete('/sections/:section/products/:productId', removeProductFromSection);

// Product management for sections
router.get('/products/available', getAvailableProducts);
router.put('/products/sections', bulkUpdateProductSections);

export default router;