import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { User, Product, Category, Order } from '../../src/models/index.js';

describe('End-to-End Admin Workflow Tests', () => {
  let adminToken;
  let adminUser;
  let testCategory;
  let regularUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/techverse_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@techverse.com',
      password: 'AdminPass123!',
      role: 'admin',
      isEmailVerified: true
    });

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@techverse.com',
      password: 'UserPass123!',
      role: 'user',
      isEmailVerified: true
    });

    // Login admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@techverse.com',
        password: 'AdminPass123!'
      });

    adminToken = loginResponse.body.data.tokens.accessToken;

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true
    });
  });

  describe('Complete Admin Product Management Workflow', () => {
    it('should complete full product lifecycle management', async () => {
      // Step 1: Check initial dashboard stats
      const initialDashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(initialDashboardResponse.body.data.overview.totalProducts).toBe(0);

      // Step 2: Create multiple categories
      const categories = [
        { name: 'Laptops', description: 'Portable computers' },
        { name: 'Accessories', description: 'Computer accessories' },
        { name: 'Gaming', description: 'Gaming equipment' }
      ];

      const createdCategories = [];
      for (const categoryData of categories) {
        const response = await request(app)
          .post('/api/admin/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...categoryData, isActive: true })
          .expect(201);

        createdCategories.push(response.body.data.category);
      }

      // Step 3: Create products in different categories
      const products = [
        {
          name: 'Gaming Laptop Pro',
          description: 'High-end gaming laptop with RTX 4080',
          price: 2499.99,
          comparePrice: 2799.99,
          category: createdCategories[0]._id, // Laptops
          brand: 'TechPro',
          status: 'active',
          visibility: 'public',
          stock: { quantity: 5, trackQuantity: true, lowStockThreshold: 2 }
        },
        {
          name: 'Wireless Gaming Mouse',
          description: 'Professional wireless gaming mouse',
          price: 79.99,
          category: createdCategories[1]._id, // Accessories
          brand: 'GameGear',
          status: 'active',
          visibility: 'public',
          stock: { quantity: 25, trackQuantity: true, lowStockThreshold: 5 }
        },
        {
          name: 'Mechanical Gaming Keyboard',
          description: 'RGB mechanical keyboard with blue switches',
          price: 149.99,
          category: createdCategories[2]._id, // Gaming
          brand: 'KeyMaster',
          status: 'draft', // Initially draft
          visibility: 'private',
          stock: { quantity: 15, trackQuantity: true, lowStockThreshold: 3 }
        }
      ];

      const createdProducts = [];
      for (const productData of products) {
        const response = await request(app)
          .post('/api/admin/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        createdProducts.push(response.body.data.product);
      }

      // Step 4: Update product status (publish draft product)
      const draftProduct = createdProducts[2];
      const publishResponse = await request(app)
        .put(`/api/admin/products/${draftProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active', visibility: 'public' })
        .expect(200);

      expect(publishResponse.body.data.product.status).toBe('active');

      // Step 5: Check updated dashboard stats
      const updatedDashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(updatedDashboardResponse.body.data.overview.totalProducts).toBe(3);

      // Step 6: Search and filter products
      const searchResponse = await request(app)
        .get('/api/admin/products?search=gaming&status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(searchResponse.body.data.products.length).toBeGreaterThan(0);
      expect(searchResponse.body.data.products.every(p => 
        p.name.toLowerCase().includes('gaming') && p.status === 'active'
      )).toBe(true);

      // Step 7: Update product stock
      const laptopProduct = createdProducts[0];
      await request(app)
        .put(`/api/admin/inventory/${laptopProduct._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 2, reason: 'Stock adjustment' })
        .expect(200);

      // Step 8: Check low stock products
      const lowStockResponse = await request(app)
        .get('/api/admin/inventory/low-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(lowStockResponse.body.data.products.length).toBeGreaterThan(0);
      expect(lowStockResponse.body.data.products.some(p => 
        p._id === laptopProduct._id
      )).toBe(true);

      // Step 9: Bulk stock update
      const bulkUpdateData = {
        updates: [
          { productId: createdProducts[1]._id, quantity: 30 },
          { productId: createdProducts[2]._id, quantity: 20 }
        ]
      };

      const bulkUpdateResponse = await request(app)
        .put('/api/admin/inventory/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkUpdateData)
        .expect(200);

      expect(bulkUpdateResponse.body.data.summary.successful).toBe(2);

      // Step 10: Get inventory analytics
      const inventoryAnalyticsResponse = await request(app)
        .get('/api/admin/inventory/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(inventoryAnalyticsResponse.body.data.overview.totalProducts).toBe(3);

      // Step 11: Soft delete a product
      const mouseProduct = createdProducts[1];
      const deleteResponse = await request(app)
        .delete(`/api/admin/products/${mouseProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteResponse.body.data.product.status).toBe('deleted');

      // Step 12: Verify product is no longer in active listings
      const activeProductsResponse = await request(app)
        .get('/api/admin/products?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(activeProductsResponse.body.data.products.every(p => 
        p._id !== mouseProduct._id
      )).toBe(true);
    });
  });

  describe('Complete Admin User Management Workflow', () => {
    let additionalUsers = [];

    beforeEach(async () => {
      // Create additional test users
      const userDataArray = [
        {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          password: 'Password123!',
          role: 'user',
          isEmailVerified: true,
          accountStatus: 'active'
        },
        {
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@example.com',
          password: 'Password123!',
          role: 'user',
          isEmailVerified: false,
          accountStatus: 'pending'
        },
        {
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie@example.com',
          password: 'Password123!',
          role: 'user',
          isEmailVerified: true,
          accountStatus: 'suspended'
        }
      ];

      additionalUsers = await User.insertMany(userDataArray);
    });

    it('should complete full user management workflow', async () => {
      // Step 1: Get all users with pagination
      const allUsersResponse = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allUsersResponse.body.data.pagination.totalUsers).toBe(5); // admin + regular + 3 additional

      // Step 2: Search for specific users
      const searchUsersResponse = await request(app)
        .get('/api/admin/users?search=alice')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(searchUsersResponse.body.data.users).toHaveLength(1);
      expect(searchUsersResponse.body.data.users[0].firstName).toBe('Alice');

      // Step 3: Filter users by status
      const suspendedUsersResponse = await request(app)
        .get('/api/admin/users?status=suspended')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(suspendedUsersResponse.body.data.users).toHaveLength(1);
      expect(suspendedUsersResponse.body.data.users[0].firstName).toBe('Charlie');

      // Step 4: Get detailed user information
      const aliceUser = additionalUsers.find(u => u.firstName === 'Alice');
      const userDetailResponse = await request(app)
        .get(`/api/admin/users/${aliceUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(userDetailResponse.body.data.user.email).toBe('alice@example.com');
      expect(userDetailResponse.body.data.statistics).toBeDefined();

      // Step 5: Update user status
      const bobUser = additionalUsers.find(u => u.firstName === 'Bob');
      const statusUpdateResponse = await request(app)
        .put(`/api/admin/users/${bobUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'active',
          reason: 'Email verification completed manually'
        })
        .expect(200);

      expect(statusUpdateResponse.body.data.user.accountStatus).toBe('active');

      // Step 6: Try to update own status (should fail)
      const selfUpdateResponse = await request(app)
        .put(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended' })
        .expect(400);

      expect(selfUpdateResponse.body.message).toContain('Cannot modify your own');

      // Step 7: Suspend a user
      const suspendResponse = await request(app)
        .put(`/api/admin/users/${aliceUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'suspended',
          reason: 'Violation of terms of service'
        })
        .expect(200);

      expect(suspendResponse.body.data.user.accountStatus).toBe('suspended');

      // Step 8: Reactivate suspended user
      const reactivateResponse = await request(app)
        .put(`/api/admin/users/${aliceUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'active',
          reason: 'Appeal approved'
        })
        .expect(200);

      expect(reactivateResponse.body.data.user.accountStatus).toBe('active');

      // Step 9: Delete a user (should check for active orders first)
      const charlieUser = additionalUsers.find(u => u.firstName === 'Charlie');
      const deleteUserResponse = await request(app)
        .delete(`/api/admin/users/${charlieUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteUserResponse.body.success).toBe(true);

      // Step 10: Verify user was deleted
      const deletedUserResponse = await request(app)
        .get(`/api/admin/users/${charlieUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(deletedUserResponse.body.success).toBe(false);
    });
  });

  describe('Complete Admin Order Management Workflow', () => {
    let testOrders = [];
    let testProducts = [];

    beforeEach(async () => {
      // Create test products
      testProducts = await Product.insertMany([
        {
          name: 'Test Product 1',
          description: 'First test product',
          price: 100,
          category: testCategory._id,
          brand: 'TestBrand',
          createdBy: adminUser._id,
          status: 'active',
          stock: { quantity: 10, trackQuantity: true }
        },
        {
          name: 'Test Product 2',
          description: 'Second test product',
          price: 200,
          category: testCategory._id,
          brand: 'TestBrand',
          createdBy: adminUser._id,
          status: 'active',
          stock: { quantity: 5, trackQuantity: true }
        }
      ]);

      // Create test orders
      testOrders = await Order.insertMany([
        {
          user: regularUser._id,
          orderNumber: 'ORD-001',
          items: [
            { product: testProducts[0]._id, quantity: 2, price: 100 }
          ],
          totalAmount: 200,
          status: 'pending',
          shippingAddress: {
            firstName: 'Regular',
            lastName: 'User',
            address: '123 Test Street',
            city: 'Test City',
            postcode: 'T1 1ST'
          }
        },
        {
          user: regularUser._id,
          orderNumber: 'ORD-002',
          items: [
            { product: testProducts[1]._id, quantity: 1, price: 200 }
          ],
          totalAmount: 200,
          status: 'confirmed',
          shippingAddress: {
            firstName: 'Regular',
            lastName: 'User',
            address: '123 Test Street',
            city: 'Test City',
            postcode: 'T1 1ST'
          }
        }
      ]);
    });

    it('should complete full order management workflow', async () => {
      // Step 1: Get all orders
      const allOrdersResponse = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allOrdersResponse.body.data.orders).toHaveLength(2);

      // Step 2: Filter orders by status
      const pendingOrdersResponse = await request(app)
        .get('/api/admin/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(pendingOrdersResponse.body.data.orders).toHaveLength(1);
      expect(pendingOrdersResponse.body.data.orders[0].status).toBe('pending');

      // Step 3: Get order statistics
      const orderStatsResponse = await request(app)
        .get('/api/admin/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(orderStatsResponse.body.data.overall).toBeDefined();

      // Step 4: Get detailed order information
      const pendingOrder = testOrders[0];
      const orderDetailResponse = await request(app)
        .get(`/api/admin/orders/${pendingOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(orderDetailResponse.body.data.order.orderNumber).toBe('ORD-001');
      expect(orderDetailResponse.body.data.order.user.firstName).toBe('Regular');

      // Step 5: Update order status through workflow
      const statusUpdates = [
        { status: 'confirmed', notes: 'Payment verified' },
        { status: 'processing', notes: 'Order being prepared' },
        { status: 'shipped', notes: 'Order shipped via courier' },
        { status: 'delivered', notes: 'Order delivered successfully' }
      ];

      for (const update of statusUpdates) {
        const updateResponse = await request(app)
          .put(`/api/admin/orders/${pendingOrder._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(update)
          .expect(200);

        expect(updateResponse.body.data.order.status).toBe(update.status);
      }

      // Step 6: Cancel an order
      const confirmedOrder = testOrders[1];
      const cancelResponse = await request(app)
        .put(`/api/admin/orders/${confirmedOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          status: 'cancelled', 
          notes: 'Customer requested cancellation' 
        })
        .expect(200);

      expect(cancelResponse.body.data.order.status).toBe('cancelled');

      // Step 7: Get updated order statistics
      const updatedStatsResponse = await request(app)
        .get('/api/admin/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(updatedStatsResponse.body.data.statusBreakdown).toBeDefined();

      // Step 8: Search orders by date range
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const dateFilterResponse = await request(app)
        .get(`/api/admin/orders?dateFrom=${yesterday.toISOString()}&dateTo=${today.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(dateFilterResponse.body.data.orders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Admin Analytics and Reporting Workflow', () => {
    beforeEach(async () => {
      // Create comprehensive test data for analytics
      const categories = await Category.insertMany([
        { name: 'Laptops', slug: 'laptops', isActive: true },
        { name: 'Accessories', slug: 'accessories', isActive: true }
      ]);

      const products = await Product.insertMany([
        {
          name: 'Analytics Laptop',
          price: 1000,
          category: categories[0]._id,
          brand: 'AnalyticsBrand',
          createdBy: adminUser._id,
          status: 'active',
          stock: { quantity: 3, lowStockThreshold: 5, trackQuantity: true },
          sales: { totalSold: 10, revenue: 10000 }
        },
        {
          name: 'Analytics Mouse',
          price: 50,
          category: categories[1]._id,
          brand: 'AnalyticsBrand',
          createdBy: adminUser._id,
          status: 'active',
          stock: { quantity: 20, trackQuantity: true },
          sales: { totalSold: 25, revenue: 1250 }
        }
      ]);

      await Order.insertMany([
        {
          user: regularUser._id,
          orderNumber: 'ANALYTICS-001',
          items: [{ product: products[0]._id, quantity: 1, price: 1000 }],
          totalAmount: 1000,
          status: 'delivered'
        },
        {
          user: regularUser._id,
          orderNumber: 'ANALYTICS-002',
          items: [{ product: products[1]._id, quantity: 2, price: 50 }],
          totalAmount: 100,
          status: 'delivered'
        }
      ]);
    });

    it('should provide comprehensive analytics and reporting', async () => {
      // Step 1: Get dashboard overview
      const dashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(dashboardResponse.body.data.overview.totalUsers).toBeGreaterThan(0);
      expect(dashboardResponse.body.data.overview.totalProducts).toBeGreaterThan(0);
      expect(dashboardResponse.body.data.overview.totalRevenue).toBeGreaterThan(0);

      // Step 2: Get comprehensive analytics
      const comprehensiveAnalyticsResponse = await request(app)
        .get('/api/admin/analytics/comprehensive?period=30d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(comprehensiveAnalyticsResponse.body.data.revenue).toBeDefined();
      expect(comprehensiveAnalyticsResponse.body.data.orders).toBeDefined();
      expect(comprehensiveAnalyticsResponse.body.data.products).toBeDefined();
      expect(comprehensiveAnalyticsResponse.body.data.users).toBeDefined();

      // Step 3: Get real-time metrics
      const realtimeResponse = await request(app)
        .get('/api/admin/analytics/realtime')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(realtimeResponse.body.data.activeUsers).toBeDefined();
      expect(realtimeResponse.body.data.recentOrders).toBeDefined();
      expect(realtimeResponse.body.data.systemHealth).toBeDefined();

      // Step 4: Get inventory analytics
      const inventoryAnalyticsResponse = await request(app)
        .get('/api/admin/inventory/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(inventoryAnalyticsResponse.body.data.overview.totalProducts).toBeGreaterThan(0);
      expect(inventoryAnalyticsResponse.body.data.overview.lowStockCount).toBeGreaterThan(0);

      // Step 5: Get activity analytics (if implemented)
      const activityAnalyticsResponse = await request(app)
        .get('/api/admin/analytics/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(activityAnalyticsResponse.body.data.overview).toBeDefined();
    });
  });
});