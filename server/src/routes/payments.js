import express from 'express';
import {
  createPaymentIntent,
  getPaymentIntent,
  getPaymentMethods,
  detachPaymentMethod,
  createRefund,
  handleWebhook
} from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/passportAuth.js';

const router = express.Router();

// Payment intent routes
router.post('/create-intent', authenticate, createPaymentIntent);
router.get('/intent/:id', authenticate, getPaymentIntent);

// Payment methods routes
router.get('/methods', authenticate, getPaymentMethods);
router.delete('/methods/:id', authenticate, detachPaymentMethod);

// Refund route (admin only)
router.post('/refund', authenticate, requireAdmin, createRefund);

// Webhook route (public but verified by Stripe signature)
// Note: This route needs raw body, so it should be registered before body parser middleware
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
