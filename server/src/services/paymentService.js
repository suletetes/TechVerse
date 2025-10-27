// Optional Stripe import - will be loaded dynamically if available
let Stripe = null;
import logger from '../utils/logger.js';

class PaymentService {
  constructor() {
    this.stripe = null;
    this.isConfigured = false;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // Initialize asynchronously
    this.initializeStripe().catch(error => {
      logger.error('Failed to initialize payment service', error);
    });
  }

  // Initialize Stripe
  async initializeStripe() {
    try {
      // Try to load Stripe dynamically
      if (!Stripe) {
        try {
          const stripeModule = await import('stripe');
          Stripe = stripeModule.default;
        } catch (importError) {
          logger.warn('Stripe package not available. Payment service will be disabled.', {
            error: importError.message
          });
          return;
        }
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        logger.warn('Stripe configuration missing. Payment service will be disabled.');
        return;
      }

      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: false
      });

      this.isConfigured = true;
      logger.info('Payment service (Stripe) configured successfully');

    } catch (error) {
      logger.error('Failed to initialize Stripe', error);
      this.isConfigured = false;
    }
  }

  // Check if service is configured
  checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Payment service not configured');
    }
  }

  // Create payment intent
  async createPaymentIntent(amount, currency = 'gbp', metadata = {}) {
    this.checkConfiguration();

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in smallest currency unit (pence for GBP)
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          ...metadata,
          created_at: new Date().toISOString()
        }
      });

      logger.info('Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        metadata
      });

      return paymentIntent;

    } catch (error) {
      logger.error('Failed to create payment intent', {
        amount,
        currency,
        metadata,
        error: error.message
      });
      throw error;
    }
  }

  // Retrieve payment intent
  async getPaymentIntent(paymentIntentId) {
    this.checkConfiguration();

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Failed to retrieve payment intent', {
        paymentIntentId,
        error: error.message
      });
      throw error;
    }
  }

  // Confirm payment intent
  async confirmPayment(paymentIntentId, paymentMethodId = null) {
    this.checkConfiguration();

    try {
      const confirmParams = {};
      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        confirmParams
      );

      logger.info('Payment confirmed', {
        paymentIntentId,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      });

      return paymentIntent;

    } catch (error) {
      logger.error('Failed to confirm payment', {
        paymentIntentId,
        error: error.message
      });
      throw error;
    }
  }

  // Cancel payment intent
  async cancelPayment(paymentIntentId, reason = 'requested_by_customer') {
    this.checkConfiguration();

    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: reason
      });

      logger.info('Payment cancelled', {
        paymentIntentId,
        reason
      });

      return paymentIntent;

    } catch (error) {
      logger.error('Failed to cancel payment', {
        paymentIntentId,
        error: error.message
      });
      throw error;
    }
  }

  // Process refund
  async refundPayment(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    this.checkConfiguration();

    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        reason
      };

      if (amount) {
        refundParams.amount = Math.round(amount);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info('Refund processed', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
        reason
      });

      return refund;

    } catch (error) {
      logger.error('Failed to process refund', {
        paymentIntentId,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  // Create customer
  async createCustomer(user) {
    this.checkConfiguration();

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString(),
          created_at: new Date().toISOString()
        }
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId: user._id,
        email: user.email
      });

      return customer;

    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        userId: user._id,
        email: user.email,
        error: error.message
      });
      throw error;
    }
  }

  // Get customer
  async getCustomer(customerId) {
    this.checkConfiguration();

    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      logger.error('Failed to retrieve customer', {
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  // Update customer
  async updateCustomer(customerId, updateData) {
    this.checkConfiguration();

    try {
      const customer = await this.stripe.customers.update(customerId, updateData);

      logger.info('Customer updated', {
        customerId,
        updateData
      });

      return customer;

    } catch (error) {
      logger.error('Failed to update customer', {
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  // Add payment method to customer
  async addPaymentMethod(customerId, paymentMethodId) {
    this.checkConfiguration();

    try {
      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      logger.info('Payment method attached to customer', {
        customerId,
        paymentMethodId
      });

      return await this.getPaymentMethod(paymentMethodId);

    } catch (error) {
      logger.error('Failed to attach payment method', {
        customerId,
        paymentMethodId,
        error: error.message
      });
      throw error;
    }
  }

  // Get payment method
  async getPaymentMethod(paymentMethodId) {
    this.checkConfiguration();

    try {
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      return paymentMethod;
    } catch (error) {
      logger.error('Failed to retrieve payment method', {
        paymentMethodId,
        error: error.message
      });
      throw error;
    }
  }

  // List customer payment methods
  async listCustomerPaymentMethods(customerId, type = 'card') {
    this.checkConfiguration();

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type
      });

      return paymentMethods.data;

    } catch (error) {
      logger.error('Failed to list customer payment methods', {
        customerId,
        type,
        error: error.message
      });
      throw error;
    }
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId) {
    this.checkConfiguration();

    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Payment method removed', {
        paymentMethodId
      });

      return paymentMethod;

    } catch (error) {
      logger.error('Failed to remove payment method', {
        paymentMethodId,
        error: error.message
      });
      throw error;
    }
  }

  // Create setup intent (for saving payment methods without immediate charge)
  async createSetupIntent(customerId, paymentMethodTypes = ['card']) {
    this.checkConfiguration();

    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        usage: 'off_session'
      });

      logger.info('Setup intent created', {
        setupIntentId: setupIntent.id,
        customerId
      });

      return setupIntent;

    } catch (error) {
      logger.error('Failed to create setup intent', {
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  // Process webhook
  async processWebhook(signature, payload) {
    this.checkConfiguration();

    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info('Webhook received', {
        eventType: event.type,
        eventId: event.id
      });

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          logger.info('Unhandled webhook event type', { eventType: event.type });
      }

      return { received: true, eventType: event.type };

    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        signature
      });
      throw error;
    }
  }

  // Webhook event handlers
  async handlePaymentSucceeded(paymentIntent) {
    logger.info('Payment succeeded webhook', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    });

    // TODO: Update order status, send confirmation email, etc.
    // This would typically involve updating the order in the database
  }

  async handlePaymentFailed(paymentIntent) {
    logger.warn('Payment failed webhook', {
      paymentIntentId: paymentIntent.id,
      lastPaymentError: paymentIntent.last_payment_error
    });

    // TODO: Handle failed payment, notify customer, etc.
  }

  async handleSubscriptionCreated(subscription) {
    logger.info('Subscription created webhook', {
      subscriptionId: subscription.id,
      customerId: subscription.customer
    });

    // TODO: Handle subscription creation
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info('Subscription updated webhook', {
      subscriptionId: subscription.id,
      status: subscription.status
    });

    // TODO: Handle subscription updates
  }

  async handleInvoicePaymentSucceeded(invoice) {
    logger.info('Invoice payment succeeded webhook', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription
    });

    // TODO: Handle successful invoice payment
  }

  async handleInvoicePaymentFailed(invoice) {
    logger.warn('Invoice payment failed webhook', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription
    });

    // TODO: Handle failed invoice payment
  }

  // Utility methods
  formatAmount(amount, currency = 'gbp') {
    // Convert from smallest currency unit to major unit
    const divisor = this.getCurrencyDivisor(currency);
    return amount / divisor;
  }

  formatAmountForStripe(amount, currency = 'gbp') {
    // Convert from major unit to smallest currency unit
    const divisor = this.getCurrencyDivisor(currency);
    return Math.round(amount * divisor);
  }

  getCurrencyDivisor(currency) {
    // Most currencies use 100 (cents), but some use different divisors
    const divisors = {
      'jpy': 1,    // Japanese Yen
      'krw': 1,    // Korean Won
      'vnd': 1,    // Vietnamese Dong
      'clp': 1,    // Chilean Peso
      'bif': 1,    // Burundian Franc
      'djf': 1,    // Djiboutian Franc
      'gnf': 1,    // Guinean Franc
      'kmf': 1,    // Comorian Franc
      'mga': 1,    // Malagasy Ariary
      'pyg': 1,    // Paraguayan Guaraní
      'rwf': 1,    // Rwandan Franc
      'ugx': 1,    // Ugandan Shilling
      'vuv': 1,    // Vanuatu Vatu
      'xaf': 1,    // Central African CFA Franc
      'xof': 1,    // West African CFA Franc
      'xpf': 1     // CFP Franc
    };

    return divisors[currency.toLowerCase()] || 100;
  }

  // Get supported payment methods for a country
  getSupportedPaymentMethods(country = 'GB') {
    const paymentMethods = {
      'GB': ['card', 'bacs_debit', 'bancontact'],
      'US': ['card', 'us_bank_account'],
      'DE': ['card', 'sepa_debit', 'giropay', 'sofort'],
      'FR': ['card', 'sepa_debit'],
      'IT': ['card', 'sepa_debit'],
      'ES': ['card', 'sepa_debit'],
      'NL': ['card', 'sepa_debit', 'ideal'],
      'BE': ['card', 'sepa_debit', 'bancontact'],
      'AT': ['card', 'sepa_debit', 'eps'],
      'CH': ['card'],
      'CA': ['card'],
      'AU': ['card', 'au_becs_debit'],
      'JP': ['card'],
      'SG': ['card', 'grabpay'],
      'MY': ['card', 'fpx'],
      'TH': ['card', 'promptpay'],
      'IN': ['card', 'upi'],
      'BR': ['card', 'boleto'],
      'MX': ['card', 'oxxo']
    };

    return paymentMethods[country.toUpperCase()] || ['card'];
  }
}

export default new PaymentService();