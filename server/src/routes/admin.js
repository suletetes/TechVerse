import express from 'express';
import { body, param, query } from 'express-validator';
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
  getAdminCategories,
  getCategorySpecifications,
  updateCategorySpecifications,
  setProductsInSection,
  getProductsInSection,
  removeProductFromSection,
  addProductToSection,
  getSectionOverview,
  clearSection,
  getAvailableProducts,
  bulkUpdateProductSections,
  getAnalytics,
  getLowStockProducts,
  updateProductStock,
  bulkUpdateStock,
  getInventoryAnalytics,
  getUserActivities,
  getActivityAnalytics,
  getComprehensiveAnalytics,
  getRealtimeMetrics,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrderById,
  updateOrderStatus,
  getAdminProfile,
  updateAdminProfile
} from '../controllers/adminController.js';
import {
  getSecurityDashboard,
  getSecurityAlerts,
  testSecurityMonitoring,
  getSecurityConfig,
  clearSecurityEvents
} from '../controllers/securityController.js';
import { authenticate, requireAdmin } from '../middleware/passportAuth.js';
import { validate, commonValidations } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const userStatusValidation = [
  commonValidations.mongoId('id'),
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'pending'])
    .withMessage('Status must be active, inactive, suspended, or pending'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Reason must be between 3 and 200 characters')
];

const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const sectionValidation = [
  param('section')
    .isIn(['latest', 'topSeller', 'quickPick', 'weeklyDeal'])
    .withMessage('Section must be latest, topSeller, quickPick, or weeklyDeal')
];

const sectionProductsValidation = [
  ...sectionValidation,
  body('productIds')
    .isArray({ min: 0, max: 20 })
    .withMessage('Product IDs must be an array with maximum 20 items'),
  body('productIds.*')
    .isMongoId()
    .withMessage('Each product ID must be a valid MongoDB ObjectId')
];

const bulkSectionUpdateValidation = [
  body('updates')
    .isArray({ min: 1, max: 100 })
    .withMessage('Updates must be an array with 1-100 items'),
  body('updates.*.productId')
    .isMongoId()
    .withMessage('Product ID must be valid'),
  body('updates.*.sections')
    .isArray({ max: 4 })
    .withMessage('Sections must be an array with maximum 4 items'),
  body('updates.*.sections.*')
    .isIn(['latest', 'topSeller', 'quickPick', 'weeklyDeal'])
    .withMessage('Each section must be latest, topSeller, quickPick, or weeklyDeal')
];

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Admin profile routes
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Dashboard routes
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', commonValidations.mongoId('id'), validate, getUserById);
router.put('/users/:id/status', userStatusValidation, validate, updateUserStatus);
router.delete('/users/:id', commonValidations.mongoId('id'), validate, deleteUser);

// Order management routes
router.get('/orders', authenticate, requireAdmin, getAllOrders);
router.get('/orders/stats', authenticate, requireAdmin, getOrderStats);
router.get('/orders/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, getOrderById);
router.put('/orders/:id/status', authenticate, requireAdmin, [
  commonValidations.mongoId('id'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], validate, updateOrderStatus);

// Category management routes
router.get('/categories', getAllCategories);
router.get('/categories/admin', getAdminCategories);
router.post('/categories', categoryValidation, validate, createCategory);
router.put('/categories/:id', commonValidations.mongoId('id'), categoryValidation, validate, updateCategory);
router.delete('/categories/:id', commonValidations.mongoId('id'), validate, deleteCategory);
router.get('/categories/:slug/specifications', getCategorySpecifications);
router.put('/categories/:id/specifications', commonValidations.mongoId('id'), validate, updateCategorySpecifications);

// Section management routes
router.get('/sections', getSectionOverview);
router.post('/sections/:section', sectionProductsValidation, validate, setProductsInSection);
router.get('/sections/:section', sectionValidation, validate, getProductsInSection);
router.delete('/sections/:section', sectionValidation, validate, clearSection);
router.post('/sections/:section/products/:productId', 
  sectionValidation.concat([commonValidations.mongoId('productId')]), 
  validate, 
  addProductToSection
);
router.delete('/sections/:section/products/:productId', 
  sectionValidation.concat([commonValidations.mongoId('productId')]), 
  validate, 
  removeProductFromSection
);

// Product management for sections
router.get('/products/available', getAvailableProducts);
router.put('/products/sections', bulkSectionUpdateValidation, validate, bulkUpdateProductSections);

// Security monitoring routes
router.get('/security/dashboard', getSecurityDashboard);
router.get('/security/alerts', getSecurityAlerts);
router.post('/security/test', testSecurityMonitoring);
router.get('/security/config', getSecurityConfig);
router.post('/security/clear', clearSecurityEvents);

// Product management routes
router.get('/products', authenticate, requireAdmin, getAllProducts);
router.get('/products/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, getProductById);
router.post('/products', authenticate, requireAdmin, createProduct);
router.put('/products/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, updateProduct);
router.delete('/products/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, deleteProduct);

// Inventory management routes
router.get('/inventory/low-stock', authenticate, requireAdmin, getLowStockProducts);
router.put('/inventory/:id/stock', authenticate, requireAdmin, [
  commonValidations.mongoId('id'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason must be less than 200 characters')
], validate, updateProductStock);
router.put('/inventory/bulk-update', authenticate, requireAdmin, [
  body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
  body('updates.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('updates.*.quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
], validate, bulkUpdateStock);
router.get('/inventory/analytics', authenticate, requireAdmin, getInventoryAnalytics);

// Activity tracking routes
router.get('/users/:id/activities', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, getUserActivities);
router.get('/analytics/activities', authenticate, requireAdmin, getActivityAnalytics);
router.get('/analytics/comprehensive', authenticate, requireAdmin, getComprehensiveAnalytics);
router.get('/analytics/realtime', authenticate, requireAdmin, getRealtimeMetrics);

export default router;