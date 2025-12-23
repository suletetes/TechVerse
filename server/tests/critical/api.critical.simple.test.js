/**
 * CRITICAL API TESTS (Simplified)
 * These tests cover core API functionality without requiring database connection
 */

import request from 'supertest';
import app from '../app.js';

// Mock the database models
jest.mock('../../src/models/User.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({
      _id: 'mock-user-id',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'user',
      toObject: () => ({ _id: 'mock-user-id', firstName: 'Test', lastName: 'User', email: 'test@example.com', role: 'user' })
    }),
    find: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../../src/models/Product.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockResolvedValue([
      { _id: 'product1', name: 'Product 1', price: 99.99, status: 'active' },
      { _id: 'product2', name: 'Product 2', price: 149.99, status: 'active' }
    ]),
    findById: jest.fn().mockResolvedValue({
      _id: 'product1',
      name: 'Test Product',
      price: 99.99,
      status: 'active'
    }),
    create: jest.fn().mockResolvedValue({
      _id: 'new-product',
      name: 'New Product',
      price: 199.99,
      status: 'active'
    }),
    findByIdAndUpdate: jest.fn().mockResolvedValue({
      _id: 'product1',
      name: 'Updated Product',
      price: 109.99,
      status: 'active'
    }),
    findByIdAndDelete: jest.fn().mockResolvedValue({
      _id: 'product1',
      name: 'Deleted Product'
    })
  }
}));

jest.mock('../../src/models/Cart.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn().mockResolvedValue({
      _id: 'cart-id',
      user: 'mock-user-id',
      items: [
        {
          product: { _id: 'product1', name: 'Test Product', price: 99.99 },
          quantity: 2,
          unitPrice: 99.99,
          totalPrice: 199.98
        }
      ],
      save: jest.fn().mockResolvedValue({})
    }),
    create: jest.fn()
  }
}));

jest.mock('../../src/models/Order.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockResolvedValue([
      {
        _id: 'order1',
        user: 'mock-user-id',
        status: 'pending',
        summary: { total: 199.98 }
      }
    ]),
    create: jest.fn().mockResolvedValue({
      _id: 'new-order',
      user: 'mock-user-id',
      status: 'pending',
      summary: { total: 199.98 }
    })
  }
}));

describe('CRITICAL: API Functionality (Simplified)', () => {
  let userToken, adminToken;

  beforeAll(() => {
    const jwt = require('jsonwebtoken');
    
    userToken = jwt.sign(
      { userId: 'mock-user-id', email: 'user@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: 'admin-id', email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product API', () => {
    test('should get all products (public access)', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    test('should allow admin to create products', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 199.99,
        category: 'electronics'
      };

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toBeDefined();
    });

    test('should prevent non-admin from creating products', async () => {
      const productData = {
        name: 'New Product',
        description: 'Product description',
        price: 199.99,
        category: 'electronics'
      };

      await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);
    });

    test('should validate product creation data', async () => {
      const invalidData = [
        {}, // Empty object
        { name: 'Product' }, // Missing required fields
        { name: 'Product', price: -10 }, // Invalid price
        { name: 'Product', price: 'invalid' } // Non-numeric price
      ];

      for (const data of invalidData) {
        await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(data)
          .expect(400);
      }
    });

    test('should allow admin to update products', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 109.99
      };

      const response = await request(app)
        .put('/api/admin/products/product1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toBeDefined();
    });

    test('should allow admin to delete products', async () => {
      const response = await request(app)
        .delete('/api/admin/products/product1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Cart API', () => {
    test('should get user cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
    });

    test('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/add/product1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 2 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item added to cart');
    });

    test('should require authentication for cart operations', async () => {
      await request(app)
        .get('/api/cart')
        .expect(401);

      await request(app)
        .post('/api/cart/add/product1')
        .send({ quantity: 1 })
        .expect(401);
    });

    test('should clear cart', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully');
    });
  });

  describe('Order API', () => {
    test('should get user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toBeDefined();
      expect(Array.isArray(response.body.data.orders)).toBe(true);
    });

    test('should create order with valid data', async () => {
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
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
    });

    test('should validate order creation data', async () => {
      const invalidData = [
        {}, // Empty object
        { shippingAddress: {} }, // Invalid address
        { shippingAddress: { street: '123 Test St' } } // Incomplete address
      ];

      for (const data of invalidData) {
        await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(data)
          .expect(400);
      }
    });

    test('should require authentication for order operations', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401);

      await request(app)
        .post('/api/orders')
        .send({})
        .expect(401);
    });
  });

  describe('Admin API', () => {
    test('should allow admin access to dashboard', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should allow admin to view all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
    });

    test('should prevent non-admin access to admin endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/dashboard',
        '/api/admin/users',
        '/api/admin/products'
      ];

      for (const endpoint of adminEndpoints) {
        await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      }
    });

    test('should require authentication for admin endpoints', async () => {
      const adminEndpoints = [
        '/api/admin/dashboard',
        '/api/admin/users',
        '/api/admin/products'
      ];

      for (const endpoint of adminEndpoints) {
        await request(app)
          .get(endpoint)
          .expect(401);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/non-existent-route')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid-json');

      expect([400, 500]).toContain(response.status);
    });

    test('should return proper error format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });
});