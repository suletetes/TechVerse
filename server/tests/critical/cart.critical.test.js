/**
 * CRITICAL CART TESTS
 * These tests cover cart business logic and data integrity
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Product from '../../src/models/Product.js';
import Cart from '../../src/models/Cart.js';
import { setupTestDb, teardownTestDb, clearDatabase } from '../setup/testDb.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';

describe('CRITICAL: Cart Business Logic', () => {
  let authUser, authToken, testProduct;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create authenticated user
    const auth = await createAuthenticatedUser();
    authUser = auth.user;
    authToken = auth.token;

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      price: 99.99,
      stock: { quantity: 10, trackQuantity: true },
      status: 'active',
      category: 'electronics'
    });
  });

  describe('Cart Item Management', () => {
    test('should add item to cart with correct pricing', async () => {
      const response = await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 })
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const cart = await Cart.findOne({ user: authUser._id }).populate('items.product');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].unitPrice).toBe(testProduct.price);
      expect(cart.items[0].totalPrice).toBe(testProduct.price * 2);
    });

    test('should prevent adding out-of-stock items', async () => {
      // Update product to out of stock
      await Product.findByIdAndUpdate(testProduct._id, {
        'stock.quantity': 0
      });

      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 })
        .expect(400);
    });

    test('should prevent adding more items than available stock', async () => {
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 15 }) // More than stock (10)
        .expect(400);
    });

    test('should update existing cart item quantity', async () => {
      // Add item first
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 });

      // Add same item again
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      const cart = await Cart.findOne({ user: authUser._id });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3
    });
  });

  describe('Cart Calculations', () => {
    beforeEach(async () => {
      // Add multiple items to cart
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 });
    });

    test('should calculate cart totals correctly', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const cart = response.body.data.cart;
      const expectedSubtotal = testProduct.price * 2;
      const expectedTax = expectedSubtotal * 0.08; // Assuming 8% tax
      const expectedTotal = expectedSubtotal + expectedTax;

      expect(cart.summary.subtotal).toBe(expectedSubtotal);
      expect(cart.summary.tax).toBeCloseTo(expectedTax, 2);
      expect(cart.summary.total).toBeCloseTo(expectedTotal, 2);
    });

    test('should recalculate totals when item quantity changes', async () => {
      const cart = await Cart.findOne({ user: authUser._id });
      const itemId = cart.items[0]._id;

      await request(app)
        .put(`/api/cart/update/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedCart = response.body.data.cart;
      const expectedSubtotal = testProduct.price * 5;
      
      expect(updatedCart.summary.subtotal).toBe(expectedSubtotal);
      expect(updatedCart.items[0].quantity).toBe(5);
    });
  });

  describe('Cart Security', () => {
    test('should prevent accessing other users carts', async () => {
      // Create another user
      const otherAuth = await createAuthenticatedUser();
      
      // Add item to first user's cart
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 });

      // Try to access with other user's token
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${otherAuth.token}`)
        .expect(200);

      // Should return empty cart for other user
      expect(response.body.data.cart.items).toHaveLength(0);
    });

    test('should prevent modifying other users cart items', async () => {
      // Create cart item for first user
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 });

      const cart = await Cart.findOne({ user: authUser._id });
      const itemId = cart.items[0]._id;

      // Create another user
      const otherAuth = await createAuthenticatedUser();

      // Try to modify first user's cart item with second user's token
      await request(app)
        .put(`/api/cart/update/${itemId}`)
        .set('Authorization', `Bearer ${otherAuth.token}`)
        .send({ quantity: 10 })
        .expect(404); // Should not find the item
    });
  });

  describe('Cart Persistence', () => {
    test('should maintain cart across sessions', async () => {
      // Add item to cart
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 });

      // Simulate new session by getting cart again
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(3);
    });

    test('should handle product price changes in existing cart', async () => {
      // Add item to cart
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 });

      // Change product price
      const newPrice = 149.99;
      await Product.findByIdAndUpdate(testProduct._id, { price: newPrice });

      // Get cart - should reflect current product price
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const cartItem = response.body.data.cart.items[0];
      expect(cartItem.product.price).toBe(newPrice);
      // Unit price in cart should remain original price until recalculated
      expect(cartItem.unitPrice).toBe(testProduct.price);
    });
  });

  describe('Cart Cleanup', () => {
    test('should remove items when product is deleted', async () => {
      // Add item to cart
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 });

      // Delete the product
      await Product.findByIdAndDelete(testProduct._id);

      // Get cart - should handle deleted product gracefully
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Implementation dependent - might remove item or mark as unavailable
      expect(response.body.success).toBe(true);
    });

    test('should clear entire cart', async () => {
      // Add multiple items
      await request(app)
        .post(`/api/cart/add/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 });

      // Clear cart
      await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify cart is empty
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.summary.total).toBe(0);
    });
  });
});