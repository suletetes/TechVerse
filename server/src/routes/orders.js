import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  processPayment,
  refundOrder
} from '../controllers/orderController.js';
import { authenticate, requireAdmin, requireOwnershipOrAdmin } from '../middleware/passportAuth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate, commonValidations } from '../middleware/validation.js';

const router = express.Router();

// Validation rules
const orderValidation = [
  body('items')
    .isArray({ min: 1, max: 50 })
    .withMessage('Order must contain 1-50 items'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
  body('shippingAddress.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name is required'),
  body('shippingAddress.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address is required'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City is required'),
  body('shippingAddress.postcode')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Postcode is required'),
  body('paymentMethod')
    .isIn(['card', 'paypal', 'stripe'])
    .withMessage('Invalid payment method')
];

const orderStatusValidation = [
  commonValidations.mongoId('id'),
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Invalid order status'),
  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const paymentValidation = [
  commonValidations.mongoId('id'),
  body('paymentMethodId')
    .optional()
    .isMongoId()
    .withMessage('Invalid payment method ID'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
];

const refundValidation = [
  commonValidations.mongoId('id'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Refund reason must be between 5 and 200 characters')
];

// Protected routes (authenticated users)
router.post('/', orderValidation, validate, authenticate, createOrder);
router.get('/user', commonValidations.pagination(), validate, authenticate, getUserOrders);
router.get('/number/:orderNumber', authenticate, getOrderByNumber);
router.get('/:id', commonValidations.mongoId('id'), validate, authenticate, getOrderById);
router.put('/:id/cancel', commonValidations.mongoId('id'), validate, authenticate, cancelOrder);
router.get('/:id/tracking', commonValidations.mongoId('id'), validate, authenticate, getOrderTracking);
router.post('/:id/payment', paymentValidation, validate, authenticate, processPayment);

// Admin only routes
router.put('/:id/status', orderStatusValidation, validate, authenticate, requirePermission('orders.update'), updateOrderStatus);
router.post('/:id/refund', refundValidation, validate, authenticate, requirePermission('orders.refund'), refundOrder);

export default router;