import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import { User, Product, Category, HomepageSection } from '../../models/index.js';
import connectDB from '../../config/database.js';

describe('Homepage Sections Integration', () => {
  let adminToken;
  let testCategory;
  let testProducts;

  beforeAll(async () => {
    await connectDB();
    
    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category'
    });

    // Create admin user
    const adminUser = await User.create({
      firstName: 'Test',
      lastName: 'Admin',
      email: 'testadmin@test.com',
      password: 'password123',
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testadmin@test.com',
        password: 'password123'
      });

    adminToken = loginResponse.body.data.token;

    // Create test products
    testProducts = await Product.insertMany([
      {
        name: 'Test Product 1',
        description: 'Test description',
        price: 100,
        category: testCategory._id,
        createdBy: adminUser._id,
        status: 'active',
        visibility: 'public',
        featured: true,
        sales: { totalSold: 50 }
      },
      {
        name: 'Test Product 2',
        description: 'Test description',
        price: 200,
        category: testCategory._id,
        createdBy: adminUser._id,
        status: 'active',
        visibility: 'public',
        comparePrice: 250,
        sales: { totalSold: 30 }
      }
    ]);

    // Initialize homepage sections
    await HomepageSection.initializeDefaults();
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await HomepageSection.deleteMany({});
  });

  describe('GET /api/products/latest', () => {
    it('should return latest products', async () => {
      const response = await request(app)
        .get('/api/products/latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/products/top-sellers', () => {
    it('should return top selling products', async () => {
      const response = await request(app)
        .get('/api/products/top-sellers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/products/quick-picks', () => {
    it('should return quick picks', async () => {
      const response = await request(app)
        .get('/api/products/quick-picks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/products/weekly-deals', () => {
    it('should return weekly deals', async () => {
      const response = await request(app)
        .get('/api/products/weekly-deals')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeInstanceOf(Array);
    });
  });

  describe('Admin Homepage Sections', () => {
    it('should get homepage sections (admin only)', async () => {
      const response = await request(app)
        .get('/api/admin/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sections).toBeInstanceOf(Array);
    });

    it('should update homepage section (admin only)', async () => {
      const response = await request(app)
        .put('/api/admin/sections/latest')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mode: 'manual',
          productIds: [testProducts[0]._id.toString()]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section.mode).toBe('manual');
    });
  });
});