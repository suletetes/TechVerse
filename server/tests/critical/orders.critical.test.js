/**
 * CRITICAL ORDER TESTS
 * These tests cover order processing, payment integration, and business logic
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import Order from '../../src/models/Order.js';
import Cart from '../../src/models/Cart.js';
import { setupTestDb, teardownTestDb, clearDatabase } from '../setup/testDb.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';

describe('CRITICAL: Order Processing', () => {
  let authUser, authToken, testProduct, testCart;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
    
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

  describe('Order Creation', () => {
    test('should create order from cart successfully', async () => {
      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_123'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();

      const order = await Order.findById(response.body.data.order._id);
      expect(order.user.toString()).toBe(authUser._id.toString());
      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(2);
      expect(order.status).toBe('pending');
    });

    test('should calculate order totals correctly', async () => {
      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_123'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const order = response.body.data.order;
      const expectedSubtotal = testProduct.price * 2;
      const expectedTax = expectedSubtotal * 0.08; // Assuming 8% tax
      const expectedTotal = expectedSubtotal + expectedTax;

      expect(order.summary.subtotal).toBe(expectedSubtotal);
      expect(order.summary.tax).toBeCloseTo(expectedTax, 2);
      expect(order.summary.total).toBeCloseTo(expectedTotal, 2);
    });

    test('should reduce product stock after order creation', async () => {
      const initialStock = testProduct.stock.quantity;

      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_123'
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stock.quantity).toBe(initialStock - 2);
    });

    test('should clear cart after successful order', async () => {
      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_123'
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const cart = await Cart.findOne({ user: authUser._id });
      expect(cart.items).toHaveLength(0);
    });

    test('should prevent order creation with insufficient stock', async () => {
      // Update product to have less stock than cart quantity
      await Product.findByIdAndUpdate(testProduct._id, {
        'stock.quantity': 1
      });

      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        },
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_123'
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);
    });

    test('should require valid shipping address', async () => {
      const invalidOrderData = {
        shippingAddress: {
          street: '', // Missing required field
          city: 'Test City'
        },
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_123'
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrderData)
        .expect(400);
    });
  });

  describe('Order Status Management', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: authUser._id,
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
        status: 'pending',
        paymentStatus: 'pending'
      });
    });

    test('should update order status (admin only)', async () => {
      // Create admin user
      const adminAuth = await createAuthenticatedUser({ role: 'admin' });

      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body.data.order.status).toBe('processing');
    });

    test('should prevent non-admin from updating order status', async () => {
      await request(app)
        .put(`/api/admin/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'processing' })
        .expect(403);
    });

    test('should track order status history', async () => {
      const adminAuth = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .put(`/api/admin/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminAuth.token}`)
        .send({ status: 'processing' });

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.statusHistory).toHaveLength(2); // pending + processing
      expect(updatedOrder.statusHistory[1].status).toBe('processing');
      expect(updatedOrder.statusHistory[1].updatedBy.toString()).toBe(adminAuth.user._id.toString());
    });
  });

  describe('Order Cancellation', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: authUser._id,
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
        status: 'pending',
        paymentStatus: 'completed'
      });

      // Reduce product stock to simulate order fulfillment
      await Product.findByIdAndUpdate(testProduct._id, {
        $inc: { 'stock.quantity': -2 }
      });
    });

    test('should allow user to cancel their own pending order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.order.status).toBe('cancelled');
    });

    test('should restore stock when order is cancelled', async () => {
      const productBeforeCancel = await Product.findById(testProduct._id);
      const stockBeforeCancel = productBeforeCancel.stock.quantity;

      await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const productAfterCancel = await Product.findById(testProduct._id);
      expect(productAfterCancel.stock.quantity).toBe(stockBeforeCancel + 2);
    });

    test('should prevent cancelling shipped orders', async () => {
      await Order.findByIdAndUpdate(testOrder._id, { status: 'shipped' });

      await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('should prevent users from cancelling other users orders', async () => {
      const otherAuth = await createAuthenticatedUser();

      await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${otherAuth.token}`)
        .expect(404);
    });
  });

  describe('Order Retrieval', () => {
    let userOrder, otherUserOrder;

    beforeEach(async () => {
      userOrder = await Order.create({
        user: authUser._id,
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
        status: 'pending'
      });

      // Create another user's order
      const otherAuth = await createAuthenticatedUser();
      otherUserOrder = await Order.create({
        user: otherAuth.user._id,
        items: [{
          product: testProduct._id,
          quantity: 1,
          unitPrice: testProduct.price,
          totalPrice: testProduct.price
        }],
        shippingAddress: {
          street: '456 Other St',
          city: 'Other City',
          state: 'OS',
          zipCode: '67890',
          country: 'US'
        },
        summary: {
          subtotal: testProduct.price,
          tax: testProduct.price * 0.08,
          total: testProduct.price * 1.08
        },
        status: 'pending'
      });
    });

    test('should return only user own orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0]._id).toBe(userOrder._id.toString());
    });

    test('should return specific order by ID (own order only)', async () => {
      const response = await request(app)
        .get(`/api/orders/${userOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.order._id).toBe(userOrder._id.toString());
    });

    test('should prevent accessing other users orders', async () => {
      await request(app)
        .get(`/api/orders/${otherUserOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});