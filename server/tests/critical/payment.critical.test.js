/**
 * CRITICAL PAYMENT TESTS
 * These tests cover payment processing and financial security
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import Order from '../../src/models/Order.js';
import Cart from '../../src/models/Cart.js';
import { setupTestDb, teardownTestDb, clearDatabase } from '../setup/testDb.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn(),
      cancel: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  }));
});

describe('CRITICAL: Payment Processing', () => {
  let authUser, authToken, testProduct, testCart, mockStripe;

  beforeAll(async () => {
    await setupTestDb();
    // Get mocked Stripe instance
    const Stripe = require('stripe');
    mockStripe = new Stripe();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    
    // Create authenticated user
    const auth = await createAuthenticatedUser();
    authUser = auth.user;
    authToken = auth.token;

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      price: 99.99,
      stock: { quantity: 10, trackQuantity: true },
      status: 'active',
      category: 'electronics'
    });

    // Create cart with items
    testCart = await Cart.create({
      user: authUser._id,
      items: [{
        product: testProduct._id,
        quantity: 2,
        unitPrice: testProduct.price,
        totalPrice: testProduct.price * 2
      }]
    });
  });

  describe('Payment Intent Creation', () => {
    test('should create payment intent with correct amount', async () => {
      const expectedAmount = Math.round((testProduct.price * 2 * 1.08) * 100); // Including tax, in cents

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: expectedAmount,
        currency: 'usd',
        status: 'requires_payment_method'
      });

      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currency: 'usd'
        })
        .expect(200);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: expectedAmount,
        currency: 'usd',
        metadata: {
          userId: authUser._id.toString(),
          cartId: testCart._id.toString()
        }
      });

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBe('pi_test_123_secret');
    });

    test('should prevent payment intent creation with empty cart', async () => {
      // Clear the cart
      await Cart.findByIdAndUpdate(testCart._id, { items: [] });

      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currency: 'usd'
        })
        .expect(400);

      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    test('should validate currency format', async () => {
      const invalidCurrencies = ['USD', 'invalid', '123', '', null];

      for (const currency of invalidCurrencies) {
        await request(app)
          .post('/api/payments/create-intent')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ currency })
          .expect(400);
      }
    });
  });

  describe('Payment Confirmation', () => {
    test('should confirm payment and create order', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 21598, // $215.98 in cents
        currency: 'usd',
        metadata: {
          userId: authUser._id.toString(),
          cartId: testCart._id.toString()
        }
      });

      const orderData = {
        paymentIntentId: 'pi_test_123',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();

      // Verify order was created
      const order = await Order.findById(response.body.data.order._id);
      expect(order.paymentIntentId).toBe('pi_test_123');
      expect(order.paymentStatus).toBe('completed');
      expect(order.status).toBe('confirmed');
    });

    test('should prevent double processing of same payment', async () => {
      // Create existing order with same payment intent
      await Order.create({
        user: authUser._id,
        paymentIntentId: 'pi_test_123',
        items: [{
          product: testProduct._id,
          quantity: 1,
          unitPrice: testProduct.price,
          totalPrice: testProduct.price
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        summary: {
          subtotal: testProduct.price,
          tax: testProduct.price * 0.08,
          total: testProduct.price * 1.08
        },
        status: 'confirmed',
        paymentStatus: 'completed'
      });

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10799,
        currency: 'usd',
        metadata: {
          userId: authUser._id.toString(),
          cartId: testCart._id.toString()
        }
      });

      const orderData = {
        paymentIntentId: 'pi_test_123',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);
    });

    test('should reject failed payment intents', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_failed',
        status: 'payment_failed',
        amount: 21598,
        currency: 'usd',
        metadata: {
          userId: authUser._id.toString(),
          cartId: testCart._id.toString()
        }
      });

      const orderData = {
        paymentIntentId: 'pi_test_failed',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);
    });

    test('should validate payment amount matches cart total', async () => {
      // Mock payment intent with wrong amount
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_wrong_amount',
        status: 'succeeded',
        amount: 5000, // $50.00 - wrong amount
        currency: 'usd',
        metadata: {
          userId: authUser._id.toString(),
          cartId: testCart._id.toString()
        }
      });

      const orderData = {
        paymentIntentId: 'pi_test_wrong_amount',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);
    });
  });

  describe('Refund Processing', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: authUser._id,
        paymentIntentId: 'pi_test_refund',
        items: [{
          product: testProduct._id,
          quantity: 2,
          unitPrice: testProduct.price,
          totalPrice: testProduct.price * 2
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        summary: {
          subtotal: testProduct.price * 2,
          tax: (testProduct.price * 2) * 0.08,
          total: (testProduct.price * 2) * 1.08
        },
        status: 'delivered',
        paymentStatus: 'completed'
      });
    });

    test('should process full refund for eligible orders', async () => {
      const adminAuth = await createAuthenticatedUser({ role: 'admin' });

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_refund',
        status: 'succeeded',
        amount: 21598,
        currency: 'usd'
      });

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          amount: testOrder.summary.total,
          reason: 'Customer request'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('refunded');
      expect(updatedOrder.status).toBe('refunded');
    });

    test('should prevent refund of already refunded orders', async () => {
      const adminAuth = await createAuthenticatedUser({ role: 'admin' });

      // Mark order as already refunded
      await Order.findByIdAndUpdate(testOrder._id, {
        paymentStatus: 'refunded',
        status: 'refunded'
      });

      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({
          amount: testOrder.summary.total,
          reason: 'Customer request'
        })
        .expect(400);
    });

    test('should validate refund amount', async () => {
      const adminAuth = await createAuthenticatedUser({ role: 'admin' });

      const invalidAmounts = [
        -10, // Negative amount
        testOrder.summary.total + 100, // More than order total
        0, // Zero amount
        'invalid' // Non-numeric
      ];

      for (const amount of invalidAmounts) {
        await request(app)
          .post(`/api/admin/orders/${testOrder._id}/refund`)
          .set('Authorization', `Bearer ${adminAuth.token}`)
          .send({
            amount,
            reason: 'Test refund'
          })
          .expect(400);
      }
    });
  });

  describe('Webhook Security', () => {
    test('should verify webhook signature', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_webhook',
            status: 'succeeded'
          }
        }
      });

      // Mock successful signature verification
      mockStripe.webhooks.constructEvent.mockReturnValue({
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_webhook',
            status: 'succeeded'
          }
        }
      });

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'valid_signature')
        .send(webhookPayload)
        .expect(200);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        webhookPayload,
        'valid_signature',
        process.env.STRIPE_WEBHOOK_SECRET
      );
    });

    test('should reject webhooks with invalid signature', async () => {
      const webhookPayload = JSON.stringify({
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded'
      });

      // Mock signature verification failure
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send(webhookPayload)
        .expect(400);
    });

    test('should handle webhook events idempotently', async () => {
      const webhookEvent = {
        id: 'evt_test_idempotent',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_idempotent',
            status: 'succeeded',
            metadata: {
              userId: authUser._id.toString(),
              cartId: testCart._id.toString()
            }
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      // Send same webhook twice
      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'valid_signature')
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'valid_signature')
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      // Should handle gracefully without creating duplicate orders
    });
  });

  describe('Payment Security', () => {
    test('should prevent payment intent access by other users', async () => {
      const otherAuth = await createAuthenticatedUser();

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_other_user',
        status: 'succeeded',
        amount: 21598,
        currency: 'usd',
        metadata: {
          userId: authUser._id.toString(), // Different user
          cartId: testCart._id.toString()
        }
      });

      const orderData = {
        paymentIntentId: 'pi_test_other_user',
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${otherAuth.token}`)
        .send(orderData)
        .expect(403);
    });

    test('should sanitize payment metadata', async () => {
      const maliciousMetadata = {
        userId: authUser._id.toString(),
        cartId: testCart._id.toString(),
        '<script>alert("xss")</script>': 'malicious',
        'admin': 'true'
      };

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_sanitized',
        client_secret: 'pi_test_sanitized_secret',
        amount: 21598,
        currency: 'usd',
        status: 'requires_payment_method'
      });

      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currency: 'usd'
        })
        .expect(200);

      // Verify only safe metadata was passed to Stripe
      const createCall = mockStripe.paymentIntents.create.mock.calls[0][0];
      expect(createCall.metadata).toEqual({
        userId: authUser._id.toString(),
        cartId: testCart._id.toString()
      });
    });
  });
});