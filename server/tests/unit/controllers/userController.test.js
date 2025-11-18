import { jest } from '@jest/globals';
import { getUserProfile, updateUserProfile, addToCart, getCart } from '../../../src/controllers/userController.js';
import { User, Product, Cart } from '../../../src/models/index.js';

// Mock the models
jest.mock('../../../src/models/index.js');

describe('UserController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: 'user123' },
      body: {},
      params: {}
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

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser)
        })
      });

      await getUserProfile(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: mockUser }
      });
    });

    it('should handle user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null)
        })
      });

      await getUserProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404
        })
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const mockUpdatedUser = {
        _id: 'user123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'john@example.com'
      };

      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });

      await updateUserProfile(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { firstName: 'Jane', lastName: 'Smith' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: { user: mockUpdatedUser }
      });
    });

    it('should handle no valid fields provided', async () => {
      req.body = {};

      await updateUserProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No valid fields provided for update',
          statusCode: 400
        })
      );
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      req.body = {
        productId: 'product123',
        quantity: 2
      };

      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 100,
        stock: { quantity: 10 },
        cleanExpiredReservations: jest.fn().mockResolvedValue()
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(),
        populate: jest.fn().mockResolvedValue()
      };

      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockCart);

      await addToCart(req, res, next);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(mockProduct.cleanExpiredReservations).toHaveBeenCalled();
      expect(mockCart.items).toHaveLength(1);
      expect(mockCart.items[0]).toEqual({
        product: 'product123',
        quantity: 2,
        price: 100
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle insufficient stock', async () => {
      req.body = {
        productId: 'product123',
        quantity: 15
      };

      const mockProduct = {
        _id: 'product123',
        stock: { quantity: 5 },
        cleanExpiredReservations: jest.fn().mockResolvedValue()
      };

      Product.findById.mockResolvedValue(mockProduct);

      await addToCart(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient stock',
          statusCode: 400
        })
      );
    });
  });

  describe('getCart', () => {
    it('should return existing cart', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          {
            product: 'product123',
            quantity: 2,
            price: 100
          }
        ]
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await getCart(req, res, next);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart retrieved successfully',
        data: { cart: mockCart }
      });
    });

    it('should create new cart if none exists', async () => {
      const mockNewCart = {
        _id: 'cart123',
        user: 'user123',
        items: []
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Cart.create.mockResolvedValue(mockNewCart);

      await getCart(req, res, next);

      expect(Cart.create).toHaveBeenCalledWith({
        user: 'user123',
        items: []
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});