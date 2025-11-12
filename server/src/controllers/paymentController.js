import stripeService from '../services/stripeService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * @desc    Create payment intent
 * @route   POST /api/payments/create-intent
 * @access  Private
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'usd', metadata = {} } = req.body;
  const userId = req.user._id;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid amount'
    });
  }

  const result = await stripeService.createPaymentIntent({
    userId,
    amount,
    currency,
    metadata
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Get payment intent
 * @route   GET /api/payments/intent/:id
 * @access  Private
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
 * @desc    Get customer payment methods
 * @route   GET /api/payments/methods
 * @access  Private
 */
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const paymentMethods = await stripeService.getCustomerPaymentMethods(userId);

  res.status(200).json({
    success: true,
    data: paymentMethods
  });
});

/**
 * @desc    Detach payment method
 * @route   DELETE /api/payments/methods/:id
 * @access  Private
 */
export const detachPaymentMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const paymentMethod = await stripeService.detachPaymentMethod(id);

  res.status(200).json({
    success: true,
    message: 'Payment method removed successfully',
    data: paymentMethod
  });
});

/**
 * @desc    Create refund
 * @route   POST /api/payments/refund
 * @access  Private/Admin
 */
export const createRefund = asyncHandler(async (req, res) => {
  const { paymentIntentId, amount } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({
      success: false,
      message: 'Payment intent ID is required'
    });
  }

  const refund = await stripeService.createRefund(paymentIntentId, amount);

  res.status(200).json({
    success: true,
    message: 'Refund created successfully',
    data: refund
  });
});

/**
 * @desc    Handle Stripe webhook
 * @route   POST /api/payments/webhook
 * @access  Public (but verified by Stripe signature)
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  try {
    const event = stripeService.constructWebhookEvent(payload, signature);
    await stripeService.handleWebhookEvent(event);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error', { error: error.message });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
