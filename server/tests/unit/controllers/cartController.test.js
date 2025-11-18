import { jest } from '@jest/globals';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart
} from '../../../src/controllers/cartController.js';
import { Cart, Product } from '../../../src/models/index.js';

// Mock the models
jest.mock('../../../src/models/index.js');

describe('Cart Controller Unit Tests', () => {
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

  describe('getCart', () => {
    it('should return user cart with populated products', async () => {
      const mockCart = {
        _id: 'cart123',
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
            quantity: 2,
            price: 99.99
          }
        ],
        subtotal: 199.98,
        total: 199.98
      };

      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await getCart(mockReq, mockRes, mockNext);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart retrieved successfully',
        data: { cart: mockCart }
      });
    });

    it('should return empty cart if no cart exists', async () => {
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart retrieved successfully',
        data: {
          cart: {
            items: [],
            subtotal: 0,
            total: 0
          }
        }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      await getCart(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addToCart', () => {
    beforeEach(() => {
      mockReq.body = {
        productId: 'product123',
        quantity: 2,
        variantOptions: { color: 'red', size: 'M' }
      };
    });

    it('should add new item to cart', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        stock: { quantity: 10, trackQuantity: true },
        status: 'active'
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
      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await addToCart(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Item added to cart successfully'
        })
      );
    });

    it('should create new cart if none exists', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        stock: { quantity: 10, trackQuantity: true },
        status: 'active'
      };

      const mockNewCart = {
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
      Cart.findOne = jest.fn().mockResolvedValue(null);
      Cart.mockImplementation(() => mockNewCart);

      await addToCart(mockReq, mockRes, mockNext);

      expect(mockNewCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if product not found', async () => {
      Product.findById = jest.fn().mockResolvedValue(null);

      await addToCart(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
          statusCode: 404
        })
      );
    });

    it('should reject if insufficient stock', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        stock: { quantity: 1, trackQuantity: true },
        status: 'active'
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      await addToCart(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient stock available',
          statusCode: 400
        })
      );
    });

    it('should update quantity if item already in cart', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        stock: { quantity: 10, trackQuantity: true },
        status: 'active'
      };

      const existingItem = {
        product: 'product123',
        quantity: 1,
        price: 99.99
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [existingItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [{
            product: mockProduct,
            quantity: 3,
            price: 99.99
          }]
        })
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await addToCart(mockReq, mockRes, mockNext);

      expect(existingItem.quantity).toBe(3);
      expect(mockCart.save).toHaveBeenCalled();
    });
  });

  describe('updateCartItem', () => {
    beforeEach(() => {
      mockReq.params = { itemId: 'item123' };
      mockReq.body = { quantity: 3 };
    });

    it('should update cart item quantity', async () => {
      const mockProduct = {
        _id: 'product123',
        stock: { quantity: 10, trackQuantity: true }
      };

      const cartItem = {
        _id: 'item123',
        product: mockProduct,
        quantity: 2,
        price: 99.99
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [cartItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [{ ...cartItem, quantity: 3 }]
        })
      };

      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await updateCartItem(mockReq, mockRes, mockNext);

      expect(cartItem.quantity).toBe(3);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should reject if cart item not found', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: []
      };

      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await updateCartItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cart item not found',
          statusCode: 404
        })
      );
    });

    it('should reject if insufficient stock for update', async () => {
      const mockProduct = {
        _id: 'product123',
        stock: { quantity: 2, trackQuantity: true }
      };

      const cartItem = {
        _id: 'item123',
        product: mockProduct,
        quantity: 1,
        price: 99.99
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [cartItem]
      };

      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await updateCartItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient stock available',
          statusCode: 400
        })
      );
    });
  });

  describe('removeFromCart', () => {
    beforeEach(() => {
      mockReq.params = { itemId: 'item123' };
    });

    it('should remove item from cart', async () => {
      const cartItem = {
        _id: 'item123',
        product: 'product123',
        quantity: 2
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [cartItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: []
        })
      };

      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await removeFromCart(mockReq, mockRes, mockNext);

      expect(mockCart.items).toHaveLength(0);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle item not found gracefully', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: []
      };

      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await removeFromCart(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cart item not found',
          statusCode: 404
        })
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          { _id: 'item1', product: 'product1', quantity: 2 },
          { _id: 'item2', product: 'product2', quantity: 1 }
        ],
        save: jest.fn().mockResolvedValue(true)
      };

      Cart.findOne = jest.fn().mockResolvedValue(mockCart);

      await clearCart(mockReq, mockRes, mockNext);

      expect(mockCart.items).toHaveLength(0);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart cleared successfully'
      });
    });

    it('should handle empty cart gracefully', async () => {
      Cart.findOne = jest.fn().mockResolvedValue(null);

      await clearCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart cleared successfully'
      });
    });
  });

  describe('validateCart', () => {
    it('should validate all cart items successfully', async () => {
      const mockProducts = [
        { _id: 'product1', stock: { quantity: 10, trackQuantity: true }, status: 'active' },
        { _id: 'product2', stock: { quantity: 5, trackQuantity: true }, status: 'active' }
      ];

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          { product: mockProducts[0], quantity: 2, price: 99.99 },
          { product: mockProducts[1], quantity: 1, price: 49.99 }
        ]
      };

      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await validateCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart validation completed',
        data: {
          valid: true,
          issues: [],
          cart: mockCart
        }
      });
    });

    it('should identify validation issues', async () => {
      const mockProducts = [
        { _id: 'product1', stock: { quantity: 1, trackQuantity: true }, status: 'active' },
        { _id: 'product2', stock: { quantity: 0, trackQuantity: true }, status: 'inactive' }
      ];

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          { _id: 'item1', product: mockProducts[0], quantity: 2, price: 99.99 },
          { _id: 'item2', product: mockProducts[1], quantity: 1, price: 49.99 }
        ]
      };

      Cart.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await validateCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart validation completed',
        data: {
          valid: false,
          issues: expect.arrayContaining([
            expect.objectContaining({
              type: 'insufficient_stock',
              itemId: 'item1'
            }),
            expect.objectContaining({
              type: 'product_unavailable',
              itemId: 'item2'
            })
          ]),
          cart: mockCart
        }
      });
    });
  });
});