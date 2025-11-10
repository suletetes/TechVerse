// Payment Routes
// Stripe payment endpoints

import express from 'express';
import { body, param } from 'express-validator';
import {
  createPaymentIntent,
  getPaymentIntent,
  getPaymentMethods,
  detachPaymentMethod,
  createRefund,
  handleWebhook
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/passportAuth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route POST /api/payments/create-intent
 * @desc Create payment intent for checkout
 * @access Private
 */
router.post('/create-intent', authenticate, [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
], validate, createPaymentIntent);

/**
 * @route GET /api/payments/intent/:id
 * @desc Get payment intent details
 * @access Private
 */
router.get('/intent/:id', authenticate, [
  param('id')
    .isString()
    .withMessage('Payment intent ID is required')
], validate, getPaymentIntent);

/**
 * @route GET /api/payments/methods
 * @desc Get customer's saved payment methods from Stripe
 * @access Private
 */
router.get('/methods', authenticate, getPaymentMethods);

/**
 * @route DELETE /api/payments/methods/:id
 * @desc Remove saved payment method from Stripe
 * @access Private
 */
router.delete('/methods/:id', authenticate, [
  param('id')
    .isString()
    .withMessage('Payment method ID is required')
], validate, detachPaymentMethod);

/**
 * @route POST /api/payments/refund
 * @desc Create refund for a payment
 * @access Private (Admin only)
 */
router.post('/refund', authenticate, authorize('admin'), [
  body('paymentIntentId')
    .isString()
    .withMessage('Payment intent ID is required'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number')
], validate, createRefund);

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhook events
 * @access Public (verified by Stripe signature)
 * @note This endpoint should use raw body, not JSON parsed body
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
