import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { User, Product, Category, Cart } from '../../src/models/index.js';

describe('Cart Integration Tests', () => {
  let testUser;
  let authToken;
  let testCategory;
  let testProducts = [];

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/techverse_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Cart.deleteMany({});

    // Create test category
    testCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      isActive: true
    });

    // Create test products
    const productData = [
      {
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop',
        price: 1299.99,
        category: testCategory._id,
        brand: 'TechBrand',
        createdBy: new mongoose.Types.ObjectId(),
        status: 'active',
        visibility: 'public',
        stock: { quantity: 5, trackQuantity: true },
        images: [{ url: 'laptop1.jpg', isPrimary: true }]
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 49.99,
        category: testCategory._id,
        brand: 'TechBrand',
        createdBy: new mongoose.Types.ObjectId(),
        status: 'active',
        visibility: 'public',
        stock: { quantity: 20, trackQuantity: true },
        images: [{ url: 'mouse1.jpg', isPrimary: true }]
      },
      {
        name: 'Out of Stock Item',
        description: 'This item is out of stock',
        price: 99.99,
        category: testCategory._id,
        brand: 'TechBrand',
        createdBy: new mongoose.Types.ObjectId(),
        status: 'active',
        visibility: 'public',
        stock: { quantity: 0, trackQuantity: true },
        images: [{ url: 'item1.jpg', isPrimary: true }]
      }
    ];

    testProducts = await Product.insertMany(productData);

    // Create and authenticate test user
    testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      isEmailVerified: true
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  describe('GET /api/cart', () => {
    it('should return empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.subtotal).toBe(0);
      expect(response.body.data.cart.total).toBe(0);
    });

    it('should return cart with items', async () => {
      // First add items to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.items[0].product.name).toBe('Gaming Laptop');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/cart')
        .expect(401);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add new item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.items[0].product._id).toBe(testProducts[0]._id.toString());
    });

    it('should update quantity if item already in cart', async () => {
      // Add item first time
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 1
        });

      // Add same item again
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        })
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(3);
    });

    it('should reject invalid product ID', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: new mongoose.Types.ObjectId(),
          quantity: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should reject out of stock items', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[2]._id, // Out of stock item
          quantity: 1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('out of stock');
    });

    it('should reject quantity exceeding stock', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id, // Stock: 5
          quantity: 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 1
          // Missing productId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate quantity is positive', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 0
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/cart/update/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item to cart first
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        });

      cartItemId = addResponse.body.data.cart.items[0]._id;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/update/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items[0].quantity).toBe(3);
    });

    it('should reject invalid item ID', async () => {
      const response = await request(app)
        .put(`/api/cart/update/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 3
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart item not found');
    });

    it('should reject quantity exceeding stock', async () => {
      const response = await request(app)
        .put(`/api/cart/update/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 10 // Exceeds stock of 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/cart/update/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/cart/remove/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item to cart first
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        });

      cartItemId = addResponse.body.data.cart.items[0]._id;
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/remove/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
    });

    it('should handle non-existent item gracefully', async () => {
      const response = await request(app)
        .delete(`/api/cart/remove/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart item not found');
    });
  });

  describe('DELETE /api/cart/clear', () => {
    beforeEach(async () => {
      // Add multiple items to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        });

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[1]._id,
          quantity: 1
        });
    });

    it('should clear all items from cart', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleared');

      // Verify cart is empty
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cartResponse.body.data.cart.items).toHaveLength(0);
    });

    it('should handle empty cart gracefully', async () => {
      // Clear cart first
      await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`);

      // Try to clear again
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/cart/validate', () => {
    beforeEach(async () => {
      // Add items to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        });

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[1]._id,
          quantity: 1
        });
    });

    it('should validate cart successfully', async () => {
      const response = await request(app)
        .post('/api/cart/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.issues).toHaveLength(0);
    });

    it('should identify stock issues', async () => {
      // Reduce stock of first product to create issue
      await Product.findByIdAndUpdate(testProducts[0]._id, {
        'stock.quantity': 1
      });

      const response = await request(app)
        .post('/api/cart/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.issues).toHaveLength(1);
      expect(response.body.data.issues[0].type).toBe('insufficient_stock');
    });

    it('should identify unavailable products', async () => {
      // Make first product inactive
      await Product.findByIdAndUpdate(testProducts[0]._id, {
        status: 'inactive'
      });

      const response = await request(app)
        .post('/api/cart/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.issues).toHaveLength(1);
      expect(response.body.data.issues[0].type).toBe('product_unavailable');
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart across sessions', async () => {
      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id,
          quantity: 2
        });

      // Simulate new session by getting new token
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Password123!'
        });

      const newAuthToken = newLoginResponse.body.data.tokens.accessToken;

      // Check cart with new token
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${newAuthToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate subtotal and total correctly', async () => {
      // Add multiple items
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[0]._id, // $1299.99
          quantity: 2
        });

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProducts[1]._id, // $49.99
          quantity: 1
        });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const expectedSubtotal = (1299.99 * 2) + (49.99 * 1);
      expect(response.body.data.cart.subtotal).toBeCloseTo(expectedSubtotal, 2);
      expect(response.body.data.cart.total).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  describe('Concurrent Cart Operations', () => {
    it('should handle concurrent add operations safely', async () => {
      const promises = [];
      
      // Simulate multiple concurrent add operations
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .post('/api/cart/add')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              productId: testProducts[1]._id,
              quantity: 1
            })
        );
      }

      await Promise.all(promises);

      // Check final cart state
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(3);
    });
  });
});