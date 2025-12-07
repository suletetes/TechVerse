# TechVerse Backend API

Node.js/Express backend API for the TechVerse e-commerce platform. Provides RESTful endpoints for product management, user authentication, shopping cart, orders, and admin operations.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for sessions and performance
- **Authentication**: JWT + Passport.js (Local, Google OAuth, GitHub OAuth)
- **File Upload**: Multer + Cloudinary/AWS S3
- **Email**: Nodemailer
- **Payment**: Stripe integration
- **Security**: Helmet, CORS, rate limiting, CSRF protection
- **Logging**: Winston with daily rotation
- **Testing**: Jest + Supertest
- **Process Management**: PM2

## Features

### Core API Features
- RESTful API architecture
- JWT authentication with refresh tokens
- OAuth integration (Google, GitHub)
- Role-based access control (User, Admin)
- File upload and image processing
- Email notifications
- Payment processing with Stripe
- Real-time updates with Socket.io

### Security Features
- Password hashing with bcrypt
- JWT token management
- Rate limiting per endpoint
- CSRF protection
- XSS protection
- Input validation and sanitization
- Secure session management
- API key authentication for admin

### Performance Features
- Redis caching
- Database query optimization
- Connection pooling
- Response compression
- Request logging and monitoring

## Prerequisites

- Node.js 18.x or higher
- MongoDB 6.0 or higher
- Redis 7.x or higher
- npm or yarn package manager

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables
```

## Environment Variables

Create a `.env` file in the server directory:

```bash
# Application
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/techverse
MONGODB_TEST_URI=mongodb://localhost:27017/techverse_test

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-session-secret-change-this-in-production
SESSION_MAX_AGE=86400000

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@techverse.com

# File Upload - Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# File Upload - AWS S3 (Alternative)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=techverse-uploads

# Payment - Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security
CSRF_SECRET=your-csrf-secret-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/

# Admin
ADMIN_EMAIL=admin@techverse.com
ADMIN_PASSWORD=change-this-secure-password
```

## Available Scripts

### Development
```bash
npm start           # Start production server
npm run dev         # Start development server with nodemon
```

### Database
```bash
npm run seed        # Seed database with sample data
npm run seed:dev    # Seed with development data
npm run seed:test   # Seed test database
```

### Testing
```bash
npm test            # Run all tests
npm run test:unit   # Run unit tests only
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Code Quality
```bash
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint errors automatically
```

## Project Structure

```
server/
├── src/
│   ├── config/            # Configuration files
│   │   ├── database.js    # MongoDB connection
│   │   ├── redis.js       # Redis connection
│   │   ├── passport.js    # Passport strategies
│   │   └── cloudinary.js  # File upload config
│   ├── controllers/       # Route controllers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js        # Authentication
│   │   ├── validation.js  # Input validation
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── upload.js      # File upload
│   ├── models/            # Mongoose models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── Category.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── wishlist.js
│   │   └── admin.js
│   ├── services/          # Business logic
│   │   ├── emailService.js
│   │   ├── paymentService.js
│   │   └── uploadService.js
│   └── utils/             # Utility functions
│       ├── logger.js
│       ├── tokenManager.js
│       └── helpers.js
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── __mocks__/        # Test mocks
├── scripts/              # Utility scripts
│   ├── seedDatabase.js
│   └── verifySeedData.js
├── logs/                 # Log files
├── uploads/              # Temporary uploads
├── .env                  # Environment variables
├── .env.example          # Environment template
├── server.js             # Entry point
└── package.json
```

## API Endpoints

### Authentication

```
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login user
POST   /api/auth/logout                # Logout user
POST   /api/auth/refresh-token         # Refresh access token
GET    /api/auth/me                    # Get current user
PUT    /api/auth/profile               # Update user profile
POST   /api/auth/change-password       # Change password
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password/:token # Reset password
POST   /api/auth/verify-email/:token   # Verify email address
POST   /api/auth/resend-verification   # Resend verification email

# OAuth
GET    /api/auth/google                # Google OAuth login
GET    /api/auth/google/callback       # Google OAuth callback
GET    /api/auth/github                # GitHub OAuth login
GET    /api/auth/github/callback       # GitHub OAuth callback
```

### Products

```
GET    /api/products                   # Get all products (with filters)
GET    /api/products/:id               # Get product by ID
GET    /api/products/slug/:slug        # Get product by slug
GET    /api/products/section/:name     # Get products by section
POST   /api/products/search            # Search products
GET    /api/products/category/:category # Get products by category
```

### Cart

```
GET    /api/cart                       # Get user cart
POST   /api/cart/add/:productId        # Add item to cart
PUT    /api/cart/update/:itemId        # Update cart item quantity
DELETE /api/cart/remove/:itemId        # Remove item from cart
DELETE /api/cart/clear                 # Clear entire cart
POST   /api/cart/merge                 # Merge guest cart with user cart
```

### Orders

```
GET    /api/orders                     # Get user orders
GET    /api/orders/:id                 # Get order by ID
POST   /api/orders                     # Create new order
PUT    /api/orders/:id/cancel          # Cancel order
GET    /api/orders/:id/track           # Track order status
POST   /api/orders/:id/review          # Add order review
```

### Wishlist

```
GET    /api/wishlist                   # Get user wishlist
POST   /api/wishlist/add/:productId    # Add product to wishlist
DELETE /api/wishlist/remove/:productId # Remove from wishlist
GET    /api/wishlist/check/:productId  # Check if product in wishlist
POST   /api/wishlist/move-to-cart/:productId # Move to cart
DELETE /api/wishlist/clear             # Clear wishlist
GET    /api/wishlist/summary           # Get wishlist summary
```

### Reviews

```
GET    /api/reviews/product/:productId # Get product reviews
POST   /api/reviews                    # Create review
PUT    /api/reviews/:id                # Update review
DELETE /api/reviews/:id                # Delete review
POST   /api/reviews/:id/helpful        # Mark review as helpful
```

### Admin - Products

```
GET    /api/admin/products             # Get all products (admin view)
POST   /api/admin/products             # Create new product
PUT    /api/admin/products/:id         # Update product
DELETE /api/admin/products/:id         # Delete product
POST   /api/admin/products/bulk        # Bulk operations
PUT    /api/admin/products/:id/stock   # Update stock
POST   /api/admin/products/:id/images  # Upload product images
```

### Admin - Orders

```
GET    /api/admin/orders               # Get all orders
GET    /api/admin/orders/:id           # Get order details
PUT    /api/admin/orders/:id/status    # Update order status
POST   /api/admin/orders/:id/refund    # Process refund
GET    /api/admin/orders/export        # Export orders
```

### Admin - Users

```
GET    /api/admin/users                # Get all users
GET    /api/admin/users/:id            # Get user details
PUT    /api/admin/users/:id            # Update user
DELETE /api/admin/users/:id            # Delete user
PUT    /api/admin/users/:id/role       # Update user role
PUT    /api/admin/users/:id/status     # Update user status
```

### Admin - Dashboard

```
GET    /api/admin/dashboard            # Get dashboard statistics
GET    /api/admin/analytics            # Get analytics data
GET    /api/admin/reports/sales        # Sales report
GET    /api/admin/reports/products     # Product report
GET    /api/admin/reports/users        # User report
```

### Admin - Categories

```
GET    /api/admin/categories           # Get all categories
POST   /api/admin/categories           # Create category
PUT    /api/admin/categories/:id       # Update category
DELETE /api/admin/categories/:id       # Delete category
```

### Admin - Homepage Sections

```
GET    /api/admin/sections             # Get all sections
POST   /api/admin/sections/:name       # Update section products
GET    /api/admin/sections/:name       # Get section details
```

### Health Check

```
GET    /health                         # API health check
GET    /api/health                     # Detailed health status
```

## Authentication

### JWT Token Flow

1. User logs in with credentials
2. Server validates and returns access token + refresh token
3. Client stores tokens (access token in memory, refresh token in httpOnly cookie)
4. Client includes access token in Authorization header for protected routes
5. When access token expires, use refresh token to get new access token

### Protected Routes

Add authentication middleware to protect routes:

```javascript
import { authenticate, authorize } from './middleware/auth.js';

// Require authentication
router.get('/profile', authenticate, getProfile);

// Require specific role
router.post('/admin/products', authenticate, authorize('admin'), createProduct);
```

### Token Usage

```javascript
// Client-side request with token
const response = await fetch('/api/cart', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

## Database Models

### User Model

```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique, required),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  isEmailVerified: Boolean,
  accountStatus: String,
  avatar: String,
  addresses: [AddressSchema],
  phone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model

```javascript
{
  name: String (required),
  slug: String (unique),
  description: String,
  shortDescription: String,
  price: Number (required),
  compareAtPrice: Number,
  category: ObjectId (ref: 'Category'),
  brand: String,
  images: [ImageSchema],
  primaryImage: ImageSchema,
  stock: {
    quantity: Number,
    trackQuantity: Boolean,
    lowStockThreshold: Number
  },
  status: String (enum: ['active', 'inactive', 'draft']),
  sections: [String],
  rating: {
    average: Number,
    count: Number
  },
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model

```javascript
{
  orderNumber: String (unique),
  user: ObjectId (ref: 'User'),
  items: [{
    product: ObjectId (ref: 'Product'),
    name: String,
    price: Number,
    quantity: Number,
    selectedOptions: Object
  }],
  totalAmount: Number,
  status: String (enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  payment: {
    method: String,
    status: String,
    paymentIntentId: String,
    amount: Number
  },
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Error Response Format

```javascript
{
  success: false,
  message: "Error message",
  error: {
    code: "ERROR_CODE",
    details: {}
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication required or failed
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ERROR` - Duplicate entry
- `SERVER_ERROR` - Internal server error

### Custom Error Handler

```javascript
import { AppError } from './utils/errors.js';

// Throw custom error
throw new AppError('Product not found', 404, 'NOT_FOUND');

// Error handler middleware catches and formats
app.use(errorHandler);
```

## Validation

### Input Validation with express-validator

```javascript
import { body, validationResult } from 'express-validator';

const validateProduct = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('category').isMongoId().withMessage('Invalid category ID'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];

router.post('/products', validateProduct, createProduct);
```

## File Upload

### Upload Configuration

```javascript
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'techverse/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
```

### Upload Endpoint

```javascript
router.post('/products/:id/images', 
  authenticate,
  authorize('admin'),
  upload.array('images', 5),
  uploadProductImages
);
```

## Email Service

### Send Email

```javascript
import { sendEmail } from './services/emailService.js';

await sendEmail({
  to: user.email,
  subject: 'Welcome to TechVerse',
  template: 'welcome',
  context: {
    firstName: user.firstName,
    verificationLink: `${CLIENT_URL}/verify/${token}`
  }
});
```

### Available Email Templates

- `welcome` - Welcome new users
- `verify-email` - Email verification
- `reset-password` - Password reset
- `order-confirmation` - Order confirmation
- `order-shipped` - Shipping notification
- `order-delivered` - Delivery confirmation

## Payment Integration

### Stripe Payment Flow

```javascript
import { createPaymentIntent } from './services/paymentService.js';

// Create payment intent
const paymentIntent = await createPaymentIntent({
  amount: order.totalAmount,
  currency: 'gbp',
  metadata: {
    orderId: order._id.toString()
  }
});

// Return client secret to frontend
res.json({
  success: true,
  data: {
    clientSecret: paymentIntent.client_secret
  }
});
```

### Webhook Handler

```javascript
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);
```

## Caching with Redis

### Cache Usage

```javascript
import { redisClient } from './config/redis.js';

// Set cache
await redisClient.setex(
  `product:${productId}`,
  3600, // 1 hour
  JSON.stringify(product)
);

// Get cache
const cached = await redisClient.get(`product:${productId}`);
if (cached) {
  return JSON.parse(cached);
}

// Delete cache
await redisClient.del(`product:${productId}`);
```

### Cache Patterns

- Product details: 1 hour
- Product listings: 15 minutes
- User cart: Session duration
- Homepage sections: 30 minutes

## Logging

### Winston Logger

```javascript
import logger from './utils/logger.js';

// Log levels: error, warn, info, debug
logger.info('User logged in', { userId: user._id });
logger.error('Payment failed', { error: err.message, orderId });
logger.debug('Cache hit', { key: cacheKey });
```

### Log Files

- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- `logs/access.log` - HTTP access logs

## Testing

### Unit Tests

```javascript
import { createProduct } from '../controllers/productController';

describe('Product Controller', () => {
  test('creates product successfully', async () => {
    const req = {
      body: {
        name: 'Test Product',
        price: 99.99
      },
      user: { _id: 'admin-id', role: 'admin' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await createProduct(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true
      })
    );
  });
});
```

### Integration Tests

```javascript
import request from 'supertest';
import app from '../server';

describe('Product API', () => {
  test('GET /api/products returns products', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.products)).toBe(true);
  });
});
```

## Deployment

### Production Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong secrets for JWT and sessions
- [ ] Configure production database
- [ ] Set up Redis in production
- [ ] Configure email service
- [ ] Set up file storage (Cloudinary/S3)
- [ ] Configure Stripe production keys
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up backup strategy

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'techverse-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Security Best Practices

- Use environment variables for sensitive data
- Implement rate limiting on all endpoints
- Validate and sanitize all inputs
- Use HTTPS in production
- Implement CSRF protection
- Set secure HTTP headers with Helmet
- Use parameterized queries to prevent SQL injection
- Hash passwords with bcrypt (min 10 rounds)
- Implement proper session management
- Regular security audits and updates

## Monitoring

### Health Check Endpoint

```javascript
GET /health

Response:
{
  status: 'healthy',
  timestamp: '2024-01-01T00:00:00.000Z',
  uptime: 3600,
  database: 'connected',
  redis: 'connected'
}
```

### Performance Monitoring

- Response time tracking
- Error rate monitoring
- Database query performance
- Cache hit/miss rates
- API endpoint usage statistics

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/techverse
```

**Redis Connection Error**
```bash
# Check Redis status
redis-cli ping

# Should return: PONG
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**JWT Token Errors**
```bash
# Verify JWT_SECRET is set in .env
# Check token expiration settings
# Ensure client sends token in Authorization header
```

## Contributing

### Code Standards

- Follow ESLint configuration
- Write tests for new features
- Document API endpoints
- Use async/await for asynchronous code
- Handle errors properly
- Add logging for important operations

### API Design Guidelines

- Use RESTful conventions
- Return consistent response format
- Include proper HTTP status codes
- Implement pagination for list endpoints
- Add filtering and sorting options
- Version API endpoints if needed
