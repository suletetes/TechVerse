import Stripe from 'stripe';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

class StripeService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  /**
   * Get or create Stripe customer for user
   */
  async getOrCreateCustomer(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // If user already has a Stripe customer ID, verify it exists
      if (user.stripeCustomerId) {
        try {
          const customer = await this.stripe.customers.retrieve(user.stripeCustomerId);
          if (!customer.deleted) {
            return user.stripeCustomerId;
          }
        } catch (error) {
          logger.warn('Stripe customer not found, creating new one', { userId, stripeCustomerId: user.stripeCustomerId });
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

      logger.info('Stripe customer created', { userId, customerId: customer.id });
      return customer.id;
    } catch (error) {
      logger.error('Error getting/creating Stripe customer', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent({ userId, amount, currency = 'usd', metadata = {} }) {
    try {
      // Get or create customer
      const customerId = await this.getOrCreateCustomer(userId);

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
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
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        userId
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Error creating payment intent', { error: error.message, userId, amount });
      throw new AppError(error.message || 'Failed to create payment intent', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Error retrieving payment intent', { error: error.message, paymentIntentId });
      throw new AppError('Failed to retrieve payment intent', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Error confirming payment intent', { error: error.message, paymentIntentId });
      throw new AppError('Failed to confirm payment', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(userId) {
    try {
      const customerId = await this.getOrCreateCustomer(userId);
      
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Error getting payment methods', { error: error.message, userId });
      throw new AppError('Failed to retrieve payment methods', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(userId, paymentMethodId) {
    try {
      const customerId = await this.getOrCreateCustomer(userId);
      
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Error attaching payment method', { error: error.message, userId, paymentMethodId });
      throw new AppError('Failed to attach payment method', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      logger.error('Error detaching payment method', { error: error.message, paymentMethodId });
      throw new AppError('Failed to remove payment method', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId, amount = null) {
    try {
      const refundData = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundData);

      logger.info('Refund created', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount / 100
      });

      return refund;
    } catch (error) {
      logger.error('Error creating refund', { error: error.message, paymentIntentId });
      throw new AppError('Failed to create refund', 500, 'STRIPE_ERROR');
    }
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', { error: error.message });
      throw new AppError('Webhook signature verification failed', 400, 'WEBHOOK_ERROR');
    }
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling webhook event', { error: error.message, eventType: event.type });
      throw error;
    }
  }

  /**
   * Handle successful payment intent
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    logger.info('Payment intent succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });
    // Additional logic can be added here (e.g., send confirmation email)
  }

  /**
   * Handle failed payment intent
   */
  async handlePaymentIntentFailed(paymentIntent) {
    logger.warn('Payment intent failed', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });
    // Additional logic can be added here (e.g., notify user)
  }

  /**
   * Handle charge refunded
   */
  async handleChargeRefunded(charge) {
    logger.info('Charge refunded', {
      chargeId: charge.id,
      amount: charge.amount_refunded / 100,
      currency: charge.currency
    });
    // Additional logic can be added here (e.g., update order status)
  }
}

export default new StripeService();
