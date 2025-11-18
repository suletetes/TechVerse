import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { User, Product, Category, Cart, Wishlist, Order } from '../../src/models/index.js';

describe('End-to-End User Workflow Tests', () => {
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
    await Wishlist.deleteMany({});
    await Order.deleteMany({});

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
        description: 'High-performance gaming laptop with RTX graphics',
        price: 1299.99,
        comparePrice: 1499.99,
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
        description: 'Ergonomic wireless mouse with precision tracking',
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
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with blue switches',
        price: 129.99,
        category: testCategory._id,
        brand: 'TechBrand',
        createdBy: new mongoose.Types.ObjectId(),
        status: 'active',
        visibility: 'public',
        stock: { quantity: 10, trackQuantity: true },
        images: [{ url: 'keyboard1.jpg', isPrimary: true }]
      }
    ];

    testProducts = await Product.insertMany(productData);
  });

  describe('Complete User Journey: Registration to Purchase', () => {
    it('should complete full user workflow from registration to order', async () => {
      // Step 1: User Registration
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      
      const authToken = registerResponse.body.data.tokens.accessToken;
      const userId = registerResponse.body.data.user._id;

      // Step 2: Browse Products
      const productsResponse = await request(app)
        .get('/api/products')
        .expect(200);

      expect(productsResponse.body.success).toBe(true);
      expect(productsResponse.body.data.products).toHaveLength(3);

      // Step 3: Search for specific product
      const searchResponse = await request(app)
        .get('/api/search/products?q=gaming')
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.products).toHaveLength(1);
      expect(searchResponse.body.data.products[0].name).toContain('Gaming');

      // Step 4: View product details
      const laptopId = testProducts[0]._id;
      const productResponse = await request(app)
        .get(`/api/products/${laptopId}`)
        .expect(200);

      expect(productResponse.body.success).toBe(true);
      expect(productResponse.body.data.product.name).toBe('Gaming Laptop');

      // Step 5: Add product to wishlist
      const wishlistResponse = await request(app)
        .post(`/api/users/wishlist/${laptopId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Want this for gaming' })
        .expect(200);

      expect(wishlistResponse.body.success).toBe(true);
      expect(wishlistResponse.body.data.wishlist.items).toHaveLength(1);

      // Step 6: Add products to cart
      const mouseId = testProducts[1]._id;
      const keyboardId = testProducts[2]._id;

      // Add laptop to cart
      await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: laptopId, quantity: 1 })
        .expect(200);

      // Add mouse to cart
      await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: mouseId, quantity: 2 })
        .expect(200);

      // Add keyboard to cart
      const cartResponse = await request(app)
        .post('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: keyboardId, quantity: 1 })
        .expect(200);

      expect(cartResponse.body.data.cart.items).toHaveLength(3);

      // Step 7: Update cart item quantity
      const cartItems = cartResponse.body.data.cart.items;
      const mouseCartItem = cartItems.find(item => 
        item.product._id === mouseId.toString()
      );

      await request(app)
        .put(`/api/users/cart/${mouseCartItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      // Step 8: Get updated cart
      const updatedCartResponse = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const updatedCart = updatedCartResponse.body.data.cart;
      expect(updatedCart.items).toHaveLength(3);
      
      const updatedMouseItem = updatedCart.items.find(item => 
        item.product._id === mouseId.toString()
      );
      expect(updatedMouseItem.quantity).toBe(3);

      // Step 9: Add user address
      const addressData = {
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        type: 'home'
      };

      const addressResponse = await request(app)
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(addressData)
        .expect(201);

      expect(addressResponse.body.success).toBe(true);
      expect(addressResponse.body.data.addresses).toHaveLength(1);

      // Step 10: Add payment method
      const paymentData = {
        type: 'card',
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
        cardholderName: 'John Doe'
      };

      const paymentResponse = await request(app)
        .post('/api/users/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(paymentResponse.body.success).toBe(true);

      // Step 11: Create order (simulate checkout)
      const orderData = {
        items: updatedCart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: addressResponse.body.data.addresses[0],
        paymentMethod: paymentResponse.body.data.paymentMethods[0]._id,
        totalAmount: updatedCart.items.reduce((total, item) => 
          total + (item.price * item.quantity), 0
        )
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.data.order.status).toBe('pending');
      expect(orderResponse.body.data.order.items).toHaveLength(3);

      // Step 12: Verify cart is cleared after order
      const clearedCartResponse = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(clearedCartResponse.body.data.cart.items).toHaveLength(0);

      // Step 13: Get user orders
      const ordersResponse = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(ordersResponse.body.success).toBe(true);
      expect(ordersResponse.body.data.orders).toHaveLength(1);
      expect(ordersResponse.body.data.orders[0].status).toBe('pending');

      // Step 14: Update user profile
      const profileUpdateData = {
        firstName: 'Jonathan',
        phone: '+44 20 1234 5678'
      };

      const profileResponse = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileUpdateData)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.firstName).toBe('Jonathan');
      expect(profileResponse.body.data.user.phone).toBe('+44 20 1234 5678');

      // Step 15: Verify stock was reduced
      const updatedLaptop = await Product.findById(laptopId);
      const updatedMouse = await Product.findById(mouseId);
      const updatedKeyboard = await Product.findById(keyboardId);

      expect(updatedLaptop.stock.quantity).toBe(4); // 5 - 1
      expect(updatedMouse.stock.quantity).toBe(17); // 20 - 3
      expect(updatedKeyboard.stock.quantity).toBe(9); // 10 - 1

      // Step 16: Verify wishlist still contains item
      const finalWishlistResponse = await request(app)
        .get('/api/users/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalWishlistResponse.body.data.wishlist.items).toHaveLength(1);
      expect(finalWishlistResponse.body.data.wishlist.items[0].notes).toBe('Want this for gaming');
    });
  });

  describe('User Profile Management Workflow', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Register and login user
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.tokens.accessToken;
      userId = registerResponse.body.data.user._id;
    });

    it('should complete profile management workflow', async () => {
      // Step 1: Get initial profile
      const initialProfileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(initialProfileResponse.body.data.user.firstName).toBe('Jane');
      expect(initialProfileResponse.body.data.user.addresses).toBeUndefined();

      // Step 2: Add multiple addresses
      const addresses = [
        {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Oak Avenue',
          city: 'Manchester',
          postcode: 'M1 1AA',
          type: 'home'
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '789 Business Park',
          city: 'Birmingham',
          postcode: 'B1 1AA',
          type: 'work'
        }
      ];

      for (const address of addresses) {
        await request(app)
          .post('/api/users/addresses')
          .set('Authorization', `Bearer ${authToken}`)
          .send(address)
          .expect(201);
      }

      // Step 3: Get addresses
      const addressesResponse = await request(app)
        .get('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(addressesResponse.body.data.addresses).toHaveLength(2);

      // Step 4: Set default address
      const addressId = addressesResponse.body.data.addresses[0]._id;
      await request(app)
        .patch(`/api/users/addresses/${addressId}/default`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 5: Add payment methods
      const paymentMethods = [
        {
          type: 'card',
          cardNumber: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          cardholderName: 'Jane Smith'
        },
        {
          type: 'card',
          cardNumber: '5555555555554444',
          expiryMonth: 6,
          expiryYear: 2026,
          cvv: '456',
          cardholderName: 'Jane Smith'
        }
      ];

      for (const payment of paymentMethods) {
        await request(app)
          .post('/api/users/payment-methods')
          .set('Authorization', `Bearer ${authToken}`)
          .send(payment)
          .expect(201);
      }

      // Step 6: Get payment methods
      const paymentMethodsResponse = await request(app)
        .get('/api/users/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(paymentMethodsResponse.body.data.paymentMethods).toHaveLength(2);
      expect(paymentMethodsResponse.body.data.paymentMethods[0].last4).toBe('1111');
      expect(paymentMethodsResponse.body.data.paymentMethods[1].last4).toBe('4444');

      // Step 7: Update address
      const updatedAddressData = {
        address: '456 Updated Oak Avenue',
        city: 'Greater Manchester'
      };

      await request(app)
        .put(`/api/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedAddressData)
        .expect(200);

      // Step 8: Delete a payment method
      const paymentMethodId = paymentMethodsResponse.body.data.paymentMethods[1]._id;
      await request(app)
        .delete(`/api/users/payment-methods/${paymentMethodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 9: Verify final state
      const finalAddressesResponse = await request(app)
        .get('/api/users/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const finalPaymentMethodsResponse = await request(app)
        .get('/api/users/payment-methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalAddressesResponse.body.data.addresses).toHaveLength(2);
      expect(finalAddressesResponse.body.data.addresses[0].address).toBe('456 Updated Oak Avenue');
      expect(finalPaymentMethodsResponse.body.data.paymentMethods).toHaveLength(1);
    });
  });

  describe('Shopping Cart Workflow', () => {
    let authToken;

    beforeEach(async () => {
      const userData = {
        firstName: 'Cart',
        lastName: 'User',
        email: 'cart.user@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should handle complex cart operations', async () => {
      // Step 1: Start with empty cart
      const emptyCartResponse = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(emptyCartResponse.body.data.cart.items).toHaveLength(0);

      // Step 2: Add all products to cart
      for (const product of testProducts) {
        await request(app)
          .post('/api/users/cart')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ productId: product._id, quantity: 2 })
          .expect(200);
      }

      // Step 3: Verify cart contents
      const fullCartResponse = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(fullCartResponse.body.data.cart.items).toHaveLength(3);

      // Step 4: Update quantities
      const cartItems = fullCartResponse.body.data.cart.items;
      
      // Increase laptop quantity
      const laptopItem = cartItems.find(item => 
        item.product.name === 'Gaming Laptop'
      );
      await request(app)
        .put(`/api/users/cart/${laptopItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      // Step 5: Remove one item
      const mouseItem = cartItems.find(item => 
        item.product.name === 'Wireless Mouse'
      );
      await request(app)
        .delete(`/api/users/cart/${mouseItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 6: Verify updated cart
      const updatedCartResponse = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedCartResponse.body.data.cart.items).toHaveLength(2);
      
      const updatedLaptopItem = updatedCartResponse.body.data.cart.items.find(item => 
        item.product.name === 'Gaming Laptop'
      );
      expect(updatedLaptopItem.quantity).toBe(3);

      // Step 7: Try to exceed stock limit
      const keyboardItem = updatedCartResponse.body.data.cart.items.find(item => 
        item.product.name === 'Mechanical Keyboard'
      );
      
      const exceedStockResponse = await request(app)
        .put(`/api/users/cart/${keyboardItem._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 15 }) // More than available stock (10)
        .expect(400);

      expect(exceedStockResponse.body.message).toContain('Insufficient stock');

      // Step 8: Clear entire cart
      await request(app)
        .delete('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Step 9: Verify cart is empty
      const clearedCartResponse = await request(app)
        .get('/api/users/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(clearedCartResponse.body.data.cart.items).toHaveLength(0);
    });
  });
});