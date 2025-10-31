import { jest } from '@jest/globals';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  checkWishlistStatus,
  getWishlistSummary
} from '../../../src/controllers/wishlistController.js';
import { Wishlist, Product, Cart } from '../../../src/models/index.js';

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
    it('should return user wishlist with populated products', async () => {
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
              images: [{ url: 'test.jpg' }]
            },
            addedAt: new Date(),
            priceWhenAdded: 99.99,
            notes: 'Want this for gaming'
          }
        ]
      };

      Wishlist.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockWishlist)
      });

      await getWishlist(mockReq, mockRes, mockNext);

      expect(Wishlist.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: { wishlist: mockWishlist }
      });
    });

    it('should return empty wishlist if none exists', async () => {
      Wishlist.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Wishlist retrieved successfully',
        data: {
          wishlist: {
            items: []
          }
        }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Wishlist.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      await getWishlist(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addToWishlist', () => {
    beforeEach(() => {
      mockReq.body = {
        productId: 'product123',
        notes: 'Want this for gaming'
      };
    });

    it('should add new item to wishlist', async () => {
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
            addedAt: expect.any(Date),
            priceWhenAdded: 99.99,
            notes: 'Want this for gaming'
          }]
        })
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await addToWishlist(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Item added to wishlist successfully'
        })
      );
    });

    it('should create new wishlist if none exists', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active'
      };

      const mockNewWishlist = {
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [{
            product: mockProduct,
            addedAt: expect.any(Date),
            priceWhenAdded: 99.99,
            notes: 'Want this for gaming'
          }]
        })
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Wishlist.findOne = jest.fn().mockResolvedValue(null);
      Wishlist.mockImplementation(() => mockNewWishlist);

      await addToWishlist(mockReq, mockRes, mockNext);

      expect(mockNewWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if product not found', async () => {
      Product.findById = jest.fn().mockResolvedValue(null);

      await addToWishlist(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
          statusCode: 404
        })
      );
    });

    it('should reject if product already in wishlist', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active'
      };

      const existingItem = {
        product: 'product123',
        addedAt: new Date(),
        priceWhenAdded: 99.99
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [existingItem]
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await addToWishlist(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product already in wishlist',
          statusCode: 400
        })
      );
    });
  });

  describe('removeFromWishlist', () => {
    beforeEach(() => {
      mockReq.params = { productId: 'product123' };
    });

    it('should remove item from wishlist', async () => {
      const wishlistItem = {
        product: 'product123',
        addedAt: new Date(),
        priceWhenAdded: 99.99
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [wishlistItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: []
        })
      };

      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await removeFromWishlist(mockReq, mockRes, mockNext);

      expect(mockWishlist.items).toHaveLength(0);
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle item not found gracefully', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: []
      };

      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await removeFromWishlist(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found in wishlist',
          statusCode: 404
        })
      );
    });
  });

  describe('clearWishlist', () => {
    it('should clear all items from wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [
          { product: 'product1', addedAt: new Date() },
          { product: 'product2', addedAt: new Date() }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await clearWishlist(mockReq, mockRes, mockNext);

      expect(mockWishlist.items).toHaveLength(0);
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Wishlist cleared successfully'
      });
    });

    it('should handle empty wishlist gracefully', async () => {
      Wishlist.findOne = jest.fn().mockResolvedValue(null);

      await clearWishlist(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Wishlist cleared successfully'
      });
    });
  });

  describe('moveToCart', () => {
    beforeEach(() => {
      mockReq.params = { productId: 'product123' };
      mockReq.body = { quantity: 2 };
    });

    it('should move item from wishlist to cart', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        stock: { quantity: 10, trackQuantity: true },
        status: 'active'
      };

      const wishlistItem = {
        product: 'product123',
        addedAt: new Date(),
        priceWhenAdded: 99.99
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [wishlistItem],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [{
            product: mockProduct,
            quantity: 2,
            price: 99.99
          }]
        })
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);
      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await moveToCart(mockReq, mockRes, mockNext);

      expect(mockWishlist.items).toHaveLength(0);
      expect(mockWishlist.save).toHaveBeenCalled();
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle insufficient stock', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        stock: { quantity: 1, trackQuantity: true },
        status: 'active'
      };

      const wishlistItem = {
        product: 'product123',
        addedAt: new Date(),
        priceWhenAdded: 99.99
      };

      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [wishlistItem]
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await moveToCart(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient stock available',
          statusCode: 400
        })
      );
    });
  });

  describe('checkWishlistStatus', () => {
    beforeEach(() => {
      mockReq.params = { productId: 'product123' };
    });

    it('should return true if product is in wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [
          { product: 'product123', addedAt: new Date() }
        ]
      };

      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await checkWishlistStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          inWishlist: true,
          addedAt: expect.any(Date)
        }
      });
    });

    it('should return false if product is not in wishlist', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: []
      };

      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await checkWishlistStatus(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          inWishlist: false
        }
      });
    });
  });

  describe('getWishlistSummary', () => {
    it('should return wishlist item count', async () => {
      const mockWishlist = {
        _id: 'wishlist123',
        user: 'user123',
        items: [
          { product: 'product1', addedAt: new Date() },
          { product: 'product2', addedAt: new Date() },
          { product: 'product3', addedAt: new Date() }
        ]
      };

      Wishlist.findOne = jest.fn().mockResolvedValue(mockWishlist);

      await getWishlistSummary(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          itemCount: 3,
          hasItems: true
        }
      });
    });

    it('should return zero count for empty wishlist', async () => {
      Wishlist.findOne = jest.fn().mockResolvedValue(null);

      await getWishlistSummary(mockReq, mockRes, mockNext);

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