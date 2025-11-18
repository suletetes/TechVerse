import { jest } from '@jest/globals';
import { wishlistController } from '../../../src/controllers/wishlistController.js';
import { Wishlist, Product, User } from '../../../src/models/index.js';

// Mock the models
jest.mock('../../../src/models/index.js');

describe('Wishlist Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { _id: 'user123' },
      body: {},
      params: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getWishlist', () => {
    it('should return user wishlist successfully', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'Test Product',
              price: 99.99,
              images: [{ url: 'test.jpg', isPrimary: true }],
              status: 'active'
            },
            addedAt: new Date()
          }
        ]
      };

      Wishlist.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockWishlist)
      });

      await wishlistController.getWishlist(mockReq, mockRes, mockNext);

      expect(Wishlist.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { wishlist: mockWishlist }
      });
    });

    it('should return empty wishlist for new user', async () => {
      Wishlist.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await wishlistController.getWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          wishlist: {
            items: [],
            itemCount: 0
          }
        }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Wishlist.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      await wishlistController.getWishlist(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addToWishlist', () => {
    beforeEach(() => {
      mockReq.body = {
        productId: 'product123'
      };
    });

    it('should add product to wishlist successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active'
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [{
            product: mockProduct,
            addedAt: new Date()
          }]
        })
      };

      Product.findById.mockResolvedValue(mockProduct);
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.addToWishlist(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(Wishlist.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await wishlistController.addToWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should reject if product already in wishlist', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        status: 'active'
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [{ product: 'product123' }]
      };

      Product.findById.mockResolvedValue(mockProduct);
      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.addToWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product already in wishlist'
      });
    });

    it('should create new wishlist if user has none', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        status: 'active'
      };

      Wishlist.findOne.mockResolvedValue(null);
      Wishlist.prototype.save = jest.fn().mockResolvedValue(true);
      Wishlist.prototype.populate = jest.fn().mockResolvedValue({
        items: [{
          product: mockProduct,
          addedAt: new Date()
        }]
      });

      Product.findById.mockResolvedValue(mockProduct);

      await wishlistController.addToWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('removeFromWishlist', () => {
    beforeEach(() => {
      mockReq.params.productId = 'product123';
    });

    it('should remove product from wishlist successfully', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [{ product: 'product123' }],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: []
        })
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.removeFromWishlist(mockReq, mockRes, mockNext);

      expect(mockWishlist.items).toHaveLength(0);
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if product not in wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: []
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.removeFromWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found in wishlist'
      });
    });

    it('should handle missing wishlist', async () => {
      Wishlist.findOne.mockResolvedValue(null);

      await wishlistController.removeFromWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Wishlist not found'
      });
    });
  });

  describe('clearWishlist', () => {
    it('should clear all items from wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [
          { product: 'product1' },
          { product: 'product2' }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.clearWishlist(mockReq, mockRes, mockNext);

      expect(mockWishlist.items).toHaveLength(0);
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Wishlist cleared successfully'
      });
    });

    it('should handle empty wishlist gracefully', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.clearWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('moveToCart', () => {
    beforeEach(() => {
      mockReq.params.productId = 'product123';
    });

    it('should move product from wishlist to cart successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active',
        stock: { quantity: 10, trackQuantity: true }
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [{ product: 'product123' }],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockResolvedValue(mockProduct);
      Wishlist.findOne.mockResolvedValue(mockWishlist);
      
      // Mock Cart model
      const Cart = { findOne: jest.fn().mockResolvedValue(mockCart) };
      jest.doMock('../../../src/models/index.js', () => ({
        ...jest.requireActual('../../../src/models/index.js'),
        Cart
      }));

      await wishlistController.moveToCart(mockReq, mockRes, mockNext);

      expect(mockWishlist.items).toHaveLength(0);
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if product not in wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: []
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.moveToCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found in wishlist'
      });
    });
  });

  describe('checkWishlistStatus', () => {
    beforeEach(() => {
      mockReq.params.productId = 'product123';
    });

    it('should return true if product is in wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [{ product: 'product123' }]
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.checkWishlistStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { inWishlist: true }
      });
    });

    it('should return false if product is not in wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: []
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.checkWishlistStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { inWishlist: false }
      });
    });

    it('should return false if user has no wishlist', async () => {
      Wishlist.findOne.mockResolvedValue(null);

      await wishlistController.checkWishlistStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { inWishlist: false }
      });
    });
  });

  describe('getWishlistSummary', () => {
    it('should return wishlist summary', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [
          { product: 'product1' },
          { product: 'product2' },
          { product: 'product3' }
        ]
      };

      Wishlist.findOne.mockResolvedValue(mockWishlist);

      await wishlistController.getWishlistSummary(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          itemCount: 3,
          hasItems: true
        }
      });
    });

    it('should return empty summary for no wishlist', async () => {
      Wishlist.findOne.mockResolvedValue(null);

      await wishlistController.getWishlistSummary(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          itemCount: 0,
          hasItems: false
        }
      });
    });
  });
});