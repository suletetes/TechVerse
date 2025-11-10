import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  bulkUpdateUserStatus,
  getUserAnalytics,
  exportUsers,
  sendUserNotification,
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
  getComprehensiveAnalytics,
  getRealtimeMetrics,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
  duplicateProduct,
  getProductAnalytics,
  exportProducts,
  getOrderById,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  getOrderAnalytics,
  processRefund,
  exportOrders,
  getAdminProfile,
  updateAdminProfile,
  getAllReviews,
  getPendingReviews,
  moderateReview,
  bulkModerateReviews,
  getReviewAnalytics,
  deleteReview,
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

// User management routes - Enhanced
router.get('/users', getAllUsers);
router.get('/users/analytics', getUserAnalytics);
router.get('/users/export', exportUsers);
router.get('/users/:id', commonValidations.mongoId('id'), validate, getUserById);
router.put('/users/:id/status', userStatusValidation, validate, updateUserStatus);
router.put('/users/bulk-status', [
  body('userIds').isArray({ min: 1, max: 50 }).withMessage('User IDs array is required (max 50 items)'),
  body('userIds.*').isMongoId().withMessage('Each user ID must be valid'),
  body('accountStatus').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid account status'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('suspensionReason').optional().trim().isLength({ max: 200 }).withMessage('Suspension reason must be less than 200 characters')
], validate, bulkUpdateUserStatus);
router.post('/users/notify', [
  body('userIds').isArray({ min: 1, max: 100 }).withMessage('User IDs array is required (max 100 items)'),
  body('userIds.*').isMongoId().withMessage('Each user ID must be valid'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 characters)'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required (max 500 characters)'),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid notification type'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean')
], validate, sendUserNotification);
router.delete('/users/:id', commonValidations.mongoId('id'), validate, deleteUser);

// Review management routes
router.get('/reviews', authenticate, requireAdmin, getAllReviews);
router.get('/reviews/pending', authenticate, requireAdmin, getPendingReviews);
router.get('/reviews/analytics', authenticate, requireAdmin, getReviewAnalytics);
router.put('/reviews/:id/moderate', authenticate, requireAdmin, [
  commonValidations.mongoId('id'),
  body('action').isIn(['approve', 'reject', 'flag']).withMessage('Invalid moderation action'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], validate, moderateReview);
router.put('/reviews/bulk-moderate', authenticate, requireAdmin, [
  body('reviewIds').isArray({ min: 1, max: 50 }).withMessage('Review IDs array is required (max 50 items)'),
  body('reviewIds.*').isMongoId().withMessage('Each review ID must be valid'),
  body('action').isIn(['approve', 'reject', 'flag']).withMessage('Invalid moderation action'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], validate, bulkModerateReviews);
router.delete('/reviews/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, deleteReview);

// Order management routes - Enhanced
router.get('/orders', authenticate, requireAdmin, getAllOrders);
router.get('/orders/stats', authenticate, requireAdmin, getOrderStats);
router.get('/orders/analytics', authenticate, requireAdmin, getOrderAnalytics);
router.get('/orders/export', authenticate, requireAdmin, exportOrders);
router.get('/orders/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, getOrderById);
router.put('/orders/:id/status', authenticate, requireAdmin, [
  commonValidations.mongoId('id'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], validate, updateOrderStatus);
router.put('/orders/bulk-status', authenticate, requireAdmin, [
  body('orderIds').isArray({ min: 1, max: 50 }).withMessage('Order IDs array is required (max 50 items)'),
  body('orderIds.*').isMongoId().withMessage('Each order ID must be valid'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], validate, bulkUpdateOrderStatus);
router.post('/orders/:id/refund', authenticate, requireAdmin, [
  commonValidations.mongoId('id'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
  body('reason').trim().isLength({ min: 5, max: 200 }).withMessage('Refund reason is required (5-200 characters)'),
  body('refundItems').optional().isArray().withMessage('Refund items must be an array')
], validate, processRefund);

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

// Product management routes - Enhanced
router.get('/products', authenticate, requireAdmin, getAllProducts);
router.get('/products/analytics', authenticate, requireAdmin, getProductAnalytics);
router.get('/products/export', authenticate, requireAdmin, exportProducts);
router.get('/products/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, getProductById);
router.post('/products', authenticate, requireAdmin, [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Product name must be between 2 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('brand').trim().isLength({ min: 1, max: 100 }).withMessage('Brand is required and must be less than 100 characters'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('sku').optional().trim().isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters')
], validate, createProduct);
router.put('/products/:id', authenticate, requireAdmin, [
  commonValidations.mongoId('id')
], validate, updateProduct);
router.put('/products/bulk', authenticate, requireAdmin, [
  body('updates').isArray({ min: 1, max: 100 }).withMessage('Updates array is required (max 100 items)'),
  body('action').isIn(['price_update', 'stock_update', 'status_update', 'category_update', 'general']).withMessage('Valid action is required')
], validate, bulkUpdateProducts);
router.post('/products/:id/duplicate', authenticate, requireAdmin, [
  commonValidations.mongoId('id'),
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Product name must be between 2 and 200 characters'),
  body('sku').optional().trim().isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters')
], validate, duplicateProduct);
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

// Activity tracking routes removed - feature deprecated
// router.get('/users/:id/activities', authenticate, requireAdmin, getUserActivities);
// router.get('/analytics/activities', authenticate, requireAdmin, getActivityAnalytics);
router.get('/analytics/comprehensive', authenticate, requireAdmin, getComprehensiveAnalytics);
router.get('/analytics/realtime', authenticate, requireAdmin, getRealtimeMetrics);

// Activity log route removed - feature deprecated

export default router;