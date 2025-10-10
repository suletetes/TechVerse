import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  processPayment,
  refundOrder
} from '../controllers/orderController.js';
import { authenticate, requireAdmin, requireOwnershipOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (authenticated users)
router.post('/', authenticate, createOrder);
router.get('/user', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/cancel', authenticate, cancelOrder);
router.get('/:id/tracking', authenticate, getOrderTracking);
router.post('/:id/payment', authenticate, processPayment);

// Admin only routes
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.post('/:id/refund', authenticate, requireAdmin, refundOrder);

export default router;