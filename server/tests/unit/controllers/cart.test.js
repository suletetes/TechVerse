import { jest } from '@jest/globals';
import { cartController } from '../../../src/controllers/cartController.js';
import { Cart, Product, User } from '../../../src/models/index.js';

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
    it('should return user cart successfully', async () => {
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
              images: [{ url: 'test.jpg', isPrimary: true }]
            },
            quantity: 2,
            price: 99.99
          }
        ],
        subtotal: 199.98,
        total: 199.98
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.getCart(mockReq, mockRes, mockNext);

      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { cart: mockCart }
      });
    });

    it('should return empty cart for new user', async () => {
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await cartController.getCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: {
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0
          }
        }
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      await cartController.getCart(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addToCart', () => {
    beforeEach(() => {
      mockReq.body = {
        productId: 'product123',
        quantity: 2,
        variantId: 'variant123'
      };
    });

    it('should add new item to cart successfully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active',
        stock: { quantity: 10, trackQuantity: true },
        variants: [{ _id: 'variant123', price: 99.99 }]
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
            price: 99.99,
            variant: { _id: 'variant123' }
          }],
          subtotal: 199.98,
          total: 199.98
        })
      };

      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.addToCart(mockReq, mockRes, mockNext);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(Cart.findOne).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should update quantity if item already exists', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active',
        stock: { quantity: 10, trackQuantity: true }
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
          items: [{ ...existingItem, quantity: 3 }],
          subtotal: 299.97,
          total: 299.97
        })
      };

      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.addToCart(mockReq, mockRes, mockNext);

      expect(existingItem.quantity).toBe(3);
      expect(mockCart.save).toHaveBeenCalled();
    });

    it('should reject if product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await cartController.addToCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found'
      });
    });

    it('should reject if product is out of stock', async () => {
      const mockProduct = {
        _id: 'product123',
        status: 'active',
        stock: { quantity: 0, trackQuantity: true }
      };

      Product.findById.mockResolvedValue(mockProduct);

      await cartController.addToCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product is out of stock'
      });
    });

    it('should reject if insufficient stock', async () => {
      const mockProduct = {
        _id: 'product123',
        status: 'active',
        stock: { quantity: 1, trackQuantity: true }
      };

      Product.findById.mockResolvedValue(mockProduct);

      await cartController.addToCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient stock. Only 1 items available'
      });
    });

    it('should create new cart if user has no cart', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 99.99,
        status: 'active',
        stock: { quantity: 10, trackQuantity: true }
      };

      Cart.findOne.mockResolvedValue(null);
      Cart.prototype.save = jest.fn().mockResolvedValue(true);
      Cart.prototype.populate = jest.fn().mockResolvedValue({
        items: [{
          product: mockProduct,
          quantity: 2,
          price: 99.99
        }],
        subtotal: 199.98,
        total: 199.98
      });

      Product.findById.mockResolvedValue(mockProduct);

      await cartController.addToCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateCartItem', () => {
    beforeEach(() => {
      mockReq.params.itemId = 'item123';
      mockReq.body.quantity = 3;
    });

    it('should update cart item quantity successfully', async () => {
      const mockItem = {
        _id: 'item123',
        product: 'product123',
        quantity: 2,
        price: 99.99
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [mockItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [{ ...mockItem, quantity: 3 }],
          subtotal: 299.97,
          total: 299.97
        })
      };

      const mockProduct = {
        _id: 'product123',
        stock: { quantity: 10, trackQuantity: true }
      };

      Cart.findOne.mockResolvedValue(mockCart);
      Product.findById.mockResolvedValue(mockProduct);

      await cartController.updateCartItem(mockReq, mockRes, mockNext);

      expect(mockItem.quantity).toBe(3);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should remove item when quantity is 0', async () => {
      mockReq.body.quantity = 0;

      const mockItem = {
        _id: 'item123',
        product: 'product123',
        quantity: 2
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [mockItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [],
          subtotal: 0,
          total: 0
        })
      };

      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.updateCartItem(mockReq, mockRes, mockNext);

      expect(mockCart.items).toHaveLength(0);
      expect(mockCart.save).toHaveBeenCalled();
    });

    it('should return 404 if cart item not found', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: []
      };

      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.updateCartItem(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cart item not found'
      });
    });
  });

  describe('removeFromCart', () => {
    beforeEach(() => {
      mockReq.params.itemId = 'item123';
    });

    it('should remove item from cart successfully', async () => {
      const mockItem = {
        _id: 'item123',
        product: 'product123',
        quantity: 2
      };

      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [mockItem],
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          items: [],
          subtotal: 0,
          total: 0
        })
      };

      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.removeFromCart(mockReq, mockRes, mockNext);

      expect(mockCart.items).toHaveLength(0);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if cart item not found', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: []
      };

      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.removeFromCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cart item not found'
      });
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

      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.clearCart(mockReq, mockRes, mockNext);

      expect(mockCart.items).toHaveLength(0);
      expect(mockCart.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart cleared successfully'
      });
    });

    it('should handle empty cart gracefully', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(mockCart);

      await cartController.clearCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('validateCart', () => {
    it('should validate cart successfully', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              status: 'active',
              stock: { quantity: 10, trackQuantity: true }
            },
            quantity: 2
          }
        ]
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.validateCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          valid: true,
          issues: []
        }
      });
    });

    it('should identify stock issues', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'Test Product',
              status: 'active',
              stock: { quantity: 1, trackQuantity: true }
            },
            quantity: 2
          }
        ]
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.validateCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          valid: false,
          issues: [{
            type: 'insufficient_stock',
            itemId: 'item1',
            productId: 'product1',
            productName: 'Test Product',
            requested: 2,
            available: 1,
            message: 'Insufficient stock for Test Product. Requested: 2, Available: 1'
          }]
        }
      });
    });

    it('should identify unavailable products', async () => {
      const mockCart = {
        _id: 'cart123',
        user: 'user123',
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'Test Product',
              status: 'inactive'
            },
            quantity: 1
          }
        ]
      };

      Cart.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCart)
      });

      await cartController.validateCart(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          valid: false,
          issues: [{
            type: 'product_unavailable',
            itemId: 'item1',
            productId: 'product1',
            productName: 'Test Product',
            message: 'Product Test Product is no longer available'
          }]
        }
      });
    });
  });
});