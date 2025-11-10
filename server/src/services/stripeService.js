// Stripe Payment Service
// Handles all Stripe payment processing

import Stripe from 'stripe';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not configured - Stripe payments will not work');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia',
      });
      logger.info('Stripe service initialized');
    }
  }

  /**
   * Get or create Stripe customer for user
   * @param {string} userId - User ID
   * @returns {Promise<string>} Stripe customer ID
   */
  async getOrCreateCustomer(userId) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // If user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
      try {
        // Verify the customer still exists in Stripe
        await this.stripe.customers.retrieve(user.stripeCustomerId);
        return user.stripeCustomerId;
      } catch (error) {
        // Customer doesn't exist in Stripe, create a new one
        logger.warn('Stripe customer not found, creating new one', {
          userId,
          oldCustomerId: user.stripeCustomerId
        });
      }
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: userId.toString()
      }
    });

    // Save customer ID to user
    user.stripeCustomerId = customer.id;
    await user.save();

    logger.info('Stripe customer created', {
      userId,
      customerId: customer.id
    });

    return customer.id;
  }

  /**
   * Create payment intent for checkout
   * @param {Object} params - Payment parameters
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent({ userId, amount, currency = 'gbp', metadata = {} }) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    // Get or create Stripe customer
    const customerId = await this.getOrCreateCustomer(userId);

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence/cents
      currency,
      customer: customerId,
      metadata: {
        userId: userId.toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Payment intent created', {
      userId,
      paymentIntentId: paymentIntent.id,
      amount,
      currency
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  }

  /**
   * Retrieve payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  }

  /**
   * Confirm payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent
   */
  async confirmPaymentIntent(paymentIntentId) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
    
    logger.info('Payment intent confirmed', {
      paymentIntentId,
      status: paymentIntent.status
    });

    return paymentIntent;
  }

  /**
   * Get customer's saved payment methods
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Payment methods
   */
  async getCustomerPaymentMethods(userId) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const customerId = await this.getOrCreateCustomer(userId);

    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === paymentMethods.data[0]?.id // First one is default
    }));
  }

  /**
   * Attach payment method to customer
   * @param {string} userId - User ID
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Payment method
   */
  async attachPaymentMethod(userId, paymentMethodId) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const customerId = await this.getOrCreateCustomer(userId);

    const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    logger.info('Payment method attached to customer', {
      userId,
      customerId,
      paymentMethodId
    });

    return paymentMethod;
  }

  /**
   * Detach payment method from customer
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {Promise<Object>} Payment method
   */
  async detachPaymentMethod(paymentMethodId) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

    logger.info('Payment method detached', {
      paymentMethodId
    });

    return paymentMethod;
  }

  /**
   * Create refund
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} amount - Amount to refund (optional, full refund if not specified)
   * @returns {Promise<Object>} Refund
   */
  async createRefund(paymentIntentId, amount = null) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    const refundData = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to pence/cents
    }

    const refund = await this.stripe.refunds.create(refundData);

    logger.info('Refund created', {
      paymentIntentId,
      refundId: refund.id,
      amount: refund.amount / 100
    });

    return refund;
  }

  /**
   * Handle Stripe webhook event
   * @param {Object} event - Stripe event
   * @returns {Promise<void>}
   */
  async handleWebhookEvent(event) {
    logger.info('Stripe webhook received', {
      type: event.type,
      id: event.id
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'customer.created':
        logger.info('Customer created', { customerId: event.data.object.id });
        break;
      
      case 'payment_method.attached':
        logger.info('Payment method attached', { paymentMethodId: event.data.object.id });
        break;
      
      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }
  }

  /**
   * Handle successful payment intent
   * @param {Object} paymentIntent - Payment intent object
   * @returns {Promise<void>}
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    logger.info('Payment succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });

    // You can add order creation logic here
    // For example: create order, send confirmation email, etc.
  }

  /**
   * Handle failed payment intent
   * @param {Object} paymentIntent - Payment intent object
   * @returns {Promise<void>}
   */
  async handlePaymentIntentFailed(paymentIntent) {
    logger.warn('Payment failed', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      lastPaymentError: paymentIntent.last_payment_error
    });

    // You can add failure handling logic here
    // For example: notify user, log for review, etc.
  }

  /**
   * Construct webhook event from request
   * @param {string} payload - Request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Stripe event
   */
  constructWebhookEvent(payload, signature) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500, 'STRIPE_NOT_CONFIGURED');
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError('Stripe webhook secret not configured', 500, 'WEBHOOK_SECRET_NOT_CONFIGURED');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', { error: error.message });
      throw new AppError('Webhook signature verification failed', 400, 'INVALID_SIGNATURE');
    }
  }
}

// Export singleton instance
const stripeService = new StripeService();
export default stripeService;
