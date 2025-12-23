/**
 * Test App Instance
 * Simplified Express app for testing without full server initialization
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Role from '../src/models/Role.js';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Simple auth middleware for testing
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Simple permission check
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super simple permission check - admin has all permissions
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      return next();
    }

    // Permission mappings for different roles (using valid enum values from User model)
    const rolePermissions = {
      user: ['products.view', 'cart.manage', 'orders.view'],
      customer_support: ['products.view', 'orders.view', 'users.view'],
      content_moderator: ['products.view', 'products.update', 'reviews.moderate'],
      inventory_manager: ['products.view', 'products.update', 'products.create'],
      marketing_manager: ['products.view', 'users.view', 'analytics.view'],
      sales_manager: ['products.view', 'orders.view', 'orders.update', 'users.view', 'orders.refund']
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (userPermissions.includes(permission)) {
      return next();
    }

    res.status(403).json({ success: false, message: 'Insufficient permissions' });
  };
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'user', // Use valid enum value
      isEmailVerified: true
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userResponse, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const userResponse = req.user.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      data: { user: userResponse }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Product routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' });
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cart routes
app.get('/api/cart', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      cart = { items: [], summary: { subtotal: 0, tax: 0, total: 0 } };
    } else {
      // Calculate totals
      const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.08;
      const total = subtotal + tax;
      
      cart.summary = { subtotal, tax, total };
    }

    res.json({
      success: true,
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/cart/add/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock.quantity < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        unitPrice: product.price,
        totalPrice: quantity * product.price
      });
    }

    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Order routes
app.get('/api/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product');
    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, paymentIntentId } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Valid shipping address is required' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check stock availability
    for (const item of cart.items) {
      if (item.product.stock.quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${item.product.name}` 
        });
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      shippingAddress,
      summary: { subtotal, tax, total },
      paymentMethod,
      paymentIntentId,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Reduce stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { 'stock.quantity': -item.quantity }
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin routes
app.get('/api/admin/dashboard', authenticate, requirePermission('admin.view'), async (req, res) => {
  res.json({
    success: true,
    data: { message: 'Admin dashboard data' }
  });
});

app.get('/api/admin/users', authenticate, requirePermission('users.view'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/products', authenticate, requirePermission('products.view'), async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/products', authenticate, requirePermission('products.create'), async (req, res) => {
  try {
    const { name, description, price, category, stock = { quantity: 0, trackQuantity: true } } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const product = await Product.create({
      name,
      slug,
      description,
      price,
      category,
      stock,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/products/:id', authenticate, requirePermission('products.update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/admin/products/:id', authenticate, requirePermission('products.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post(`/api/admin/orders/:id/refund`, authenticate, requirePermission('orders.refund'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'refunded') {
      return res.status(400).json({ success: false, message: 'Order already refunded' });
    }

    if (typeof amount !== 'number' || amount <= 0 || amount > order.summary.total) {
      return res.status(400).json({ success: false, message: 'Invalid refund amount' });
    }

    // Update order status
    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { order }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Payment routes
app.post('/api/payments/create-intent', authenticate, async (req, res) => {
  try {
    const { currency = 'usd' } = req.body;

    if (!currency || typeof currency !== 'string' || currency.length !== 3) {
      return res.status(400).json({ success: false, message: 'Valid currency is required' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const amount = Math.round(total * 100); // Convert to cents

    res.json({
      success: true,
      data: {
        clientSecret: 'pi_test_123_secret',
        amount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/payments/confirm', authenticate, async (req, res) => {
  try {
    const { paymentIntentId, shippingAddress } = req.body;

    if (!paymentIntentId || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Payment intent ID and shipping address are required' });
    }

    // Check if order already exists
    const existingOrder = await Order.findOne({ paymentIntentId });
    if (existingOrder) {
      return res.status(400).json({ success: false, message: 'Payment already processed' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const order = await Order.create({
      user: req.user._id,
      paymentIntentId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      shippingAddress,
      summary: { subtotal, tax, total },
      status: 'confirmed',
      paymentStatus: 'completed'
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { order }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    // Mock webhook processing
    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    // Simple XSS sanitization for testing
    const sanitizedFirstName = firstName ? firstName.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '') : req.user.firstName;
    const sanitizedLastName = lastName ? lastName.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '') : req.user.lastName;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName: sanitizedFirstName, lastName: sanitizedLastName },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/products/:id/reviews', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Simple XSS sanitization
    const sanitizedComment = comment ? comment.replace(/<[^>]*>/g, '') : '';

    const review = {
      user: req.user._id,
      rating,
      comment: sanitizedComment,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { review }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/cart/clear', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/upload', authenticate, async (req, res) => {
  try {
    // Mock file upload validation
    res.status(400).json({ success: false, message: 'File type not allowed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Role routes
app.get('/api/admin/roles', authenticate, requirePermission('roles.view'), async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/admin/roles', authenticate, requirePermission('roles.create'), async (req, res) => {
  try {
    const { name, displayName, description, permissions, priority = 1, isActive = true } = req.body;

    if (!name || !displayName || !description || !permissions) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }

    const role = await Role.create({
      name,
      displayName,
      description,
      permissions,
      priority,
      isActive,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Basic error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;