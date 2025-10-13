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
  getAnalytics,
  getHomepageSections,
  updateHomepageSection,
  getHomepageSectionsPreview,
  getStores,
  createStore,
  updateStore,
  deleteStore
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

// Homepage sections management
router.get('/sections', getHomepageSections);
router.get('/sections/preview', getHomepageSectionsPreview);
router.put('/sections/:sectionType', updateHomepageSection);

// Store management
router.get('/stores', getStores);
router.post('/stores', createStore);
router.put('/stores/:id', updateStore);
router.delete('/stores/:id', deleteStore);

export default router;