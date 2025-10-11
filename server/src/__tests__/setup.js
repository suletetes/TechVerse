import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Product, Category, Order, Review } from '../models/index.js';

// Global test setup
let mongoServer;

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Mock external services
vi.mock('../services/emailService.js', () => ({
  default: {
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendOrderConfirmation: vi.fn().mockResolvedValue(true),
    sendOrderStatusUpdate: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../services/paymentService.js', () => ({
  default: {
    createPaymentIntent: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_test'
    }),
    confirmPayment: vi.fn().mockResolvedValue({
      id: 'pi_test_123',
      status: 'succeeded'
    }),
    refundPayment: vi.fn().mockResolvedValue({
      id: 're_test_123',
      status: 'succeeded'
    })
  }
}));

vi.mock('../services/imageService.js', () => ({
  default: {
    uploadImage: vi.fn().mockResolvedValue({
      url: 'https://test.cloudinary.com/test-image.jpg',
      publicId: 'test-image-123'
    }),
    uploadMultipleImages: vi.fn().mockResolvedValue([
      {
        url: 'https://test.cloudinary.com/test-image-1.jpg',
        publicId: 'test-image-1'
      },
      {
        url: 'https://test.cloudinary.com/test-image-2.jpg',
        publicId: 'test-image-2'
      }
    ]),
    deleteImage: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Setup test database
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
});

// Clear database before each test
beforeEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error('Failed to clear test data:', error);
  }
});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Test utilities
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true
  };
  
  return User.create({ ...defaultUser, ...userData });
};

export const createTestAdmin = async (userData = {}) => {
  const defaultAdmin = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    isEmailVerified: true
  };
  
  return User.create({ ...defaultAdmin, ...userData });
};

export const createTestCategory = async (categoryData = {}, createdBy) => {
  const defaultCategory = {
    name: 'Test Category',
    slug: 'test-category',
    description: 'A test category',
    createdBy: createdBy || new mongoose.Types.ObjectId()
  };
  
  return Category.create({ ...defaultCategory, ...categoryData });
};

export const createTestProduct = async (productData = {}, createdBy, category) => {
  const defaultProduct = {
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    price: 999,
    category: category || new mongoose.Types.ObjectId(),
    brand: 'TestBrand',
    status: 'active',
    visibility: 'public',
    createdBy: createdBy || new mongoose.Types.ObjectId(),
    stock: {
      quantity: 50,
      trackQuantity: true
    }
  };
  
  return Product.create({ ...defaultProduct, ...productData });
};

export const createTestOrder = async (orderData = {}, user, products = []) => {
  const defaultOrder = {
    user: user || new mongoose.Types.ObjectId(),
    items: products.length > 0 ? products.map(product => ({
      product: product._id,
      quantity: 1,
      price: product.price
    })) : [{
      product: new mongoose.Types.ObjectId(),
      quantity: 1,
      price: 999
    }],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    paymentMethod: 'credit_card',
    status: 'pending'
  };
  
  return Order.create({ ...defaultOrder, ...orderData });
};

export const createTestReview = async (reviewData = {}, user, product) => {
  const defaultReview = {
    user: user || new mongoose.Types.ObjectId(),
    product: product || new mongoose.Types.ObjectId(),
    rating: 5,
    title: 'Great product!',
    comment: 'Really satisfied with this purchase.',
    status: 'approved'
  };
  
  return Review.create({ ...defaultReview, ...reviewData });
};

// Authentication helpers
export const generateAuthToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const generateRefreshToken = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: user._id, 
      type: 'refresh' 
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
};

// Performance testing helpers
export const measureExecutionTime = async (fn) => {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  
  return {
    result,
    executionTime: endTime - startTime
  };
};

export const createLargeDataset = async (Model, count, dataGenerator) => {
  const data = Array.from({ length: count }, (_, i) => dataGenerator(i));
  return Model.insertMany(data);
};

// Memory usage helpers
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024) // MB
  };
};

// Database state helpers
export const getDatabaseStats = async () => {
  const stats = await mongoose.connection.db.stats();
  return {
    collections: stats.collections,
    objects: stats.objects,
    dataSize: Math.round(stats.dataSize / 1024 / 1024), // MB
    storageSize: Math.round(stats.storageSize / 1024 / 1024), // MB
    indexes: stats.indexes,
    indexSize: Math.round(stats.indexSize / 1024 / 1024) // MB
  };
};

// Error simulation helpers
export const simulateNetworkError = () => {
  throw new Error('Network error: Connection timeout');
};

export const simulateDatabaseError = () => {
  throw new Error('Database error: Connection lost');
};

export const simulateValidationError = (field) => {
  const error = new Error(`Validation error: ${field} is required`);
  error.name = 'ValidationError';
  return error;
};

// Async helpers
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const waitFor = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await delay(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Cleanup helpers
export const cleanupTestData = async () => {
  const collections = [User, Product, Category, Order, Review];
  
  for (const Collection of collections) {
    await Collection.deleteMany({});
  }
};

export const resetDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
};