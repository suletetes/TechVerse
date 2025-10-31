import { jest } from '@jest/globals';
import { adminController } from '../../../src/controllers/adminController.js';
import { User, Product, Order, Category, Review } from '../../../src/models/index.js';

// Mock the models
jest.mock('../../../src/models/index.js');

describe('Admin Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { _id: 'admin123', role: 'admin' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics successfully', async () => {
      // Mock counts
      User.countDocuments.mockResolvedValue(150);
      Product.countDocuments.mockResolvedValue(75);
      Order.countDocuments.mockResolvedValue(200);
      
      // Mock revenue calculation
      Order.aggregate.mockResolvedValue([{ totalRevenue: 50000 }]);

      // Mock recent orders
      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            _id: 'order1',
            orderNumber: 'ORD-001',
            user: { firstName: 'John', lastName: 'Doe' },
            totalAmount: 299.99,
            status: 'completed'
          }
        ])
      });

      await adminController.getDashboard(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          overview: {
            totalUsers: 150,
            totalProducts: 75,
            totalOrders: 200,
            totalRevenue: 50000
          },
          recentOrders: expect.any(Array)
        }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.countDocuments.mockRejectedValue(error);

      await adminController.getDashboard(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUsers', () => {
    beforeEach(() => {
      mockReq.query = { page: '1', limit: '10' };
    });

    it('should return paginated users successfully', async () => {
      const mockUsers = [
        {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'user',
          accountStatus: 'active',
          createdAt: new Date()
        }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers)
      });

      User.countDocuments.mockResolvedValue(1);

      await adminController.getUsers(mockReq, mockRes, mockNext);

      expect(User.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            totalUsers: 1,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    });

    it('should search users by query', async () => {
      mockReq.query.search = 'john';

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      User.countDocuments.mockResolvedValue(0);

      await adminController.getUsers(mockReq, mockRes, mockNext);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { firstName: { $regex: 'john', $options: 'i' } },
          { lastName: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'john', $options: 'i' } }
        ]
      });
    });

    it('should filter users by role', async () => {
      mockReq.query.role = 'admin';

      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      User.countDocuments.mockResolvedValue(0);

      await adminController.getUsers(mockReq, mockRes, mockNext);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
    });
  });

  describe('getUserById', () => {
    beforeEach(() => {
      mockReq.params.userId = 'user123';
    });

    it('should return user details successfully', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
        accountStatus: 'active'
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await adminController.getUserById(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser }
      });
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await adminController.getUserById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('updateUserStatus', () => {
    beforeEach(() => {
      mockReq.params.userId = 'user123';
      mockReq.body = {
        status: 'suspended',
        reason: 'Violation of terms'
      };
    });

    it('should update user status successfully', async () => {
      const mockUser = {
        _id: 'user123',
        accountStatus: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockResolvedValue(mockUser);

      await adminController.updateUserStatus(mockReq, mockRes, mockNext);

      expect(mockUser.accountStatus).toBe('suspended');
      expect(mockUser.suspensionReason).toBe('Violation of terms');
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should prevent admin from modifying their own status', async () => {
      mockReq.params.userId = 'admin123'; // Same as req.user._id

      await adminController.updateUserStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot modify your own account status'
      });
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);

      await adminController.updateUserStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('getProducts', () => {
    beforeEach(() => {
      mockReq.query = { page: '1', limit: '10' };
    });

    it('should return paginated products successfully', async () => {
      const mockProducts = [
        {
          _id: 'product1',
          name: 'Test Product',
          price: 99.99,
          category: { name: 'Electronics' },
          status: 'active',
          stock: { quantity: 10 }
        }
      ];

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockProducts)
      });

      Product.countDocuments.mockResolvedValue(1);

      await adminController.getProducts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          products: mockProducts,
          pagination: expect.any(Object)
        }
      });
    });

    it('should search products by name', async () => {
      mockReq.query.search = 'laptop';

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Product.countDocuments.mockResolvedValue(0);

      await adminController.getProducts(mockReq, mockRes, mockNext);

      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'laptop', $options: 'i' } },
          { description: { $regex: 'laptop', $options: 'i' } },
          { brand: { $regex: 'laptop', $options: 'i' } }
        ]
      });
    });
  });

  describe('createProduct', () => {
    beforeEach(() => {
      mockReq.body = {
        name: 'New Product',
        description: 'A new test product',
        price: 199.99,
        category: 'category123',
        brand: 'TestBrand',
        status: 'active'
      };
    });

    it('should create product successfully', async () => {
      const mockCategory = {
        _id: 'category123',
        name: 'Electronics'
      };

      const mockProduct = {
        _id: 'product123',
        name: 'New Product',
        createdBy: 'admin123',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          category: mockCategory,
          createdBy: { firstName: 'Admin', lastName: 'User' }
        })
      };

      Category.findById.mockResolvedValue(mockCategory);
      Product.prototype.save = jest.fn().mockResolvedValue(mockProduct);
      Product.prototype.populate = jest.fn().mockResolvedValue(mockProduct);

      await adminController.createProduct(mockReq, mockRes, mockNext);

      expect(Category.findById).toHaveBeenCalledWith('category123');
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 if category not found', async () => {
      Category.findById.mockResolvedValue(null);

      await adminController.createProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found'
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = { name: 'Product' }; // Missing required fields

      await adminController.createProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      mockReq.params.productId = 'product123';
      mockReq.body = {
        name: 'Updated Product',
        price: 299.99
      };
    });

    it('should update product successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Original Product',
        price: 199.99,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          category: { name: 'Electronics' },
          updatedBy: { firstName: 'Admin', lastName: 'User' }
        })
      };

      Product.findById.mockResolvedValue(mockProduct);

      await adminController.updateProduct(mockReq, mockRes, mockNext);

      expect(mockProduct.name).toBe('Updated Product');
      expect(mockProduct.price).toBe(299.99);
      expect(mockProduct.updatedBy).toBe('admin123');
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await adminController.updateProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('deleteProduct', () => {
    beforeEach(() => {
      mockReq.params.productId = 'product123';
    });

    it('should soft delete product successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockResolvedValue(mockProduct);

      await adminController.deleteProduct(mockReq, mockRes, mockNext);

      expect(mockProduct.status).toBe('deleted');
      expect(mockProduct.deletedBy).toBe('admin123');
      expect(mockProduct.deletedAt).toBeInstanceOf(Date);
      expect(mockProduct.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await adminController.deleteProduct(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });
  });

  describe('getOrders', () => {
    beforeEach(() => {
      mockReq.query = { page: '1', limit: '10' };
    });

    it('should return paginated orders successfully', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          orderNumber: 'ORD-001',
          user: { firstName: 'John', lastName: 'Doe' },
          totalAmount: 299.99,
          status: 'completed',
          createdAt: new Date()
        }
      ];

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOrders)
      });

      Order.countDocuments.mockResolvedValue(1);

      await adminController.getOrders(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: mockOrders,
          pagination: expect.any(Object)
        }
      });
    });

    it('should filter orders by status', async () => {
      mockReq.query.status = 'pending';

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      });

      Order.countDocuments.mockResolvedValue(0);

      await adminController.getOrders(mockReq, mockRes, mockNext);

      expect(Order.find).toHaveBeenCalledWith({ status: 'pending' });
    });
  });

  describe('updateOrderStatus', () => {
    beforeEach(() => {
      mockReq.params.orderId = 'order123';
      mockReq.body = {
        status: 'shipped',
        trackingNumber: 'TRACK123'
      };
    });

    it('should update order status successfully', async () => {
      const mockOrder = {
        _id: 'order123',
        status: 'processing',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          user: { firstName: 'John', lastName: 'Doe' }
        })
      };

      Order.findById.mockResolvedValue(mockOrder);

      await adminController.updateOrderStatus(mockReq, mockRes, mockNext);

      expect(mockOrder.status).toBe('shipped');
      expect(mockOrder.trackingNumber).toBe('TRACK123');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if order not found', async () => {
      Order.findById.mockResolvedValue(null);

      await adminController.updateOrderStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found'
      });
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data successfully', async () => {
      // Mock sales data
      Order.aggregate.mockResolvedValueOnce([
        { _id: '2024-01', totalSales: 10000, orderCount: 50 },
        { _id: '2024-02', totalSales: 15000, orderCount: 75 }
      ]);

      // Mock top products
      Order.aggregate.mockResolvedValueOnce([
        { _id: 'product1', name: 'Product 1', totalSold: 100, revenue: 5000 }
      ]);

      // Mock user registrations
      User.aggregate.mockResolvedValue([
        { _id: '2024-01', count: 25 },
        { _id: '2024-02', count: 30 }
      ]);

      await adminController.getAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          salesData: expect.any(Array),
          topProducts: expect.any(Array),
          userRegistrations: expect.any(Array)
        }
      });
    });
  });
});