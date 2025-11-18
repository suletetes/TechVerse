/**
 * Product Controller Unit Tests
 * Tests for product controller CRUD operations
 */

const productController = require('../../../src/controllers/productController');
const Product = require('../../../src/models/Product');
const { mockRequest, mockResponse, mockNext, createTestAdmin } = require('../../setup/helpers');
const { createProductFixture } = require('../../setup/fixtures');
const { clearDatabase } = require('../../setup/testDb');

describe('Product Controller', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      // Create test products
      await Product.create(createProductFixture({ name: 'Product 1' }));
      await Product.create(createProductFixture({ name: 'Product 2' }));

      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      await productController.getAllProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: expect.arrayContaining([
              expect.objectContaining({ name: 'Product 1' }),
              expect.objectContaining({ name: 'Product 2' })
            ])
          })
        })
      );
    });

    it('should filter products by category', async () => {
      await Product.create(createProductFixture({ name: 'Phone 1', category: 'Phones' }));
      await Product.create(createProductFixture({ name: 'Tablet 1', category: 'Tablets' }));

      const req = mockRequest({ query: { category: 'Phones' } });
      const res = mockResponse();
      const next = mockNext();

      await productController.getAllProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            products: expect.arrayContaining([
              expect.objectContaining({ category: 'Phones' })
            ])
          })
        })
      );
    });

    it('should support pagination', async () => {
      // Create 15 products
      for (let i = 0; i < 15; i++) {
        await Product.create(createProductFixture({ name: `Product ${i}` }));
      }

      const req = mockRequest({ query: { page: 1, limit: 10 } });
      const res = mockResponse();
      const next = mockNext();

      await productController.getAllProducts(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            products: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: 15
            })
          })
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const product = await Product.create(createProductFixture({ name: 'Test Product' }));

      const req = mockRequest({ params: { id: product._id.toString() } });
      const res = mockResponse();
      const next = mockNext();

      await productController.getProductById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'Test Product'
          })
        })
      );
    });

    it('should return 404 for non-existent product', async () => {
      const req = mockRequest({ params: { id: '507f1f77bcf86cd799439011' } });
      const res = mockResponse();
      const next = mockNext();

      await productController.getProductById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const admin = await createTestAdmin();
      const productData = createProductFixture({ name: 'New Product' });

      const req = mockRequest({
        body: productData,
        user: admin
      });
      const res = mockResponse();
      const next = mockNext();

      await productController.createProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'New Product'
          })
        })
      );

      const product = await Product.findOne({ name: 'New Product' });
      expect(product).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const admin = await createTestAdmin();

      const req = mockRequest({
        body: { name: 'Incomplete Product' }, // Missing required fields
        user: admin
      });
      const res = mockResponse();
      const next = mockNext();

      await productController.createProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateProduct', () => {
    it('should update existing product', async () => {
      const admin = await createTestAdmin();
      const product = await Product.create(createProductFixture({ name: 'Old Name' }));

      const req = mockRequest({
        params: { id: product._id.toString() },
        body: { name: 'New Name' },
        user: admin
      });
      const res = mockResponse();
      const next = mockNext();

      await productController.updateProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            name: 'New Name'
          })
        })
      );

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.name).toBe('New Name');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product', async () => {
      const admin = await createTestAdmin();
      const product = await Product.create(createProductFixture());

      const req = mockRequest({
        params: { id: product._id.toString() },
        user: admin
      });
      const res = mockResponse();
      const next = mockNext();

      await productController.deleteProduct(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('deleted')
        })
      );

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });
});
