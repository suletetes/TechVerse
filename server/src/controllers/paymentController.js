// Payment Controller
// Handles Stripe payment operations

import stripeService from '../services/stripeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Create payment intent
 * @route POST /api/payments/create-intent
 * @access Private
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency, metadata } = req.body;
  const userId = req.user._id;

  const paymentIntent = await stripeService.createPaymentIntent({
    userId,
    amount,
    currency: currency || 'gbp',
    metadata: metadata || {}
  });

  res.status(200).json({
    success: true,
    message: 'Payment intent created successfully',
    data: paymentIntent
  });
});

/**
 * Get payment intent
 * @route GET /api/payments/intent/:id
 * @access Private
 */
export const getPaymentIntent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const paymentIntent = await stripeService.getPaymentIntent(id);

  res.status(200).json({
    success: true,
    data: paymentIntent
  });
});

/**
 * Get customer's saved payment methods
 * @route GET /api/payments/methods
 * @access Private
 */
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const paymentMethods = await stripeService.getCustomerPaymentMethods(userId);

  res.status(200).json({
    success: true,
    data: {
      paymentMethods,
      count: paymentMethods.length
    }
  });
});

/**
 * Detach payment method
 * @route DELETE /api/payments/methods/:id
 * @access Private
 */
export const detachPaymentMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await stripeService.detachPaymentMethod(id);

  res.status(200).json({
    success: true,
    message: 'Payment method removed successfully'
  });
});

/**
 * Create refund
 * @route POST /api/payments/refund
 * @access Private (Admin only)
 */
export const createRefund = asyncHandler(async (req, res) => {
  const { paymentIntentId, amount } = req.body;

  const refund = await stripeService.createRefund(paymentIntentId, amount);

  res.status(200).json({
    success: true,
    message: 'Refund created successfully',
    data: refund
  });
});

/**
 * Handle Stripe webhook
 * @route POST /api/payments/webhook
 * @access Public (but verified by Stripe signature)
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    // Construct and verify webhook event
    const event = stripeService.constructWebhookEvent(payload, signature);
    
    // Handle the event
    await stripeService.handleWebhookEvent(event);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error', { error: error.message });
    res.status(400).json({
      success: false,
      message: 'Webhook error',
      error: error.message
    });
  }
});
