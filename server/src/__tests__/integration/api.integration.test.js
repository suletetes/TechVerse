import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server.js';
import { User, Product, Category, Order, Review } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('API Integration Tests', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;
  let testCategory;
  let testProduct;

  beforeAll(async () => {
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
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      isEmailVerified: true
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'admin',
      isEmailVerified: true
    });

    // Generate auth tokens
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      createdBy: adminUser._id
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
      status: 'active',
      visibility: 'public',
      createdBy: adminUser._id
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.token).toBeDefined();

      // 2. Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      const newUserToken = loginResponse.body.data.token;

      // 3. Access protected route
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe('newuser@example.com');

      // 4. Update profile
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name'
        })
        .expect(200);

      expect(updateResponse.body.data.user.firstName).toBe('Updated');

      // 5. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);
    });

    it('should handle password reset flow', async () => {
      // 1. Request password reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      // 2. Get reset token from database
      const user = await User.findById(testUser._id);
      expect(user.passwordResetToken).toBeDefined();

      // 3. Reset password
      const resetToken = user.passwordResetToken;
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(200);

      // 4. Login with new password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123'
        })
        .expect(200);
    });
  });

  describe('Product Management Flow', () => {
    it('should complete full product lifecycle', async () => {
      // 1. Create product (admin only)
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Product',
          description: 'A new test product',
          price: 599,
          category: testCategory._id,
          brand: 'NewBrand',
          stock: { quantity: 25 }
        })
        .expect(201);

      const productId = createResponse.body.data.product._id;

      // 2. Get product (public)
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200);

      expect(getResponse.body.data.product.name).toBe('New Product');

      // 3. Update product (admin only)
      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          price: 699
        })
        .expect(200);

      expect(updateResponse.body.data.product.name).toBe('Updated Product');
      expect(updateResponse.body.data.product.price).toBe(699);

      // 4. Add review (authenticated user)
      const reviewResponse = await request(app)
        .post(`/api/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          title: 'Great product!',
          comment: 'Really satisfied with this purchase.'
        })
        .expect(201);

      expect(reviewResponse.body.data.review.rating).toBe(5);

      // 5. Get product reviews
      const reviewsResponse = await request(app)
        .get(`/api/products/${productId}/reviews`)
        .expect(200);

      expect(reviewsResponse.body.data.reviews).toHaveLength(1);

      // 6. Delete product (admin only)
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 7. Verify product is deleted
      await request(app)
        .get(`/api/products/${productId}`)
        .expect(404);
    });

    it('should handle product search and filtering', async () => {
      // Create multiple products for testing
      await Product.create([
        {
          name: 'iPhone 15',
          slug: 'iphone-15',
          description: 'Latest iPhone model',
          price: 999,
          category: testCategory._id,
          brand: 'Apple',
          status: 'active',
          visibility: 'public',
          createdBy: adminUser._id
        },
        {
          name: 'Samsung Galaxy S24',
          slug: 'samsung-galaxy-s24',
          description: 'Latest Samsung phone',
          price: 899,
          category: testCategory._id,
          brand: 'Samsung',
          status: 'active',
          visibility: 'public',
          createdBy: adminUser._id
        }
      ]);

      // 1. Search products
      const searchResponse = await request(app)
        .get('/api/products/search?q=iPhone')
        .expect(200);

      expect(searchResponse.body.data.products).toHaveLength(1);
      expect(searchResponse.body.data.products[0].name).toBe('iPhone 15');

      // 2. Filter by brand
      const brandFilterResponse = await request(app)
        .get('/api/products?brand=Apple')
        .expect(200);

      expect(brandFilterResponse.body.data.products).toHaveLength(1);

      // 3. Filter by price range
      const priceFilterResponse = await request(app)
        .get('/api/products?minPrice=800&maxPrice=950')
        .expect(200);

      expect(priceFilterResponse.body.data.products).toHaveLength(1);
      expect(priceFilterResponse.body.data.products[0].name).toBe('Samsung Galaxy S24');

      // 4. Get products by category
      const categoryResponse = await request(app)
        .get(`/api/products/category/${testCategory._id}`)
        .expect(200);

      expect(categoryResponse.body.data.products.length).toBeGreaterThan(0);
    });
  });

  describe('Order Management Flow', () => {
    it('should complete full order lifecycle', async () => {
      // 1. Create order
      const orderData = {
        items: [
          {
            product: testProduct._id,
            quantity: 2,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        paymentMethod: 'credit_card'
      };

      const createOrderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId = createOrderResponse.body.data.order._id;
      expect(createOrderResponse.body.data.order.status).toBe('pending');

      // 2. Get order details
      const getOrderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getOrderResponse.body.data.order.items).toHaveLength(1);

      // 3. Update order status (admin)
      const updateOrderResponse = await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(updateOrderResponse.body.data.order.status).toBe('processing');

      // 4. Get user orders
      const userOrdersResponse = await request(app)
        .get('/api/orders/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userOrdersResponse.body.data.orders).toHaveLength(1);

      // 5. Cancel order (if still pending/processing)
      await request(app)
        .put(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('User Profile Management', () => {
    it('should handle complete profile management', async () => {
      // 1. Get current profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe(testUser.email);

      // 2. Update profile information
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          phone: '+1234567890'
        })
        .expect(200);

      expect(updateResponse.body.data.user.firstName).toBe('Updated');
      expect(updateResponse.body.data.user.phone).toBe('+1234567890');

      // 3. Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        })
        .expect(200);

      // 4. Verify new password works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'newpassword123'
        })
        .expect(200);

      // 5. Add address
      const addressResponse = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'home',
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        })
        .expect(201);

      expect(addressResponse.body.data.address.type).toBe('home');

      // 6. Get user addresses
      const addressesResponse = await request(app)
        .get('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(addressesResponse.body.data.addresses).toHaveLength(1);
    });
  });

  describe('Admin Operations', () => {
    it('should handle admin dashboard operations', async () => {
      // 1. Get dashboard stats
      const dashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(dashboardResponse.body.data.stats).toBeDefined();

      // 2. Get all users (admin only)
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersResponse.body.data.users.length).toBeGreaterThan(0);

      // 3. Get all orders (admin only)
      const ordersResponse = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(ordersResponse.body.data.orders).toBeDefined();

      // 4. Create category
      const categoryResponse = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          description: 'A new test category'
        })
        .expect(201);

      expect(categoryResponse.body.data.category.name).toBe('New Category');

      // 5. Update category
      const categoryId = categoryResponse.body.data.category._id;
      const updateCategoryResponse = await request(app)
        .put(`/api/admin/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category'
        })
        .expect(200);

      expect(updateCategoryResponse.body.data.category.name).toBe('Updated Category');
    });

    it('should prevent non-admin access to admin routes', async () => {
      // Regular user should not access admin routes
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Category' })
        .expect(403);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid authentication tokens', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle non-existent resources', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle validation errors', async () => {
      // Invalid product data
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // Empty name should fail validation
          price: -100 // Negative price should fail
        })
        .expect(400);

      // Invalid user registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email', // Invalid email format
          password: '123' // Too short password
        })
        .expect(400);
    });

    it('should handle concurrent operations safely', async () => {
      // Simulate concurrent product updates
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put(`/api/products/${testProduct._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: `Updated Product ${i}` })
      );

      const results = await Promise.allSettled(updatePromises);
      
      // At least one should succeed
      const successfulUpdates = results.filter(r => r.status === 'fulfilled');
      expect(successfulUpdates.length).toBeGreaterThan(0);
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          })
      );

      const results = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedRequests = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );
      
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large datasets efficiently', async () => {
      // Create many products
      const products = Array.from({ length: 100 }, (_, i) => ({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description for product ${i}`,
        price: 100 + i,
        category: testCategory._id,
        brand: 'TestBrand',
        status: 'active',
        visibility: 'public',
        createdBy: adminUser._id
      }));

      await Product.insertMany(products);

      // Test pagination
      const response = await request(app)
        .get('/api/products?page=1&limit=20')
        .expect(200);

      expect(response.body.data.products).toHaveLength(20);
      expect(response.body.data.pagination.totalProducts).toBe(101); // 100 + original test product
      expect(response.body.data.pagination.totalPages).toBe(6);
    });

    it('should handle search queries efficiently', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/products/search?q=test')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response should be under 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle concurrent user sessions', async () => {
      // Create multiple user sessions
      const sessionPromises = Array.from({ length: 10 }, async (_, i) => {
        const user = await User.create({
          firstName: `User${i}`,
          lastName: 'Test',
          email: `user${i}@example.com`,
          password: await bcrypt.hash('password123', 12),
          isEmailVerified: true
        });

        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        return request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      });

      const results = await Promise.all(sessionPromises);
      expect(results).toHaveLength(10);
    });
  });
});