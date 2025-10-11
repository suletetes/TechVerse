import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server.js';
import { User, Product, Category } from '../../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Performance and Load Tests', () => {
  let mongoServer;
  let authToken;
  let testCategory;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user and category
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'admin',
      isEmailVerified: true
    });

    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices',
      createdBy: testUser._id
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear products before each test
    await Product.deleteMany({});
  });

  describe('Database Performance', () => {
    it('should handle large dataset creation efficiently', async () => {
      const startTime = Date.now();
      
      // Create 1000 products
      const products = Array.from({ length: 1000 }, (_, i) => ({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description for product ${i}`,
        price: Math.floor(Math.random() * 1000) + 100,
        category: testCategory._id,
        brand: `Brand${i % 10}`,
        status: 'active',
        visibility: 'public',
        createdBy: testCategory.createdBy,
        stock: {
          quantity: Math.floor(Math.random() * 100) + 1,
          trackQuantity: true
        },
        rating: {
          average: Math.random() * 5,
          count: Math.floor(Math.random() * 100)
        }
      }));

      await Product.insertMany(products);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      
      // Verify all products were created
      const count = await Product.countDocuments();
      expect(count).toBe(1000);
    });

    it('should handle complex queries efficiently', async () => {
      // Create test data
      const products = Array.from({ length: 500 }, (_, i) => ({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description for product ${i}`,
        price: Math.floor(Math.random() * 1000) + 100,
        category: testCategory._id,
        brand: `Brand${i % 5}`,
        status: 'active',
        visibility: 'public',
        createdBy: testCategory.createdBy,
        rating: {
          average: Math.random() * 5,
          count: Math.floor(Math.random() * 100)
        }
      }));

      await Product.insertMany(products);

      const startTime = Date.now();

      // Complex aggregation query
      const result = await Product.aggregate([
        { $match: { status: 'active', price: { $gte: 200, $lte: 800 } } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $group: { 
          _id: '$brand', 
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' }
        }},
        { $sort: { avgPrice: -1 } },
        { $limit: 10 }
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle concurrent database operations', async () => {
      const concurrentOperations = 50;
      const startTime = Date.now();

      // Create concurrent read and write operations
      const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
        if (i % 2 === 0) {
          // Write operation
          return Product.create({
            name: `Concurrent Product ${i}`,
            slug: `concurrent-product-${i}`,
            description: `Description ${i}`,
            price: 100 + i,
            category: testCategory._id,
            brand: 'ConcurrentBrand',
            status: 'active',
            visibility: 'public',
            createdBy: testCategory.createdBy
          });
        } else {
          // Read operation
          return Product.find({ brand: 'ConcurrentBrand' }).limit(10);
        }
      });

      const results = await Promise.allSettled(operations);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
      
      // Most operations should succeed
      const successfulOps = results.filter(r => r.status === 'fulfilled');
      expect(successfulOps.length).toBeGreaterThan(concurrentOperations * 0.8);
    });
  });

  describe('API Response Time Performance', () => {
    beforeEach(async () => {
      // Create test products for API tests
      const products = Array.from({ length: 100 }, (_, i) => ({
        name: `API Product ${i}`,
        slug: `api-product-${i}`,
        description: `API Description ${i}`,
        price: 100 + i,
        category: testCategory._id,
        brand: `APIBrand${i % 5}`,
        status: 'active',
        visibility: 'public',
        createdBy: testCategory.createdBy
      }));

      await Product.insertMany(products);
    });

    it('should respond to product listing within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products?page=1&limit=20')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 500ms
      expect(responseTime).toBeLessThan(500);
      expect(response.body.data.products).toHaveLength(20);
    });

    it('should handle search queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products/search?q=API')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 800ms
      expect(responseTime).toBeLessThan(800);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should handle filtered queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products?brand=APIBrand1&minPrice=150&maxPrice=200&sort=price_asc')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 600ms
      expect(responseTime).toBeLessThan(600);
      expect(response.body.success).toBe(true);
    });

    it('should handle individual product requests efficiently', async () => {
      const product = await Product.findOne();
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/products/${product._id}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 200ms
      expect(responseTime).toBeLessThan(200);
      expect(response.body.data.product._id).toBe(product._id.toString());
    });
  });

  describe('Concurrent User Load Tests', () => {
    it('should handle multiple concurrent API requests', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();

      // Create concurrent API requests
      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        const requestType = i % 4;
        
        switch (requestType) {
          case 0:
            return request(app).get('/api/products?page=1&limit=10');
          case 1:
            return request(app).get('/api/products/search?q=test');
          case 2:
            return request(app).get(`/api/products/category/${testCategory._id}`);
          case 3:
            return request(app).get('/api/products/featured');
          default:
            return request(app).get('/api/products');
        }
      });

      const results = await Promise.allSettled(requests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
      
      // Most requests should succeed
      const successfulRequests = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      expect(successfulRequests.length).toBeGreaterThan(concurrentRequests * 0.9);
    });

    it('should handle concurrent user authentication', async () => {
      const concurrentUsers = 10;
      
      // Create test users
      const users = await Promise.all(
        Array.from({ length: concurrentUsers }, async (_, i) => {
          return User.create({
            firstName: `User${i}`,
            lastName: 'Test',
            email: `loadtest${i}@example.com`,
            password: await bcrypt.hash('password123', 12),
            isEmailVerified: true
          });
        })
      );

      const startTime = Date.now();

      // Concurrent login requests
      const loginRequests = users.map(user =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'password123'
          })
      );

      const results = await Promise.allSettled(loginRequests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
      
      // All logins should succeed
      const successfulLogins = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 200
      );
      expect(successfulLogins.length).toBe(concurrentUsers);
    });

    it('should handle concurrent product creation', async () => {
      const concurrentCreations = 10;
      const startTime = Date.now();

      // Concurrent product creation requests
      const createRequests = Array.from({ length: concurrentCreations }, (_, i) =>
        request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Concurrent Product ${i}`,
            description: `Description ${i}`,
            price: 100 + i,
            category: testCategory._id,
            brand: 'ConcurrentBrand'
          })
      );

      const results = await Promise.allSettled(createRequests);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
      
      // Most creations should succeed
      const successfulCreations = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 201
      );
      expect(successfulCreations.length).toBeGreaterThan(concurrentCreations * 0.8);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks during heavy operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        const products = Array.from({ length: 100 }, (_, j) => ({
          name: `Memory Test Product ${i}-${j}`,
          slug: `memory-test-${i}-${j}`,
          description: `Description ${i}-${j}`,
          price: 100 + j,
          category: testCategory._id,
          brand: 'MemoryTestBrand',
          status: 'active',
          visibility: 'public',
          createdBy: testCategory.createdBy
        }));

        await Product.insertMany(products);
        
        // Query the products
        await Product.find({ brand: 'MemoryTestBrand' }).limit(50);
        
        // Clean up
        await Product.deleteMany({ brand: 'MemoryTestBrand' });
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large response payloads efficiently', async () => {
      // Create products with large descriptions
      const products = Array.from({ length: 50 }, (_, i) => ({
        name: `Large Product ${i}`,
        slug: `large-product-${i}`,
        description: 'A'.repeat(1000), // 1KB description
        price: 100 + i,
        category: testCategory._id,
        brand: 'LargeBrand',
        status: 'active',
        visibility: 'public',
        createdBy: testCategory.createdBy,
        specifications: Array.from({ length: 20 }, (_, j) => ({
          name: `Spec ${j}`,
          value: `Value ${j}`.repeat(10),
          category: 'general'
        }))
      }));

      await Product.insertMany(products);

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/products?brand=LargeBrand&limit=50')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should handle large payload within 1 second
      expect(responseTime).toBeLessThan(1000);
      expect(response.body.data.products).toHaveLength(50);
      
      // Check response size is reasonable
      const responseSize = JSON.stringify(response.body).length;
      expect(responseSize).toBeGreaterThan(0);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const iterations = 50;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/products?page=1&limit=10')
          .expect(200);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      // Performance should remain consistent
      expect(avgResponseTime).toBeLessThan(300);
      expect(maxResponseTime).toBeLessThan(1000);
      expect(minResponseTime).toBeGreaterThan(0);
      
      // Response time variance should be reasonable
      const variance = responseTimes.reduce((acc, time) => {
        return acc + Math.pow(time - avgResponseTime, 2);
      }, 0) / responseTimes.length;
      
      const standardDeviation = Math.sqrt(variance);
      expect(standardDeviation).toBeLessThan(avgResponseTime * 0.5);
    });

    it('should handle error conditions gracefully under load', async () => {
      const concurrentErrorRequests = 20;
      
      // Make concurrent requests to non-existent resources
      const errorRequests = Array.from({ length: concurrentErrorRequests }, (_, i) =>
        request(app)
          .get(`/api/products/nonexistent-${i}`)
          .expect(404)
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(errorRequests);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;

      // Should handle errors quickly
      expect(totalTime).toBeLessThan(2000);
      
      // All requests should return 404
      const errorResponses = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 404
      );
      expect(errorResponses.length).toBe(concurrentErrorRequests);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with data size', async () => {
      const dataSizes = [100, 500, 1000];
      const responseTimes = [];

      for (const size of dataSizes) {
        // Clear existing data
        await Product.deleteMany({});
        
        // Create data of specified size
        const products = Array.from({ length: size }, (_, i) => ({
          name: `Scale Product ${i}`,
          slug: `scale-product-${i}`,
          description: `Description ${i}`,
          price: 100 + i,
          category: testCategory._id,
          brand: `ScaleBrand${i % 10}`,
          status: 'active',
          visibility: 'public',
          createdBy: testCategory.createdBy
        }));

        await Product.insertMany(products);

        // Measure query performance
        const startTime = Date.now();
        
        await request(app)
          .get('/api/products?page=1&limit=20')
          .expect(200);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Response time should not increase dramatically with data size
      const timeIncrease = responseTimes[2] - responseTimes[0];
      expect(timeIncrease).toBeLessThan(responseTimes[0] * 2); // Should not double
    });

    it('should handle pagination efficiently with large datasets', async () => {
      // Create large dataset
      const products = Array.from({ length: 2000 }, (_, i) => ({
        name: `Pagination Product ${i}`,
        slug: `pagination-product-${i}`,
        description: `Description ${i}`,
        price: 100 + i,
        category: testCategory._id,
        brand: 'PaginationBrand',
        status: 'active',
        visibility: 'public',
        createdBy: testCategory.createdBy
      }));

      await Product.insertMany(products);

      // Test different page numbers
      const pageTests = [1, 10, 50, 100];
      
      for (const page of pageTests) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/api/products?page=${page}&limit=20`)
          .expect(200);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Each page should load within reasonable time
        expect(responseTime).toBeLessThan(500);
        expect(response.body.data.products).toHaveLength(20);
        expect(response.body.data.pagination.currentPage).toBe(page);
      }
    });
  });
});