# TechVerse E-commerce Platform - Comprehensive Design Document

## Overview

The TechVerse platform is designed as a full-stack e-commerce solution with a React frontend, Node.js/Express backend, and MongoDB database. The platform serves both customers and administrators with distinct interfaces and functionality sets.

**Current Architecture Status**: The platform has a solid foundation with existing Cart/Wishlist contexts, API services, and database models. However, critical backend API routes are missing, product catalog needs expansion, and admin functionality requires complete implementation. The focus is on implementing missing backend APIs while leveraging existing frontend infrastructure.

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
├── /auth [DONE] IMPLEMENTED
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET /profile
├── /users [DONE] IMPLEMENTED
│   ├── GET /profile
│   ├── PUT /profile
│   ├── GET /addresses
│   ├── POST /addresses
│   ├── PUT /addresses/:id
│   ├── DELETE /addresses/:id
│   ├── GET /payment-methods (NEEDS IMPLEMENTATION)
│   ├── POST /payment-methods (NEEDS IMPLEMENTATION)
│   └── DELETE /payment-methods/:id (NEEDS IMPLEMENTATION)
├── /cart [ERROR] CRITICAL - ROUTES MISSING
│   ├── GET /
│   ├── POST /add
│   ├── PUT /update/:itemId
│   ├── DELETE /remove/:itemId
│   ├── DELETE /clear
│   └── POST /validate
├── /wishlist [ERROR] CRITICAL - ROUTES MISSING
│   ├── GET /
│   ├── POST /add
│   ├── DELETE /remove/:productId
│   ├── DELETE /clear
│   ├── POST /move-to-cart/:productId
│   ├── GET /check/:productId
│   └── GET /summary
├── /reviews [ERROR] CRITICAL - ROUTES MISSING
│   ├── GET /product/:productId
│   ├── POST /
│   ├── PUT /:reviewId
│   ├── DELETE /:reviewId
│   ├── POST /:reviewId/helpful
│   ├── POST /:reviewId/report
│   └── GET /user/my-reviews
├── /products [WARNING] NEEDS STOCK FIXES
│   ├── GET / (stock display issues)
│   ├── GET /:id
│   ├── GET /category/:category
│   └── GET /search
├── /orders [DONE] IMPLEMENTED
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id/status
└── /admin [WARNING] NEEDS ENHANCEMENTS
    ├── GET /dashboard (needs fixes)
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

### Critical Implementation Gaps

1. **Missing Backend Routes**: Cart, Wishlist, and Review API routes don't exist in server/src/routes/
2. **Stock Management**: Products showing incorrect stock status due to seeding issues
3. **Product Catalog**: Only 8 products exist, need 100+ across all 11 categories
4. **Payment Methods**: Backend API not implemented for payment method management
5. **Admin Management**: CRUD operations for products, orders, users need implementation
6. **Real-time Features**: Stock validation and inventory management needs implementation

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

## Missing API Implementation Requirements

### Cart Management API (CRITICAL - MISSING)

**File**: `server/src/routes/cart.js`

```javascript
// Required endpoints with full functionality
GET    /api/cart                    // Get user's cart with populated product data
POST   /api/cart/add               // Add item with variant selection and stock validation
PUT    /api/cart/update/:itemId    // Update quantity with stock validation
DELETE /api/cart/remove/:itemId    // Remove specific item
DELETE /api/cart/clear             // Clear entire cart
POST   /api/cart/validate          // Validate cart before checkout
```

**Key Features**:
- Real-time stock validation
- Variant option handling (color, storage, etc.)
- Price calculation with modifiers
- Persistent storage across sessions
- Automatic cart cleanup (30-day expiry)

### Wishlist Management API (CRITICAL - MISSING)

**File**: `server/src/routes/wishlist.js`

```javascript
// Required endpoints with full functionality
GET    /api/wishlist                      // Get user's wishlist with populated data
POST   /api/wishlist/add                  // Add product to wishlist
DELETE /api/wishlist/remove/:productId    // Remove product from wishlist
DELETE /api/wishlist/clear                // Clear entire wishlist
POST   /api/wishlist/move-to-cart/:productId  // Move item to cart
GET    /api/wishlist/check/:productId     // Check if product is in wishlist
GET    /api/wishlist/summary              // Get wishlist count only
```

**Key Features**:
- Price tracking (original vs current price)
- Move to cart functionality
- Persistent storage
- Price change notifications

### Review Management API (CRITICAL - MISSING)

**File**: `server/src/routes/reviews.js`

```javascript
// Required endpoints with full functionality
GET    /api/reviews/product/:productId    // Get product reviews with pagination
POST   /api/reviews                       // Create new review
PUT    /api/reviews/:reviewId             // Update user's review
DELETE /api/reviews/:reviewId             // Delete user's review
POST   /api/reviews/:reviewId/helpful     // Mark review as helpful
POST   /api/reviews/:reviewId/report      // Report inappropriate review
GET    /api/reviews/user/my-reviews       // Get user's reviews
```

**Key Features**:
- Review moderation system
- Verified purchase badges
- Helpful/not helpful voting
- Review reporting and moderation
- Image upload support
- Rating aggregation

### Enhanced Admin API (NEEDS EXPANSION)

**Files**: Expand existing `server/src/routes/admin.js`

```javascript
// Product Management
GET    /api/admin/products              // List all products with filters
POST   /api/admin/products              // Create new product
PUT    /api/admin/products/:id          // Update product
DELETE /api/admin/products/:id          // Delete product
POST   /api/admin/products/bulk-update  // Bulk operations

// Order Management  
GET    /api/admin/orders                // List orders with filters
PUT    /api/admin/orders/:id/status     // Update order status
POST   /api/admin/orders/:id/refund     // Process refund
GET    /api/admin/orders/export         // Export order data

// User Management
GET    /api/admin/users                 // List users with search
PUT    /api/admin/users/:id/status      // Update user status
PUT    /api/admin/users/:id/role        // Update user role
GET    /api/admin/users/:id/activity    // Get user activity

// Analytics
GET    /api/admin/analytics/dashboard   // Dashboard metrics
GET    /api/admin/analytics/sales       // Sales analytics
GET    /api/admin/analytics/products    // Product performance
GET    /api/admin/analytics/users       // User analytics
```

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

## Product Catalog Design

### Comprehensive Product Categories

Based on the product-categories-data-structure.md, the platform must support 11 main categories with detailed specifications:

1. **Phones** (25+ products)
   - Variants: Color, Storage (128GB-1TB)
   - Specs: Display & Design, Performance, Camera System, Battery & Connectivity
   - Brands: Apple, Samsung, Google, OnePlus

2. **Tablets** (15+ products)
   - Variants: Color, Storage (64GB-2TB), Connectivity
   - Specs: Display & Design, Performance, Camera & Audio, Connectivity & Accessories
   - Brands: Apple, Samsung, Microsoft

3. **Computers** (20+ products)
   - Variants: Color, Configuration (M3/8GB/256GB to M3 Max/36GB/1TB)
   - Specs: Display & Design, Performance, Ports & Connectivity, Battery & Power
   - Brands: Apple, Dell, HP, Lenovo

4. **TVs** (12+ products)
   - Variants: Color, Screen Size (43"-85")
   - Specs: Display Technology, Smart Features & OS, Audio System, Connectivity & Ports
   - Brands: Samsung, LG, Sony, TCL

5. **Gaming** (10+ products)
   - Variants: Color, Storage (512GB-2TB)
   - Specs: Performance, Storage & Media, Gaming Features, Connectivity & I/O
   - Brands: Sony, Microsoft, Nintendo

6. **Watches** (8+ products)
   - Variants: Color, Case Material (Aluminum to Ceramic)
   - Specs: Display & Design, Health & Fitness, Smart Features, Performance & Battery
   - Brands: Apple, Samsung, Garmin

7. **Audio** (15+ products)
   - Variants: Color, Model Tier (Standard to Max)
   - Specs: Audio Technology, Features & Controls, Design & Comfort, Battery & Connectivity
   - Brands: Apple, Sony, Bose, Sennheiser

8. **Cameras** (8+ products)
   - Variants: Color, Lens Kit (Body Only to Pro Lens)
   - Specs: Image Sensor, Autofocus & Performance, Video Capabilities, Build & Connectivity
   - Brands: Canon, Nikon, Sony, Fujifilm

9. **Accessories** (20+ products)
   - Variants: Color, Material Type (Silicone to Wallet)
   - Specs: Protection & Durability, Compatibility, Features & Functionality, Design & Materials
   - Brands: Apple, Belkin, Anker

10. **Home & Smart Devices** (10+ products)
    - Variants: Color, Size/Type (Mini to Max)
    - Specs: Smart Features, Audio & Display, Connectivity & Setup
    - Brands: Apple, Amazon, Google

11. **Fitness & Health** (8+ products)
    - Variants: Color, Size (Small to XL)
    - Specs: Health Monitoring, Fitness Features, Battery & Durability
    - Brands: Fitbit, Garmin, Apple

### Product Data Structure Enhancement

Each product must include:
- **Complete Variant System**: Dynamic options based on category
- **Detailed Specifications**: Category-specific technical specs
- **Realistic Stock Levels**: Mix of in-stock, low-stock, out-of-stock
- **Proper Pricing**: Base price + variant modifiers
- **Rich Media**: Multiple images per product
- **SEO Optimization**: Tags, descriptions, keywords

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

## Comprehensive Database Seeding Strategy

### Current Seeding Status
- [DONE] **Categories**: 11 categories created
- [WARNING] **Products**: Only 8 products (need 100+)
- [DONE] **Users**: Admin and test users created
- [WARNING] **Reviews**: Basic reviews (need realistic distribution)
- [WARNING] **Orders**: Basic orders (need comprehensive history)

### Enhanced Seeding Requirements

#### Product Expansion (Priority: CRITICAL)
```javascript
// Target: 100+ products across all categories
const productDistribution = {
  phones: 25,      // iPhone, Samsung Galaxy, Google Pixel, OnePlus
  tablets: 15,     // iPad, Samsung Tab, Surface
  computers: 20,   // MacBook, Dell XPS, HP Spectre, ThinkPad
  tvs: 12,         // Samsung QLED, LG OLED, Sony Bravia
  gaming: 10,      // PlayStation, Xbox, Nintendo Switch
  watches: 8,      // Apple Watch, Galaxy Watch, Garmin
  audio: 15,       // AirPods, Sony WH, Bose QC, Sennheiser
  cameras: 8,      // Canon EOS, Nikon Z, Sony Alpha
  accessories: 20, // Cases, chargers, cables, mounts
  home: 10,        // HomePod, Echo, Nest, smart displays
  fitness: 8       // Fitbit, Garmin, Apple Watch variants
};
```

#### Realistic Data Requirements
1. **Stock Levels**: 30% in-stock, 50% low-stock, 20% out-of-stock
2. **Pricing**: Varied pricing with realistic discounts (5-25%)
3. **Reviews**: 3-15 reviews per product with realistic ratings
4. **Variants**: Complete variant options per category
5. **Specifications**: Category-specific technical specs

#### User Data Enhancement
```javascript
// Target: 20+ users with complete profiles
const userTypes = {
  admin: 2,           // Full admin access
  customers: 15,      // Regular customers with orders
  newUsers: 5         // Recently registered users
};

// Each user should have:
// - Complete profile with avatar
// - 2-3 addresses (home, work, other)
// - 1-2 payment methods
// - Order history (0-5 orders)
// - Cart items (0-3 items)
// - Wishlist items (0-8 items)
// - Activity history
```

#### Order History Generation
```javascript
// Target: 50+ orders with realistic distribution
const orderStatuses = {
  delivered: 60,    // Completed orders
  shipped: 15,      // In transit
  processing: 10,   // Being prepared
  confirmed: 10,    // Payment confirmed
  cancelled: 5      // Cancelled orders
};
```

### File Upload System Design

#### Current Implementation
- **Development**: Local file storage in `/uploads` directory
- **File Types**: JPEG, PNG, WebP images up to 5MB
- **Structure**: Organized by type (products, users, reviews)

#### Upload Endpoints
```javascript
POST /api/upload/product-images    // Product image upload
POST /api/upload/user-avatar       // User avatar upload  
POST /api/upload/review-images     // Review image upload
```

#### Future Migration Path
- **Production**: Cloudinary integration planned
- **Optimization**: Automatic image compression and format conversion
- **CDN**: Global content delivery for performance

## Implementation Priority Matrix

### Phase 1: Critical Backend APIs (Week 1)
1. **Cart API Routes** - Complete implementation
2. **Wishlist API Routes** - Complete implementation  
3. **Review API Routes** - Complete implementation
4. **Stock Management** - Fix seeding and validation

### Phase 2: Product Catalog (Week 2)
1. **Product Expansion** - 100+ products across all categories
2. **Variant System** - Complete variant options
3. **Specifications** - Category-specific technical specs
4. **Media Management** - Multiple images per product

### Phase 3: Admin Management (Week 3)
1. **Product Management** - Full CRUD operations
2. **Order Management** - Status updates and processing
3. **User Management** - Account and role management
4. **Analytics Dashboard** - Real-time metrics

### Phase 4: Advanced Features (Week 4)
1. **Real-time Stock** - Live inventory updates
2. **Payment Methods** - Secure payment management
3. **Order Tracking** - Complete order lifecycle
4. **Performance Optimization** - Caching and indexing

This design document provides a comprehensive roadmap for implementing the missing functionality while leveraging the existing infrastructure. The focus is on creating a complete, production-ready e-commerce platform with proper data persistence, real-time features, and comprehensive admin management.