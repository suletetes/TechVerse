import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../../server.js';
import { User, Product, Category } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Product API Integration Tests', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let authToken;
  let adminToken;
  let testCategory;
  let testProducts;

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

    // Create test products with different sections
    testProducts = await Product.create([
      {
        name: 'Latest iPhone',
        slug: 'latest-iphone',
        description: 'The newest iPhone model',
        price: 999,
        category: testCategory._id,
        brand: 'Apple',
        sections: ['latest', 'topSeller'],
        status: 'active',
        visibility: 'public',
        createdBy: adminUser._id,
        images: [{ url: '/test-iphone.jpg', alt: 'iPhone' }],
        stock: { quantity: 50, trackQuantity: true }
      },
      {
        name: 'Samsung Galaxy',
        slug: 'samsung-galaxy',
        description: 'Premium Samsung smartphone',
        price: 899,
        category: testCategory._id,
        brand: 'Samsung',
        sections: ['quickPick'],
        status: 'active',
        visibility: 'public',
        createdBy: adminUser._id,
        images: [{ url: '/test-samsung.jpg', alt: 'Samsung' }],
        stock: { quantity: 30, trackQuantity: true }
      },
      {
        name: 'Weekly Deal Laptop',
        slug: 'weekly-deal-laptop',
        description: 'Discounted laptop for this week',
        price: 599,
        comparePrice: 799,
        category: testCategory._id,
        brand: 'Dell',
        sections: ['weeklyDeal'],
        status: 'active',
        visibility: 'public',
        createdBy: adminUser._id,
        images: [{ url: '/test-laptop.jpg', alt: 'Laptop' }],
        stock: { quantity: 20, trackQuantity: true }
      },
      {
        name: 'Top Seller Headphones',
        slug: 'top-seller-headphones',
        description: 'Best selling wireless headphones',
        price: 299,
        category: testCategory._id,
        brand: 'Sony',
        sections: ['topSeller', 'quickPick'],
        status: 'active',
        visibility: 'public',
        createdBy: adminUser._id,
        images: [{ url: '/test-headphones.jpg', alt: 'Headphones' }],
        stock: { quantity: 100, trackQuantity: true }
      },
      {
        name: 'Inactive Product',
        slug: 'inactive-product',
        description: 'This product is inactive',
        price: 199,
        category: testCategory._id,
        brand: 'TestBrand',
        sections: ['latest'],
        status: 'inactive',
        visibility: 'public',
        createdBy: adminUser._id,
        images: [{ url: '/test-inactive.jpg', alt: 'Inactive' }],
        stock: { quantity: 10, trackQuantity: true }
      }
    ]);
  });

  describe('GET /api/products - Product Listing with Section Filtering', () => {
    it('should get all active products without section filter', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(4); // Only active products
      expect(response.body.data.pagination.totalProducts).toBe(4);
      expect(response.body.data.products.every(p => p.status === 'active')).toBe(true);
    });

    it('should filter products by section parameter', async () => {
      const response = await request(app)
        .get('/api/products?section=latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].sections).toContain('latest');
      expect(response.body.data.products[0].name).toBe('Latest iPhone');
    });

    it('should filter products by topSeller section', async () => {
      const response = await request(app)
        .get('/api/products?section=topSeller')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('Latest iPhone');
      expect(productNames).toContain('Top Seller Headphones');
      
      response.body.data.products.forEach(product => {
        expect(product.sections).toContain('topSeller');
      });
    });

    it('should filter products by quickPick section', async () => {
      const response = await request(app)
        .get('/api/products?section=quickPick')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('Samsung Galaxy');
      expect(productNames).toContain('Top Seller Headphones');
    });

    it('should filter products by weeklyDeal section', async () => {
      const response = await request(app)
        .get('/api/products?section=weeklyDeal')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].sections).toContain('weeklyDeal');
      expect(response.body.data.products[0].name).toBe('Weekly Deal Laptop');
    });

    it('should return empty array for section with no products', async () => {
      const response = await request(app)
        .get('/api/products?section=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(0);
      expect(response.body.data.pagination.totalProducts).toBe(0);
    });

    it('should combine section filter with other filters', async () => {
      const response = await request(app)
        .get('/api/products?section=topSeller&brand=Apple')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Latest iPhone');
      expect(response.body.data.products[0].brand).toBe('Apple');
      expect(response.body.data.products[0].sections).toContain('topSeller');
    });

    it('should handle pagination with section filtering', async () => {
      const response = await request(app)
        .get('/api/products?section=topSeller&page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalProducts).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });
  });

  describe('GET /api/products/:id - Individual Product Retrieval', () => {
    it('should get product by valid ID', async () => {
      const product = testProducts[0]; // Latest iPhone
      
      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product._id).toBe(product._id.toString());
      expect(response.body.data.product.name).toBe('Latest iPhone');
      expect(response.body.data.product.price).toBe(999);
      expect(response.body.data.product.sections).toEqual(['latest', 'topSeller']);
      expect(response.body.data.product.category.name).toBe('Electronics');
    });

    it('should get product by valid slug', async () => {
      const response = await request(app)
        .get('/api/products/samsung-galaxy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Samsung Galaxy');
      expect(response.body.data.product.slug).toBe('samsung-galaxy');
      expect(response.body.data.product.sections).toEqual(['quickPick']);
    });

    it('should return 404 for non-existent product ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
      expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 404 for non-existent product slug', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-slug')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
      expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should return 404 for inactive product (non-admin user)', async () => {
      const inactiveProduct = testProducts[4]; // Inactive Product
      
      const response = await request(app)
        .get(`/api/products/${inactiveProduct._id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
      expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should allow admin to view inactive product', async () => {
      const inactiveProduct = testProducts[4]; // Inactive Product
      
      const response = await request(app)
        .get(`/api/products/${inactiveProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Inactive Product');
      expect(response.body.data.product.status).toBe('inactive');
    });

    it('should include populated category information', async () => {
      const product = testProducts[0];
      
      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .expect(200);

      expect(response.body.data.product.category).toBeDefined();
      expect(response.body.data.product.category.name).toBe('Electronics');
      expect(response.body.data.product.category.slug).toBe('electronics');
      expect(response.body.data.product.category._id).toBe(testCategory._id.toString());
    });

    it('should format image URLs correctly', async () => {
      const product = testProducts[0];
      
      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .expect(200);

      expect(response.body.data.product.images).toBeDefined();
      expect(Array.isArray(response.body.data.product.images)).toBe(true);
      expect(response.body.data.product.images.length).toBeGreaterThan(0);
      expect(response.body.data.product.images[0]).toHaveProperty('url');
      expect(response.body.data.product.images[0]).toHaveProperty('alt');
    });
  });

  describe('GET /api/products/section/:section - Section-Based Queries', () => {
    it('should get products from latest section', async () => {
      const response = await request(app)
        .get('/api/products/section/latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('latest');
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Latest iPhone');
      expect(response.body.data.count).toBe(1);
    });

    it('should get products from topSeller section', async () => {
      const response = await request(app)
        .get('/api/products/section/topSeller')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('topSeller');
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('Latest iPhone');
      expect(productNames).toContain('Top Seller Headphones');
    });

    it('should get products from quickPick section', async () => {
      const response = await request(app)
        .get('/api/products/section/quickPick')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('quickPick');
      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('Samsung Galaxy');
      expect(productNames).toContain('Top Seller Headphones');
    });

    it('should get products from weeklyDeal section', async () => {
      const response = await request(app)
        .get('/api/products/section/weeklyDeal')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('weeklyDeal');
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Weekly Deal Laptop');
    });

    it('should return 400 for invalid section', async () => {
      const response = await request(app)
        .get('/api/products/section/invalidSection')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid section');
      expect(response.body.code).toBe('INVALID_SECTION');
    });

    it('should return empty array for valid section with no products', async () => {
      // Create a product in featured section first, then test
      await Product.create({
        name: 'Featured Product',
        slug: 'featured-product',
        description: 'A featured product',
        price: 399,
        category: testCategory._id,
        brand: 'TestBrand',
        sections: ['featured'],
        status: 'active',
        visibility: 'public',
        createdBy: adminUser._id,
        images: [{ url: '/test-featured.jpg', alt: 'Featured' }],
        stock: { quantity: 15, trackQuantity: true }
      });

      const response = await request(app)
        .get('/api/products/section/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.section).toBe('featured');
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Featured Product');
    });

    it('should respect limit parameter for section queries', async () => {
      const response = await request(app)
        .get('/api/products/section/topSeller?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.count).toBe(1);
    });

    it('should only return active and public products in sections', async () => {
      // The inactive product should not appear in any section queries
      const response = await request(app)
        .get('/api/products/section/latest')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should only get the active iPhone, not the inactive product
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].status).toBe('active');
      expect(response.body.data.products[0].name).toBe('Latest iPhone');
    });
  });

  describe('Section-Based Query Result Validation', () => {
    it('should return correct filtered results for multiple sections', async () => {
      // Test that products in multiple sections appear in both queries
      const latestResponse = await request(app)
        .get('/api/products/section/latest')
        .expect(200);

      const topSellerResponse = await request(app)
        .get('/api/products/section/topSeller')
        .expect(200);

      // Latest iPhone should appear in both
      expect(latestResponse.body.data.products[0].name).toBe('Latest iPhone');
      
      const topSellerNames = topSellerResponse.body.data.products.map(p => p.name);
      expect(topSellerNames).toContain('Latest iPhone');
    });

    it('should maintain consistent product data across different query methods', async () => {
      const product = testProducts[0]; // Latest iPhone
      
      // Get via direct ID
      const directResponse = await request(app)
        .get(`/api/products/${product._id}`)
        .expect(200);

      // Get via section query
      const sectionResponse = await request(app)
        .get('/api/products/section/latest')
        .expect(200);

      // Get via general products query with section filter
      const filterResponse = await request(app)
        .get('/api/products?section=latest')
        .expect(200);

      // All should return the same product data
      const directProduct = directResponse.body.data.product;
      const sectionProduct = sectionResponse.body.data.products[0];
      const filterProduct = filterResponse.body.data.products[0];

      expect(directProduct._id).toBe(sectionProduct._id);
      expect(directProduct._id).toBe(filterProduct._id);
      expect(directProduct.name).toBe(sectionProduct.name);
      expect(directProduct.name).toBe(filterProduct.name);
      expect(directProduct.price).toBe(sectionProduct.price);
      expect(directProduct.price).toBe(filterProduct.price);
    });

    it('should handle products with multiple sections correctly', async () => {
      // Top Seller Headphones is in both topSeller and quickPick sections
      const topSellerResponse = await request(app)
        .get('/api/products/section/topSeller')
        .expect(200);

      const quickPickResponse = await request(app)
        .get('/api/products/section/quickPick')
        .expect(200);

      const topSellerHeadphones = topSellerResponse.body.data.products.find(p => p.name === 'Top Seller Headphones');
      const quickPickHeadphones = quickPickResponse.body.data.products.find(p => p.name === 'Top Seller Headphones');

      expect(topSellerHeadphones).toBeDefined();
      expect(quickPickHeadphones).toBeDefined();
      expect(topSellerHeadphones._id).toBe(quickPickHeadphones._id);
      expect(topSellerHeadphones.sections).toContain('topSeller');
      expect(topSellerHeadphones.sections).toContain('quickPick');
    });
  });
});