import { jest } from '@jest/globals';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../../../src/controllers/adminController.js';
import { Product } from '../../../src/models/index.js';

jest.mock('../../../src/models/index.js');

describe('AdminController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: 'admin123' },
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return paginated products list', async () => {
      const mockProducts = [
        { _id: 'product1', name: 'Product 1', price: 100 },
        { _id: 'product2', name: 'Product 2', price: 200 }
      ];

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockProducts)
      });

      Product.countDocuments.mockResolvedValue(2);

      await getAllProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Products retrieved successfully',
        data: {
          products: mockProducts,
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1,
            totalProducts: 2
          })
        }
      });
    });

    it('should handle search query', async () => {
      req.query = { search: 'laptop', page: 1, limit: 10 };

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      Product.countDocuments.mockResolvedValue(0);

      await getAllProducts(req, res, next);

      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'laptop', $options: 'i' } },
          { description: { $regex: 'laptop', $options: 'i' } },
          { sku: { $regex: 'laptop', $options: 'i' } }
        ]
      });
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      req.body = {
        name: 'New Product',
        description: 'Product description',
        price: 299.99,
        category: 'category123'
      };

      const mockProduct = {
        _id: 'product123',
        ...req.body,
        createdBy: 'admin123',
        populate: jest.fn().mockResolvedValue({
          _id: 'product123',
          ...req.body,
          category: { name: 'Electronics', slug: 'electronics' }
        })
      };

      Product.create.mockResolvedValue(mockProduct);

      await createProduct(req, res, next);

      expect(Product.create).toHaveBeenCalledWith({
        ...req.body,
        createdBy: 'admin123'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: { product: expect.any(Object) }
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      req.params = { id: 'product123' };
      req.body = {
        name: 'Updated Product',
        price: 399.99
      };

      const mockUpdatedProduct = {
        _id: 'product123',
        name: 'Updated Product',
        price: 399.99,
        updatedBy: 'admin123'
      };

      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedProduct)
      });

      await updateProduct(req, res, next);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'product123',
        { ...req.body, updatedBy: 'admin123' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle product not found', async () => {
      req.params = { id: 'nonexistent' };

      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await updateProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
          statusCode: 404
        })
      );
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product successfully', async () => {
      req.params = { id: 'product123' };

      const mockProduct = {
        _id: 'product123',
        name: 'Product to Delete',
        status: 'active',
        save: jest.fn().mockResolvedValue()
      };

      Product.findById.mockResolvedValue(mockProduct);

      await deleteProduct(req, res, next);

      expect(mockProduct.status).toBe('deleted');
      expect(mockProduct.deletedBy).toBe('admin123');
      expect(mockProduct.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle product not found for deletion', async () => {
      req.params = { id: 'nonexistent' };

      Product.findById.mockResolvedValue(null);

      await deleteProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
          statusCode: 404
        })
      );
    });
  });
});