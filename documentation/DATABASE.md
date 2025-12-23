# TechVerse Database Documentation

## Overview

The TechVerse platform uses MongoDB as its primary database. This document outlines the database schema, relationships, indexes, and best practices.

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  firstName: String, // Required
  lastName: String, // Required
  email: String, // Required, unique, indexed
  password: String, // Required, hashed
  role: String, // 'user' | 'admin', default: 'user'
  isEmailVerified: Boolean, // default: false
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  accountStatus: String, // 'active' | 'inactive' | 'suspended' | 'pending'
  suspensionReason: String,
  phone: String,
  dateOfBirth: Date,
  
  // Address subdocuments
  addresses: [{
    _id: ObjectId,
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    postcode: String,
    country: String,
    type: String, // 'home' | 'work' | 'other'
    isDefault: Boolean
  }],
  
  // Payment method subdocuments
  paymentMethods: [{
    _id: ObjectId,
    type: String, // 'card' | 'paypal' | 'bank'
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    cardholderName: String,
    isDefault: Boolean
  }],
  
  preferences: {
    newsletter: Boolean,
    notifications: Boolean,
    currency: String,
    language: String
  },
  
  // OAuth fields
  googleId: String,
  githubId: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

**Indexes:**
- `email` (unique)
- `role, accountStatus`
- `createdAt`
- `googleId` (sparse)
- `githubId` (sparse)

### Products Collection

```javascript
{
  _id: ObjectId,
  name: String, // Required
  slug: String, // Auto-generated, indexed
  description: String, // Required
  shortDescription: String,
  price: Number, // Required, min: 0
  comparePrice: Number, // Original price for discounts
  cost: Number, // Cost price for profit calculations
  
  // Product organization
  category: ObjectId, // Required, ref: 'Category'
  brand: String, // Required
  sku: String, // Stock Keeping Unit
  tags: [String],
  
  // Product media
  images: [{
    url: String,
    alt: String,
    isPrimary: Boolean
  }],
  
  // Product specifications
  specifications: {
    // Dynamic object for product-specific specs
    // e.g., { processor: 'Intel i7', memory: '16GB', storage: '512GB SSD' }
  },
  
  // Inventory management
  stock: {
    quantity: Number, // default: 0, min: 0
    reserved: Number, // default: 0, for cart reservations
    lowStockThreshold: Number, // default: 10
    trackQuantity: Boolean, // default: true
    reservations: [{
      id: String,
      quantity: Number,
      expiresAt: Date
    }]
  },
  
  // Pricing and sales
  sales: {
    totalSold: Number, // default: 0
    revenue: Number, // default: 0
    lastSaleDate: Date
  },
  
  // Product status
  status: String, // 'draft' | 'active' | 'inactive' | 'deleted'
  visibility: String, // 'public' | 'private' | 'hidden'
  
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  
  // Product ratings and reviews
  rating: {
    average: Number, // default: 0, min: 0, max: 5
    count: Number // default: 0
  },
  
  // Product sections (featured, bestseller, etc.)
  sections: [String],
  
  // Audit fields
  createdBy: ObjectId, // ref: 'User'
  updatedBy: ObjectId, // ref: 'User'
  deletedBy: ObjectId, // ref: 'User'
  deletedAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `name, description, shortDescription, tags, brand` (text search)
- `slug` (unique)
- `category, status, visibility`
- `brand, status`
- `price, status`
- `rating.average, status`
- `sales.totalSold, status`
- `createdAt, status`
- `stock.quantity, stock.trackQuantity`

**Virtual Fields:**
- `discountPercentage` - Calculated discount percentage
- `stockStatus` - 'in_stock' | 'low_stock' | 'out_of_stock'
- `primaryImage` - First image marked as primary or first image

### Categories Collection

```javascript
{
  _id: ObjectId,
  name: String, // Required
  slug: String, // Auto-generated, unique, indexed
  description: String,
  
  // Hierarchy
  parent: ObjectId, // ref: 'Category', for subcategories
  level: Number, // 0 for root categories
  path: [ObjectId], // Array of parent category IDs
  
  // Display
  image: String,
  icon: String,
  displayOrder: Number, // For sorting
  isActive: Boolean, // default: true
  
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  
  // Statistics
  productCount: Number, // default: 0
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `slug` (unique)
- `parent, isActive`
- `isActive, displayOrder`
- `level, isActive`

### Orders Collection

```javascript
{
  _id: ObjectId,
  orderNumber: String, // Auto-generated, unique, indexed
  user: ObjectId, // Required, ref: 'User'
  
  // Order items
  items: [{
    product: ObjectId, // ref: 'Product'
    name: String, // Product name at time of order
    price: Number, // Product price at time of order
    quantity: Number,
    sku: String,
    image: String
  }],
  
  // Pricing
  subtotal: Number,
  taxAmount: Number,
  shippingAmount: Number,
  discountAmount: Number,
  totalAmount: Number, // Required
  
  // Order status
  status: String, // 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  
  // Status history
  statusHistory: [{
    status: String,
    notes: String,
    updatedBy: ObjectId, // ref: 'User'
    updatedAt: Date
  }],
  
  // Shipping information
  shippingAddress: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    postcode: String,
    country: String,
    phone: String
  },
  
  billingAddress: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    state: String,
    postcode: String,
    country: String
  },
  
  // Payment information
  paymentMethod: String, // 'card' | 'paypal' | 'bank_transfer'
  paymentStatus: String, // 'pending' | 'paid' | 'failed' | 'refunded'
  paymentId: String, // External payment processor ID
  
  // Shipping
  shippingMethod: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  // Notes
  customerNotes: String,
  adminNotes: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  shippedAt: Date,
  deliveredAt: Date
}
```

**Indexes:**
- `orderNumber` (unique)
- `user, createdAt`
- `status, createdAt`
- `createdAt`
- `items.product`

### Cart Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId, // Required, unique, ref: 'User'
  
  items: [{
    _id: ObjectId,
    product: ObjectId, // ref: 'Product'
    quantity: Number, // min: 1
    price: Number, // Price when added to cart
    addedAt: Date
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `user` (unique)
- `items.product`

**Virtual Fields:**
- `totalItems` - Total quantity of all items
- `totalAmount` - Total price of all items

### Wishlist Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId, // Required, unique, ref: 'User'
  
  items: [{
    _id: ObjectId,
    product: ObjectId, // ref: 'Product'
    priceWhenAdded: Number,
    notes: String,
    addedAt: Date
  }],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `user` (unique)
- `items.product`

### Reviews Collection

```javascript
{
  _id: ObjectId,
  product: ObjectId, // Required, ref: 'Product'
  user: ObjectId, // Required, ref: 'User'
  order: ObjectId, // ref: 'Order', to verify purchase
  
  rating: Number, // Required, min: 1, max: 5
  title: String,
  comment: String,
  
  // Review status
  status: String, // 'pending' | 'approved' | 'rejected'
  moderatedBy: ObjectId, // ref: 'User'
  moderationNotes: String,
  
  // Helpful votes
  helpfulVotes: Number, // default: 0
  totalVotes: Number, // default: 0
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `product, status`
- `user, product` (compound unique)
- `createdAt`

### Activity Collection (TTL: 90 days)

```javascript
{
  _id: ObjectId,
  user: ObjectId, // Required, ref: 'User'
  type: String, // Required, enum: ['login', 'logout', 'product_view', 'cart_add', etc.]
  description: String, // Required
  
  metadata: {}, // Dynamic object for additional data
  
  // Request information
  ipAddress: String, // Required
  userAgent: String, // Required
  sessionId: String,
  
  // Timestamp
  timestamp: Date // Required, TTL index (90 days)
}
```

**Indexes:**
- `user, timestamp`
- `type, timestamp`
- `timestamp` (TTL: 90 days)

## Relationships

### User Relationships
- **One-to-Many**: User → Orders
- **One-to-One**: User → Cart
- **One-to-One**: User → Wishlist
- **One-to-Many**: User → Reviews
- **One-to-Many**: User → Activities

### Product Relationships
- **Many-to-One**: Product → Category
- **One-to-Many**: Product → Reviews
- **Many-to-Many**: Product ↔ Orders (through order items)
- **Many-to-Many**: Product ↔ Carts (through cart items)
- **Many-to-Many**: Product ↔ Wishlists (through wishlist items)

### Category Relationships
- **Self-Referencing**: Category → Parent Category
- **One-to-Many**: Category → Products

### Order Relationships
- **Many-to-One**: Order → User
- **Many-to-Many**: Order ↔ Products (through order items)

## Database Optimization

### Indexing Strategy

1. **Text Search Indexes**
   ```javascript
   // Products collection
   db.products.createIndex({
     name: "text",
     description: "text",
     shortDescription: "text",
     tags: "text",
     brand: "text"
   }, {
     weights: {
       name: 10,
       brand: 5,
       shortDescription: 3,
       tags: 2,
       description: 1
     }
   });
   ```

2. **Compound Indexes**
   ```javascript
   // Products - category and status filtering
   db.products.createIndex({ category: 1, status: 1, visibility: 1 });
   
   // Orders - user and date queries
   db.orders.createIndex({ user: 1, createdAt: -1 });
   
   // Activities - user activity tracking
   db.activities.createIndex({ user: 1, timestamp: -1 });
   ```

3. **TTL Indexes**
   ```javascript
   // Activities - automatic cleanup after 90 days
   db.activities.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
   ```

### Query Optimization

1. **Product Listing Queries**
   ```javascript
   // Optimized product listing with category population
   db.products.aggregate([
     {
       $match: {
         status: 'active',
         visibility: 'public'
       }
     },
     {
       $lookup: {
         from: 'categories',
         localField: 'category',
         foreignField: '_id',
         as: 'category',
         pipeline: [{ $project: { name: 1, slug: 1 } }]
       }
     },
     {
       $unwind: '$category'
     },
     {
       $project: {
         name: 1,
         slug: 1,
         price: 1,
         comparePrice: 1,
         images: { $slice: ['$images', 1] },
         rating: 1,
         'stock.quantity': 1,
         category: 1,
         brand: 1
       }
     },
     { $sort: { createdAt: -1 } },
     { $skip: 0 },
     { $limit: 20 }
   ]);
   ```

2. **Dashboard Statistics**
   ```javascript
   // Optimized dashboard stats query
   Promise.all([
     db.users.countDocuments(),
     db.products.countDocuments({ status: 'active' }),
     db.orders.countDocuments(),
     db.orders.aggregate([
       {
         $match: {
           status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
         }
       },
       {
         $group: {
           _id: null,
           totalRevenue: { $sum: '$totalAmount' },
           totalOrders: { $sum: 1 }
         }
       }
     ])
   ]);
   ```

### Performance Best Practices

1. **Use Projections**
   ```javascript
   // Only select needed fields
   db.products.find(
     { status: 'active' },
     { name: 1, price: 1, images: 1, rating: 1 }
   );
   ```

2. **Limit Results**
   ```javascript
   // Always use pagination
   db.products.find().limit(20).skip(page * 20);
   ```

3. **Use Lean Queries**
   ```javascript
   // In Mongoose, use .lean() for read-only operations
   Product.find({ status: 'active' }).lean();
   ```

## Data Validation

### Mongoose Schema Validation

```javascript
// Example: Product schema validation
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  }
});
```

### Custom Validation

```javascript
// Custom validation for stock quantity
productSchema.pre('save', function(next) {
  if (this.stock.trackQuantity && this.stock.quantity < 0) {
    next(new Error('Stock quantity cannot be negative when tracking is enabled'));
  }
  next();
});
```

## Backup and Recovery

### Backup Strategy

1. **Daily Automated Backups**
   ```bash
   # MongoDB dump with compression
   mongodump --host localhost:27017 --db techverse --gzip --archive=backup_$(date +%Y%m%d).gz
   ```

2. **Point-in-Time Recovery**
   ```bash
   # Enable replica set for oplog
   mongod --replSet rs0
   ```

3. **Cloud Backup** (MongoDB Atlas)
   - Automated continuous backups
   - Point-in-time recovery
   - Cross-region backup storage

### Recovery Procedures

1. **Full Database Restore**
   ```bash
   mongorestore --host localhost:27017 --db techverse --gzip --archive=backup_20231201.gz
   ```

2. **Selective Collection Restore**
   ```bash
   mongorestore --host localhost:27017 --db techverse --collection products --gzip --archive=backup_20231201.gz
   ```

## Security Considerations

### Data Protection

1. **Sensitive Data Encryption**
   - Passwords: bcrypt hashing
   - Payment data: Encrypted at rest
   - PII: Field-level encryption

2. **Access Control**
   ```javascript
   // MongoDB user roles
   db.createUser({
     user: "appUser",
     pwd: "securePassword",
     roles: [
       { role: "readWrite", db: "techverse" }
     ]
   });
   ```

3. **Connection Security**
   ```javascript
   // SSL/TLS connection
   mongoose.connect('mongodb://localhost:27017/techverse', {
     ssl: true,
     sslValidate: true,
     sslCA: fs.readFileSync('ca-certificate.crt')
   });
   ```

### Audit Logging

```javascript
// Audit schema for tracking changes
const auditSchema = new mongoose.Schema({
  collection: String,
  documentId: ObjectId,
  action: String, // 'create', 'update', 'delete'
  changes: {},
  user: ObjectId,
  timestamp: Date,
  ipAddress: String
});
```

## Monitoring and Maintenance

### Performance Monitoring

1. **Query Performance**
   ```javascript
   // Enable profiling for slow queries
   db.setProfilingLevel(2, { slowms: 100 });
   
   // View slow queries
   db.system.profile.find().sort({ ts: -1 }).limit(5);
   ```

2. **Index Usage**
   ```javascript
   // Check index usage statistics
   db.products.aggregate([{ $indexStats: {} }]);
   ```

### Maintenance Tasks

1. **Index Maintenance**
   ```javascript
   // Rebuild indexes
   db.products.reIndex();
   
   // Drop unused indexes
   db.products.dropIndex("unused_index_name");
   ```

2. **Data Cleanup**
   ```javascript
   // Clean up expired cart items (older than 30 days)
   db.carts.updateMany(
     {},
     {
       $pull: {
         items: {
           addedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
         }
       }
     }
   );
   ```

This database documentation provides a comprehensive overview of the TechVerse database structure, relationships, and best practices for optimal performance and security.