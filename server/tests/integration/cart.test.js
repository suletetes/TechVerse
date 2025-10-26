import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { User, Product, Cart, Category } from '../../src/models/index.js';

describe('Cart Integration Tests', () => {
  let authToken;
  let testUser;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/techverse_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Category.deleteMany({});

    // Create test category
    testCategory = new Category({
      name: 'Electronics',
      slug: 'electronics',
      isActive: true
    });
    await testCategory.save();

    // Create test user
    testUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      isEmailVerified: true
    });
    await testUser.save();

    // Create test product
    testProduct = new Product({
      name: 'Test Laptop',
      description: 'A test laptop for integration testing',
      price: 999.99,
      category: testCategory._id,
      brand: 'TestBrand',
      createdBy: testUser._id,
      status: 'active',
      visibility: 'public',
      stock: {
        quantity: 10,
        trackQuantity: true
      }
    });
    await testProduct.save();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'Password123!'
      });

    authToken = loginResponse.body.data.tokens.accessToken;
  });

  describe('GET /api/users/cart', () => {
    it('should return empty cart for new user', async () => {
      const response = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/cart')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/cart', () => {
    it('should add item to cart successfully', async () => {
      const cartItem = {
        productId: testProduct._id.toString(),
        quantity: 2
      };

      const response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartItem)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.items[0].product._id).toBe(testProduct._id.toString());
    });

    it('should update quantity if item already in cart', async () => {
      const cartItem = {
        productId: testProduct._id.toString(),
        quantity: 1
      };

      // Add item first time
      await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartItem)
        .expect(200);

      // Add same item again
      const response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartItem)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
    });

    it('should reject adding item with insufficient stock', async () => {
      const cartItem = {
        productId: testProduct._id.toString(),
        quantity: 15 // More than available stock (10)
      };

      const response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject adding non-existent product', async () => {
      const cartItem = {
        productId: new mongoose.Types.ObjectId().toString(),
        quantity: 1
      };

      const response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cartItem)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Product not found');
    });

    it('should validate request data', async () => {
      const invalidCartItem = {
        productId: 'invalid-id',
        quantity: -1
      };

      const response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCartItem)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/cart/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item to cart first
      const addResponse = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2
        });

      cartItemId = addResponse.body.data.cart.items[0]._id;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .put(`/api/users/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items[0].quantity).toBe(5);
    });

    it('should reject update with insufficient stock', async () => {
      const response = await request(app)
        .put(`/api/users/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 15 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject update for non-existent cart item', async () => {
      const fakeItemId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .put(`/api/users/cart/${fakeItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cart item not found');
    });
  });

  describe('DELETE /api/users/cart/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item to cart first
      const addResponse = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2
        });

      cartItemId = addResponse.body.data.cart.items[0]._id;
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/users/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
    });

    it('should handle removing non-existent item gracefully', async () => {
      const fakeItemId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete(`/api/users/cart/${fakeItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/cart', () => {
    beforeEach(async () => {
      // Add items to cart
      await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2
        });
    });

    it('should clear entire cart', async () => {
      const response = await request(app)
        .delete('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
    });
  });

  describe('Cart Workflow Integration', () => {
    it('should handle complete cart workflow', async () => {
      // 1. Get empty cart
      let response = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);

      // 2. Add item to cart
      response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 3
        })
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      const itemId = response.body.data.cart.items[0]._id;

      // 3. Update item quantity
      response = await request(app)
        .put(`/api/users/cart/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.data.cart.items[0].quantity).toBe(5);

      // 4. Add another item (same product)
      response = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id.toString(),
          quantity: 2
        })
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].quantity).toBe(7); // 5 + 2

      // 5. Clear cart
      response = await request(app)
        .delete('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.cart.items).toHaveLength(0);
    });
  });
});