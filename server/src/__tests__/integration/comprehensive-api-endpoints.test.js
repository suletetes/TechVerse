import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../server.js';
import { User, Product, Category, Order, Review } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Comprehensive API Endpoint Testing', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;
  let testCategory;
  let testProduct;
  let testOrder;

  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_EXPIRE = '1h';

    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});

    // Create test users
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: await bcrypt.hash('Password123', 12),
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      isActive: true
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('Password123', 12),
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active',
      isActive: true
    });

    // Generate auth tokens
    authToken = jwt.sign(
      {
        id: testUser._id,
        email: testUser.email,
        role: testUser.role,
        isEmailVerified: testUser.isEmailVerified,
        accountStatus: testUser.accountStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
        isEmailVerified: adminUser.isEmailVerified,
        accountStatus: adminUser.accountStatus
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      createdBy: adminUser._id,
      isActive: true
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'This is a test product',
      price: 999,
      comparePrice: 1199,
      category: testCategory._id,
      brand: 'TestBrand',
      images: [{
        url: '/test-image.jpg',
        alt: 'Test Product Image'
      }],
      stock: {
        quantity: 50,
        trackQuantity: true
      },
      sections: ['latest'],
      status: 'active',
      visibility: 'public',
      createdBy: adminUser._id
    });

    // Create test order
    testOrder = await Order.create({
      user: testUser._id,
      items: [{
        product: testProduct._id,
        quantity: 2,
        price: testProduct.price
      }],
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address: '123 Test St',
        city: 'Test City',
        postcode: 'SW1A 1AA',
        country: 'UK'
      },
      paymentMethod: 'card',
      status: 'pending',
      totals: {
        subtotal: 1998,
        tax: 399.60,
        shipping: 0,
        total: 2397.60
      }
    });
  });  de
scribe('Authentication Endpoints (12 endpoints)', () => {
    it('POST /api/auth/register - User registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    it('POST /api/auth/login - User login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('POST /api/auth/logout - User logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('logged out');
    });

    it('POST /api/auth/refresh-token - Token refresh', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'mock-refresh-token' })
        .expect(400); // Expected to fail without valid refresh token

      expect(response.body.success).toBe(false);
    });

    it('POST /api/auth/forgot-password - Password reset request', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');
    });

    it('POST /api/auth/reset-password - Password reset', async () => {
      // First request password reset to get token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      const user = await User.findById(testUser._id);
      const resetToken = user.passwordResetToken;

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/auth/verify-email/:token - Email verification', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email/invalid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('POST /api/auth/resend-verification - Resend verification email', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/auth/me - Get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('GET /api/auth/profile - Get user profile', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('PUT /api/auth/profile - Update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
    });

    it('POST /api/auth/change-password - Change password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });  descr
ibe('Product Endpoints (17 endpoints)', () => {
    it('GET /api/products - Get all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('GET /api/products/search - Search products', async () => {
      const response = await request(app)
        .get('/api/products/search?q=Test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    it('GET /api/products/categories - Get categories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(1);
    });

    it('GET /api/products/featured - Get featured products', async () => {
      const response = await request(app)
        .get('/api/products/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('GET /api/products/top-sellers - Get top selling products', async () => {
      const response = await request(app)
        .get('/api/products/top-sellers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('GET /api/products/latest - Get latest products', async () => {
      const response = await request(app)
        .get('/api/products/latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('GET /api/products/on-sale - Get products on sale', async () => {
      const response = await request(app)
        .get('/api/products/on-sale')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('GET /api/products/weekly-deals - Get weekly deals', async () => {
      const response = await request(app)
        .get('/api/products/weekly-deals')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('GET /api/products/quick-picks - Get quick picks', async () => {
      const response = await request(app)
        .get('/api/products/quick-picks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('GET /api/products/section/:section - Get products by section', async () => {
      const response = await request(app)
        .get('/api/products/section/latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    it('GET /api/products/category/:categoryId - Get products by category', async () => {
      const response = await request(app)
        .get(`/api/products/category/${testCategory._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    it('GET /api/products/:id - Get product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Test Product');
    });

    it('GET /api/products/:id/reviews - Get product reviews', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}/reviews`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toBeDefined();
    });

    it('POST /api/products/:id/reviews - Add product review', async () => {
      const response = await request(app)
        .post(`/api/products/${testProduct._id}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Great product!',
          comment: 'Really satisfied with this purchase.'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.rating).toBe(5);
    });

    it('POST /api/products - Create product (admin)', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          description: 'A new test product',
          price: 599,
          category: testCategory._id,
          brand: 'NewBrand'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('New Product');
    });

    it('PUT /api/products/:id - Update product (admin)', async () => {
      const response = await request(app)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          price: 1099
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Updated Product');
    });

    it('DELETE /api/products/:id - Delete product (admin)', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });  d
escribe('Order Endpoints (8 endpoints)', () => {
    it('POST /api/orders - Create order', async () => {
      const orderData = {
        items: [{
          product: testProduct._id,
          quantity: 1
        }],
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address: '123 Test St',
          city: 'Test City',
          postcode: 'SW1A 1AA'
        },
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('pending');
    });

    it('GET /api/orders/user - Get user orders', async () => {
      const response = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('GET /api/orders/:id - Get order by ID', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order._id).toBe(testOrder._id.toString());
    });

    it('PUT /api/orders/:id/cancel - Cancel order', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/orders/:id/tracking - Get order tracking', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder._id}/tracking`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tracking).toBeDefined();
    });

    it('POST /api/orders/:id/payment - Process payment', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrder._id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 2397.60 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('PUT /api/orders/:id/status - Update order status (admin)', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('processing');
    });

    it('POST /api/orders/:id/refund - Refund order (admin)', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 100,
          reason: 'Customer request'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  }); 
 describe('User Management Endpoints (16 endpoints)', () => {
    it('GET /api/users/profile - Get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('PUT /api/users/profile - Update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          phone: '+1234567890'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
    });

    it('POST /api/users/addresses - Add address', async () => {
      const response = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: '123 Main St',
          city: 'Test City',
          postcode: 'SW1A 1AA',
          type: 'home'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address.type).toBe('home');
    });

    it('PUT /api/users/addresses/:id - Update address', async () => {
      // First create an address
      const createResponse = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: '123 Main St',
          city: 'Test City',
          postcode: 'SW1A 1AA',
          type: 'home'
        });

      const addressId = createResponse.body.data.address._id;

      const response = await request(app)
        .put(`/api/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          address: '456 Updated St',
          city: 'Updated City',
          postcode: 'SW1A 1BB',
          type: 'work'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address.type).toBe('work');
    });

    it('DELETE /api/users/addresses/:id - Delete address', async () => {
      // First create an address
      const createResponse = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          address: '123 Main St',
          city: 'Test City',
          postcode: 'SW1A 1AA',
          type: 'home'
        });

      const addressId = createResponse.body.data.address._id;

      const response = await request(app)
        .delete(`/api/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('POST /api/users/payment-methods - Add payment method', async () => {
      const response = await request(app)
        .post('/api/users/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'card',
          cardNumber: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          cardholderName: 'Test User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod.type).toBe('card');
    });

    it('PUT /api/users/payment-methods/:id - Update payment method', async () => {
      // First create a payment method
      const createResponse = await request(app)
        .post('/api/users/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'card',
          cardNumber: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          cardholderName: 'Test User'
        });

      const paymentMethodId = createResponse.body.data.paymentMethod._id;

      const response = await request(app)
        .put(`/api/users/payment-methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'card',
          cardNumber: '4222222222222222',
          expiryMonth: 6,
          expiryYear: 2026,
          cvv: '456',
          cardholderName: 'Updated User'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethod.cardholderName).toBe('Updated User');
    });

    it('DELETE /api/users/payment-methods/:id - Delete payment method', async () => {
      // First create a payment method
      const createResponse = await request(app)
        .post('/api/users/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'card',
          cardNumber: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          cardholderName: 'Test User'
        });

      const paymentMethodId = createResponse.body.data.paymentMethod._id;

      const response = await request(app)
        .delete(`/api/users/payment-methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/users/wishlist - Get wishlist', async () => {
      const response = await request(app)
        .get('/api/users/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.wishlist).toBeDefined();
    });

    it('POST /api/users/wishlist/:productId - Add to wishlist', async () => {
      const response = await request(app)
        .post(`/api/users/wishlist/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/users/wishlist/:productId - Remove from wishlist', async () => {
      // First add to wishlist
      await request(app)
        .post(`/api/users/wishlist/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .delete(`/api/users/wishlist/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/users/cart - Get cart', async () => {
      const response = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
    });

    it('POST /api/users/cart - Add to cart', async () => {
      const response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('PUT /api/users/cart/:itemId - Update cart item', async () => {
      // First add to cart
      const addResponse = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 1
        });

      const itemId = addResponse.body.data.cart.items[0]._id;

      const response = await request(app)
        .put(`/api/users/cart/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/users/cart/:itemId - Remove from cart', async () => {
      // First add to cart
      const addResponse = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 1
        });

      const itemId = addResponse.body.data.cart.items[0]._id;

      const response = await request(app)
        .delete(`/api/users/cart/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/users/cart - Clear cart', async () => {
      const response = await request(app)
        .delete('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });  de
scribe('Admin Endpoints (21 endpoints)', () => {
    it('GET /api/admin/dashboard - Get dashboard stats', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
    });

    it('GET /api/admin/analytics - Get analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
    });

    it('GET /api/admin/users - Get all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
    });

    it('GET /api/admin/users/:id - Get user by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('PUT /api/admin/users/:id/status - Update user status', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/admin/users/:id - Delete user', async () => {
      // Create a new user to delete
      const newUser = await User.create({
        firstName: 'Delete',
        lastName: 'Me',
        email: 'delete@example.com',
        password: await bcrypt.hash('Password123', 12),
        role: 'user'
      });

      const response = await request(app)
        .delete(`/api/admin/users/${newUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/admin/orders - Get all orders', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('GET /api/admin/orders/stats - Get order stats', async () => {
      const response = await request(app)
        .get('/api/admin/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
    });

    it('GET /api/admin/categories - Get all categories', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(1);
    });

    it('POST /api/admin/categories - Create category', async () => {
      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          description: 'A new test category'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('New Category');
    });

    it('PUT /api/admin/categories/:id - Update category', async () => {
      const response = await request(app)
        .put(`/api/admin/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Updated Category');
    });

    it('DELETE /api/admin/categories/:id - Delete category', async () => {
      // Create a new category to delete
      const newCategory = await Category.create({
        name: 'Delete Me',
        slug: 'delete-me',
        description: 'Category to delete',
        createdBy: adminUser._id
      });

      const response = await request(app)
        .delete(`/api/admin/categories/${newCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/admin/sections - Get section overview', async () => {
      const response = await request(app)
        .get('/api/admin/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sections).toBeDefined();
    });

    it('POST /api/admin/sections/:section - Set products in section', async () => {
      const response = await request(app)
        .post('/api/admin/sections/topSeller')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productIds: [testProduct._id] })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/admin/sections/:section - Get products in section', async () => {
      const response = await request(app)
        .get('/api/admin/sections/latest')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
    });

    it('DELETE /api/admin/sections/:section - Clear section', async () => {
      const response = await request(app)
        .delete('/api/admin/sections/latest')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('POST /api/admin/sections/:section/products/:productId - Add product to section', async () => {
      const response = await request(app)
        .post(`/api/admin/sections/featured/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/admin/sections/:section/products/:productId - Remove product from section', async () => {
      const response = await request(app)
        .delete(`/api/admin/sections/latest/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /api/admin/products/available - Get available products', async () => {
      const response = await request(app)
        .get('/api/admin/products/available')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });

    it('PUT /api/admin/products/sections - Bulk update product sections', async () => {
      const response = await request(app)
        .put('/api/admin/products/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          updates: [{
            productId: testProduct._id,
            sections: ['featured', 'topSeller']
          }]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });  d
escribe('Upload Endpoints (5 endpoints)', () => {
    it('GET /api/upload/test - Test image accessibility', async () => {
      const response = await request(app)
        .get('/api/upload/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('accessible');
    });

    it('POST /api/upload/image - Upload single image (admin)', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake image data'), 'test.jpg')
        .expect(400); // Expected to fail without proper multipart setup

      expect(response.body.success).toBe(false);
    });

    it('POST /api/upload/images - Upload multiple images (admin)', async () => {
      const response = await request(app)
        .post('/api/upload/images')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // Expected to fail without proper multipart setup

      expect(response.body.success).toBe(false);
    });

    it('DELETE /api/upload/image - Delete uploaded image (admin)', async () => {
      const response = await request(app)
        .delete('/api/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ filename: 'test.jpg' })
        .expect(404); // Expected to fail as file doesn't exist

      expect(response.body.success).toBe(false);
    });

    it('GET /api/upload/image/info - Get image info (admin)', async () => {
      const response = await request(app)
        .get('/api/upload/image/info?filename=test.jpg')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404); // Expected to fail as file doesn't exist

      expect(response.body.success).toBe(false);
    });
  });

  describe('Health Check Endpoints (8 endpoints)', () => {
    it('GET /api/health - Basic health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });

    it('GET /api/health/detailed - Detailed health check', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });

    it('GET /api/health/database - Database health check', async () => {
      const response = await request(app)
        .get('/api/health/database')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
    });

    it('GET /api/health/monitor/status - Health monitor status', async () => {
      const response = await request(app)
        .get('/api/health/monitor/status')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('GET /api/health/monitor/stats - Health monitor stats', async () => {
      const response = await request(app)
        .get('/api/health/monitor/stats')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('GET /api/health/monitor/history - Health monitor history', async () => {
      const response = await request(app)
        .get('/api/health/monitor/history')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.history).toBeDefined();
    });

    it('POST /api/health/monitor/start - Start health monitoring', async () => {
      const response = await request(app)
        .post('/api/health/monitor/start')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('started');
    });

    it('POST /api/health/monitor/stop - Stop health monitoring', async () => {
      const response = await request(app)
        .post('/api/health/monitor/stop')
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('stopped');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing authorization headers', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should handle invalid authorization tokens', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed MongoDB ObjectIds', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle request size limits', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB payload

      const response = await request(app)
        .post('/api/auth/register')
        .send({ data: largePayload })
        .expect(413);

      expect(response.status).toBe(413);
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent success response format', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.success).toBe(true);
      expect(typeof response.body.data).toBe('object');
    });

    it('should return consistent error response format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
      expect(typeof response.body.message).toBe('string');
    });

    it('should include pagination in list responses', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('currentPage');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('totalProducts');
    });

    it('should include proper timestamps in responses', async () => {
      const response = await request(app)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(response.body.data.product).toHaveProperty('createdAt');
      expect(response.body.data.product).toHaveProperty('updatedAt');
      expect(new Date(response.body.data.product.createdAt)).toBeInstanceOf(Date);
    });
  });
});