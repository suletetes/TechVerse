# TechVerse E-commerce Platform - Comprehensive Design Document

## Overview

The TechVerse platform is designed as a full-stack e-commerce solution with a React frontend, Node.js/Express backend, and MongoDB database. The platform serves both customers and administrators with distinct interfaces and functionality sets.

**Current Architecture Status**: The platform has a solid foundation but requires significant improvements in data persistence, backend integration, and admin functionality. Many features currently use hardcoded data or have incomplete implementations.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   MongoDB       │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - User Interface│    │ - REST API      │    │ - User Data     │
│ - State Mgmt    │    │ - Authentication│    │ - Product Data  │
│ - Context APIs  │    │ - Business Logic│    │ - Order Data    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with Hooks and Context API
- React Router for navigation
- Bootstrap 5 for UI components
- Vite for build tooling
- Vitest for testing

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Passport.js for auth strategies
- Redis for session storage
- Multer for file uploads

**Infrastructure:**
- Development: Local MongoDB and Redis
- Production: Cloud MongoDB Atlas and Redis Cloud
- File Storage: Local filesystem (development)

## Components and Interfaces

### Frontend Architecture

#### Context Management
```
AuthContext
├── User authentication state
├── Login/logout functionality
├── Token management
└── Role-based access control

UserProfileContext (NEEDS IMPLEMENTATION)
├── Profile data management
├── Address CRUD operations
├── Payment method management
└── Activity tracking

CartContext (NEEDS BACKEND INTEGRATION)
├── Cart item management
├── Persistent cart storage
├── Stock validation
└── Checkout preparation

WishlistContext (NEEDS BACKEND INTEGRATION)
├── Wishlist item management
├── Persistent wishlist storage
├── Price tracking
└── Move to cart functionality

AdminContext (NEEDS FIXES)
├── Dashboard analytics
├── Product management
├── Order management
├── User management
└── System monitoring
```

#### Component Structure
```
src/
├── components/
│   ├── Admin/
│   │   ├── AdminDashboard (NEEDS FIXES)
│   │   ├── AdminProducts (NEEDS IMPLEMENTATION)
│   │   ├── AdminOrders (NEEDS IMPLEMENTATION)
│   │   ├── AdminUsers (NEEDS IMPLEMENTATION)
│   │   └── AdminSettings
│   ├── UserProfile/
│   │   ├── ProfileTab (NEEDS BACKEND INTEGRATION)
│   │   ├── AddressesTab (NEEDS BACKEND INTEGRATION)
│   │   ├── PaymentMethodsTab (NEEDS IMPLEMENTATION)
│   │   ├── OrdersTab
│   │   └── ActivityTab (NEEDS IMPLEMENTATION)
│   ├── Cart/ (NEEDS BACKEND INTEGRATION)
│   ├── Wishlist/ (NEEDS BACKEND INTEGRATION)
│   └── Product/
├── pages/
├── context/
├── api/
└── utils/
```

### Backend Architecture

#### API Structure
```
/api/
├── /auth
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET /profile
├── /users
│   ├── GET /profile (NEEDS IMPLEMENTATION)
│   ├── PUT /profile (NEEDS IMPLEMENTATION)
│   ├── GET /addresses (NEEDS IMPLEMENTATION)
│   ├── POST /addresses (NEEDS IMPLEMENTATION)
│   ├── PUT /addresses/:id (NEEDS IMPLEMENTATION)
│   ├── DELETE /addresses/:id (NEEDS IMPLEMENTATION)
│   ├── GET /payment-methods (NEEDS IMPLEMENTATION)
│   ├── POST /payment-methods (NEEDS IMPLEMENTATION)
│   └── DELETE /payment-methods/:id (NEEDS IMPLEMENTATION)
├── /cart (NEEDS IMPLEMENTATION)
│   ├── GET /
│   ├── POST /add
│   ├── PUT /update/:id
│   ├── DELETE /remove/:id
│   └── DELETE /clear
├── /wishlist (NEEDS IMPLEMENTATION)
│   ├── GET /
│   ├── POST /add
│   ├── DELETE /remove/:id
│   └── DELETE /clear
├── /products
│   ├── GET / (NEEDS STOCK FIXES)
│   ├── GET /:id
│   ├── GET /category/:category
│   └── GET /search
├── /orders
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id/status
└── /admin
    ├── GET /dashboard (NEEDS FIXES)
    ├── GET /products (NEEDS IMPLEMENTATION)
    ├── POST /products (NEEDS IMPLEMENTATION)
    ├── PUT /products/:id (NEEDS IMPLEMENTATION)
    ├── DELETE /products/:id (NEEDS IMPLEMENTATION)
    ├── GET /orders (NEEDS IMPLEMENTATION)
    ├── PUT /orders/:id (NEEDS IMPLEMENTATION)
    ├── GET /users (NEEDS IMPLEMENTATION)
    └── PUT /users/:id (NEEDS IMPLEMENTATION)
```

#### Database Models

**User Model (NEEDS ENHANCEMENTS)**
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|admin),
  avatar: String,
  phone: String,
  dateOfBirth: Date,
  isActive: Boolean,
  isEmailVerified: Boolean,
  accountStatus: String,
  addresses: [AddressSchema], // NEEDS PROPER IMPLEMENTATION
  paymentMethods: [PaymentMethodSchema], // NEEDS IMPLEMENTATION
  preferences: {
    newsletter: Boolean,
    notifications: Boolean,
    theme: String,
    language: String,
    currency: String
  },
  activity: [ActivitySchema], // NEEDS IMPLEMENTATION
  createdAt: Date,
  updatedAt: Date
}
```

**Product Model (NEEDS STOCK FIXES)**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  shortDescription: String,
  price: Number,
  comparePrice: Number,
  cost: Number,
  sku: String,
  brand: String,
  category: ObjectId (ref: Category),
  images: [ImageSchema],
  stock: {
    quantity: Number, // CRITICAL: NEEDS PROPER INITIALIZATION
    lowStockThreshold: Number,
    trackQuantity: Boolean,
    reserved: Number // NEEDS IMPLEMENTATION
  },
  specifications: [SpecificationSchema],
  features: [String],
  tags: [String],
  sections: [String],
  status: String (draft|active|archived),
  visibility: String (public|private),
  featured: Boolean,
  rating: {
    average: Number,
    count: Number
  },
  sales: {
    totalSold: Number,
    revenue: Number
  },
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Cart Model (NEEDS IMPLEMENTATION)**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number, // Price at time of adding
    addedAt: Date
  }],
  subtotal: Number,
  total: Number,
  expiresAt: Date, // For cleanup
  createdAt: Date,
  updatedAt: Date
}
```

**Wishlist Model (NEEDS IMPLEMENTATION)**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    addedAt: Date,
    priceWhenAdded: Number,
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Order Model (EXISTING - NEEDS ENHANCEMENTS)**
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  user: ObjectId (ref: User),
  items: [OrderItemSchema],
  subtotal: Number,
  tax: Number,
  shipping: {
    cost: Number,
    method: String,
    estimatedDays: Number
  },
  discount: {
    amount: Number,
    code: String,
    type: String
  },
  total: Number,
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  payment: PaymentSchema,
  status: String,
  fulfillmentStatus: String,
  tracking: TrackingSchema,
  statusHistory: [StatusHistorySchema],
  createdAt: Date,
  updatedAt: Date
}
```

## Data Models

### Critical Data Model Issues

1. **Stock Management**: Products are showing as out of stock due to improper stock initialization in seeding
2. **User Addresses**: Currently hardcoded in frontend, needs proper database storage
3. **Payment Methods**: Not implemented in backend
4. **Cart Persistence**: Cart data is not saved to database
5. **Wishlist Persistence**: Wishlist data is not saved to database

### Required Schema Additions

**Address Schema**
```javascript
{
  _id: ObjectId,
  type: String (home|work|other),
  firstName: String,
  lastName: String,
  company: String,
  address: String,
  apartment: String,
  city: String,
  state: String,
  postcode: String,
  country: String,
  phone: String,
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Payment Method Schema**
```javascript
{
  _id: ObjectId,
  type: String (card|paypal|bank),
  cardType: String,
  lastFour: String,
  expiryMonth: Number,
  expiryYear: Number,
  cardholderName: String,
  token: String, // Encrypted payment token
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Activity Schema**
```javascript
{
  _id: ObjectId,
  type: String (login|purchase|profile_update|etc),
  description: String,
  metadata: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

## Error Handling

### Current Issues
1. **Dashboard API**: Returns 500 errors due to improper data handling
2. **Categories API**: Missing authentication middleware
3. **Stock Validation**: No proper stock checking during cart operations
4. **File Uploads**: Incomplete error handling for image uploads

### Error Handling Strategy
```javascript
// Standardized error response format
{
  success: false,
  message: "User-friendly error message",
  error: "Technical error details (development only)",
  code: "ERROR_CODE",
  timestamp: "2024-01-01T00:00:00Z",
  requestId: "unique-request-id"
}
```

## Testing Strategy

### Current Test Coverage
- Basic component tests exist
- Integration tests are incomplete
- API tests are minimal
- No end-to-end tests

### Required Test Improvements

**Unit Tests**
- User profile context and components
- Cart and wishlist functionality
- Admin dashboard components
- Stock management functions
- Authentication flows

**Integration Tests**
- User profile API endpoints
- Cart and wishlist API endpoints
- Admin management APIs
- Order processing flow
- Payment processing

**End-to-End Tests**
- Complete user registration and profile setup
- Product browsing and cart management
- Checkout and order placement
- Admin product and order management
- User account management

### Test Data Requirements
- Realistic user profiles with addresses and payment methods
- Products with varied stock levels (in stock, low stock, out of stock)
- Complete order histories with different statuses
- Admin users with different permission levels

## Security Considerations

### Current Security Issues
1. **Password Storage**: Properly implemented with bcrypt
2. **JWT Tokens**: Implemented but needs refresh token improvements
3. **File Uploads**: Needs better validation and security
4. **Admin Access**: Needs proper role-based access control

### Security Enhancements Needed
- Input validation for all user data
- Rate limiting for API endpoints
- CSRF protection for state-changing operations
- Secure file upload handling
- Audit logging for admin actions

## Performance Considerations

### Current Performance Issues
1. **Database Queries**: Some inefficient queries in admin dashboard
2. **Image Loading**: No optimization for product images
3. **Cart Operations**: No caching for frequent operations
4. **Search**: No indexing for product search

### Performance Improvements
- Database query optimization
- Image compression and CDN integration
- Redis caching for frequently accessed data
- Search indexing for products
- Lazy loading for product lists

## Deployment Architecture

### Development Environment
- Local MongoDB instance
- Local Redis instance
- File storage in local filesystem
- Environment variables for configuration

### Production Environment (Future)
- MongoDB Atlas cluster
- Redis Cloud instance
- AWS S3 for file storage
- Load balancer for API scaling
- CDN for static assets

## Migration Strategy

### Phase 1: Critical Fixes (Immediate)
1. Fix stock management in seeding and product display
2. Implement user profile backend APIs
3. Fix admin dashboard data loading
4. Implement cart and wishlist persistence

### Phase 2: Feature Completion (Short-term)
1. Complete admin management functionality
2. Implement payment method management
3. Add comprehensive activity tracking
4. Enhance search and filtering

### Phase 3: Optimization (Medium-term)
1. Performance optimization
2. Advanced admin analytics
3. Real-time features
4. Mobile optimization

### Phase 4: Scale and Enhance (Long-term)
1. Microservices architecture
2. Advanced caching strategies
3. Machine learning recommendations
4. Advanced reporting and analytics

## API Documentation

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/profile
```

### User Management Endpoints (NEEDS IMPLEMENTATION)
```
GET /api/users/profile
PUT /api/users/profile
GET /api/users/addresses
POST /api/users/addresses
PUT /api/users/addresses/:id
DELETE /api/users/addresses/:id
GET /api/users/payment-methods
POST /api/users/payment-methods
DELETE /api/users/payment-methods/:id
GET /api/users/activity
```

### Cart Management Endpoints (NEEDS IMPLEMENTATION)
```
GET /api/cart
POST /api/cart/add
PUT /api/cart/update/:id
DELETE /api/cart/remove/:id
DELETE /api/cart/clear
```

### Wishlist Management Endpoints (NEEDS IMPLEMENTATION)
```
GET /api/wishlist
POST /api/wishlist/add
DELETE /api/wishlist/remove/:id
DELETE /api/wishlist/clear
```

### Admin Management Endpoints (NEEDS FIXES/IMPLEMENTATION)
```
GET /api/admin/dashboard
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products/:id
DELETE /api/admin/products/:id
GET /api/admin/orders
PUT /api/admin/orders/:id
GET /api/admin/users
PUT /api/admin/users/:id
GET /api/admin/analytics
```

## Database Optimization

### Required Indexes
```javascript
// Users collection
{ email: 1 } // unique
{ role: 1 }
{ accountStatus: 1 }

// Products collection
{ category: 1, status: 1 }
{ sections: 1 }
{ name: "text", description: "text" } // text search
{ "stock.quantity": 1 }
{ featured: 1, status: 1 }

// Orders collection
{ user: 1, createdAt: -1 }
{ orderNumber: 1 } // unique
{ status: 1 }
{ createdAt: -1 }

// Cart collection
{ user: 1 } // unique
{ expiresAt: 1 } // TTL index

// Wishlist collection
{ user: 1 } // unique
```

### Data Relationships
```
User (1) -> (N) Addresses
User (1) -> (N) PaymentMethods
User (1) -> (1) Cart
User (1) -> (1) Wishlist
User (1) -> (N) Orders
User (1) -> (N) Activities

Product (N) -> (1) Category
Product (1) -> (N) OrderItems
Product (1) -> (N) CartItems
Product (1) -> (N) WishlistItems

Order (1) -> (N) OrderItems
Order (N) -> (1) User
```

This design document provides a comprehensive overview of the current state and required improvements for the TechVerse platform. The focus is on implementing missing backend functionality, fixing critical issues, and establishing proper data persistence throughout the application.