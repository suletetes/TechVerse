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
  getAnalytics
} from '../controllers/adminController.js';
import {
  getSectionProducts,
  setSectionProducts,
  addProductToSection,
  removeProductFromSection,
  getAllSections
} from '../controllers/sectionController.js';
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
router.get('/sections', getAllSections);
router.get('/sections/:section', getSectionProducts);
router.post('/sections/:section', setSectionProducts);
router.patch('/sections/:section/add', addProductToSection);
router.patch('/sections/:section/remove', removeProductFromSection);

export default router;