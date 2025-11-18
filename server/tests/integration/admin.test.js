import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { User, Product, Category, Order } from '../../src/models/index.js';

describe('Admin Integration Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testCategory;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/techverse_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});

    // Create admin user
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'admin',
      isEmailVerified: true
    });
    await adminUser.save();

    // Create regular user
    regularUser = new User({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@example.com',
      password: 'UserPass123!',
      role: 'user',
      isEmailVerified: true
    });
    await regularUser.save();

    // Create test category
    testCategory = new Category({
      name: 'Electronics',
      slug: 'electronics',
      isActive: true
    });
    await testCategory.save();

    // Login admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });
    adminToken = adminLoginResponse.body.data.tokens.accessToken;

    // Login regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'UserPass123!'
      });
    userToken = userLoginResponse.body.data.tokens.accessToken;
  });

  describe('Admin Authentication & Authorization', () => {
    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('admin');
    });

    it('should deny unauthenticated access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Product Management', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'Test Laptop',
        description: 'A test laptop for admin testing',
        price: 999.99,
        category: testCategory._id.toString(),
        brand: 'TestBrand',
        status: 'active',
        visibility: 'public',
        stock: {
          quantity: 10,
          trackQuantity: true
        }
      };

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(productData.name);
      expect(response.body.data.product.createdBy).toBe(adminUser._id.toString());

      // Verify product was created in database
      const product = await Product.findOne({ name: productData.name });
      expect(product).toBeTruthy();
    });

    it('should get all products with pagination', async () => {
      // Create test products
      const products = [];
      for (let i = 1; i <= 15; i++) {
        products.push({
          name: `Test Product ${i}`,
          description: `Description ${i}`,
          price: 100 * i,
          category: testCategory._id,
          brand: 'TestBrand',
          createdBy: adminUser._id,
          status: 'active'
        });
      }
      await Product.insertMany(products);

      const response = await request(app)
        .get('/api/admin/products?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(10);
      expect(response.body.data.pagination.totalProducts).toBe(15);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should search products', async () => {
      // Create test products
      await Product.create({
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop',
        price: 1500,
        category: testCategory._id,
        brand: 'GamerBrand',
        createdBy: adminUser._id,
        status: 'active'
      });

      await Product.create({
        name: 'Office Desktop',
        description: 'Business desktop computer',
        price: 800,
        category: testCategory._id,
        brand: 'OfficeBrand',
        createdBy: adminUser._id,
        status: 'active'
      });

      const response = await request(app)
        .get('/api/admin/products?search=laptop')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toContain('Laptop');
    });

    it('should update product', async () => {
      const product = await Product.create({
        name: 'Original Product',
        description: 'Original description',
        price: 500,
        category: testCategory._id,
        brand: 'OriginalBrand',
        createdBy: adminUser._id,
        status: 'active'
      });

      const updateData = {
        name: 'Updated Product',
        price: 600
      };

      const response = await request(app)
        .put(`/api/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe(updateData.name);
      expect(response.body.data.product.price).toBe(updateData.price);
      expect(response.body.data.product.updatedBy).toBe(adminUser._id.toString());
    });

    it('should soft delete product', async () => {
      const product = await Product.create({
        name: 'Product to Delete',
        description: 'This product will be deleted',
        price: 300,
        category: testCategory._id,
        brand: 'DeleteBrand',
        createdBy: adminUser._id,
        status: 'active'
      });

      const response = await request(app)
        .delete(`/api/admin/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product was soft deleted
      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct.status).toBe('deleted');
      expect(deletedProduct.deletedBy.toString()).toBe(adminUser._id.toString());
    });
  });

  describe('Admin User Management', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2); // admin + regular user
      expect(response.body.data.pagination.totalUsers).toBe(2);
    });

    it('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(regularUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should update user status', async () => {
      const statusUpdate = {
        status: 'suspended',
        reason: 'Testing suspension'
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.accountStatus).toBe('suspended');

      // Verify in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.accountStatus).toBe('suspended');
      expect(updatedUser.suspensionReason).toBe(statusUpdate.reason);
    });

    it('should prevent admin from modifying their own status', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'suspended' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot modify your own');
    });

    it('should search users', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=regular')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].firstName).toBe('Regular');
    });
  });

  describe('Admin Category Management', () => {
    it('should create category', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'A new test category',
        isActive: true
      };

      const response = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(categoryData.name);
      expect(response.body.data.category.slug).toBe('new-category');
    });

    it('should get all categories', async () => {
      const response = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(1); // testCategory
    });

    it('should update category', async () => {
      const updateData = {
        name: 'Updated Electronics',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/admin/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe(updateData.name);
    });

    it('should delete category', async () => {
      // Create category without products
      const emptyCategory = await Category.create({
        name: 'Empty Category',
        slug: 'empty-category',
        isActive: true
      });

      const response = await request(app)
        .delete(`/api/admin/categories/${emptyCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify category was deleted
      const deletedCategory = await Category.findById(emptyCategory._id);
      expect(deletedCategory).toBeNull();
    });

    it('should prevent deleting category with products', async () => {
      // Create product in category
      await Product.create({
        name: 'Product in Category',
        description: 'This product is in the category',
        price: 100,
        category: testCategory._id,
        brand: 'TestBrand',
        createdBy: adminUser._id,
        status: 'active'
      });

      const response = await request(app)
        .delete(`/api/admin/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('products');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(async () => {
      // Create test data for dashboard
      await Product.create({
        name: 'Dashboard Product',
        description: 'Product for dashboard testing',
        price: 500,
        category: testCategory._id,
        brand: 'DashboardBrand',
        createdBy: adminUser._id,
        status: 'active'
      });

      await Order.create({
        user: regularUser._id,
        orderNumber: 'ORD-001',
        items: [{
          product: new mongoose.Types.ObjectId(),
          quantity: 2,
          price: 100
        }],
        totalAmount: 200,
        status: 'completed'
      });
    });

    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalUsers).toBe(2);
      expect(response.body.data.overview.totalProducts).toBe(1);
      expect(response.body.data.overview.totalOrders).toBe(1);
    });

    it('should get analytics data', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});