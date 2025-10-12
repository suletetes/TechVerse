# TechVerse Database Seeding Guide

## 📋 Overview

This guide explains how to populate your TechVerse database with sample data for development and testing purposes. The seeding process creates realistic e-commerce data including categories, products, users, orders, and reviews.

## 🗄️ Database Structure

The seeding process populates the following collections:

### **Categories**
- **Root Categories**: 6 main categories (Laptops, Smartphones, Gaming, Audio, Smart Home, Accessories)
- **Subcategories**: 15 subcategories organized under main categories
- **Features**: SEO data, display ordering, filtering attributes, featured status

### **Users**
- **Admin User**: Full administrative access
- **Regular Users**: 4 sample customers with complete profiles
- **Features**: Addresses, preferences, order history, authentication data

### **Products**
- **10 Sample Products**: Covering all major categories
- **Features**: Multiple variants, specifications, images, pricing, stock management
- **Brands**: Apple, Samsung, Sony, Dell, Amazon, Anker
- **Product Types**: Laptops, smartphones, gaming consoles, headphones, smart speakers, accessories

### **Orders**
- **10 Sample Orders**: Distributed across users
- **Features**: Various order statuses, payment information, shipping addresses
- **Order Statuses**: Delivered, shipped, processing, confirmed

### **Reviews**
- **Sample Reviews**: 2-4 reviews per featured product
- **Features**: Ratings, pros/cons, verified purchases, approval status
- **Rating Distribution**: Realistic mix of 3-5 star ratings

## 🚀 Quick Start

### **Prerequisites**
1. MongoDB running locally or connection string configured
2. Environment variables set up (see `.env.example`)
3. Dependencies installed (`npm run install:all`)

### **Run Seeding**

```bash
# From project root
npm run seed

# Or from server directory
cd server
npm run seed

# For development environment specifically
npm run seed:dev
```

## 📊 Sample Data Details

### **Test Accounts Created**

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@techverse.com | Admin123! | Full administrative access |
| User | john.smith@example.com | User123! | Regular customer account |
| User | sarah.johnson@example.com | User123! | Regular customer account |
| User | michael.brown@example.com | User123! | Regular customer account |
| User | emma.wilson@example.com | User123! | Regular customer account |

### **Product Categories**

#### **🖥️ Laptops & Computers**
- MacBook Pro 16-inch M3 Pro (£2,499)
- Dell XPS 13 Plus (£1,299)

#### **📱 Smartphones & Tablets**
- iPhone 15 Pro (£999)
- Samsung Galaxy S24 Ultra (£1,249)

#### **🎮 Gaming**
- PlayStation 5 (£479.99)

#### **🎧 Audio & Headphones**
- Sony WH-1000XM5 (£379)
- AirPods Pro 2nd Gen (£229)

#### **🏠 Smart Home**
- Amazon Echo Dot 5th Gen (£49.99)

#### **🔌 Accessories**
- Anker PowerCore 10000 PD Redux (£39.99)

### **Product Features**

Each product includes:
- **Multiple Variants**: Colors, storage options, configurations
- **Detailed Specifications**: Technical details organized by category
- **Feature Lists**: Key selling points and capabilities
- **SEO Optimization**: Meta titles, descriptions, keywords
- **Stock Management**: Quantity tracking, low stock thresholds
- **Pricing**: Regular price, compare price, cost price
- **Images**: Multiple product images with alt text

### **Order Simulation**

Sample orders include:
- **Realistic Order Flow**: From pending to delivered status
- **Payment Information**: Card payments with transaction details
- **Shipping Addresses**: UK addresses with proper postcodes
- **Order Items**: 1-3 products per order with variants
- **Pricing Calculation**: Subtotal, VAT (20%), shipping costs

### **Review System**

Sample reviews feature:
- **Verified Purchases**: 60% of reviews are from verified buyers
- **Rating Distribution**: Realistic spread from 3-5 stars
- **Detailed Feedback**: Titles, comments, pros and cons
- **Approval Status**: All seeded reviews are pre-approved
- **User Attribution**: Reviews linked to actual user accounts

## 🔧 Customization

### **Modifying Sample Data**

Edit `server/src/seeds/seedData.js` to customize:

```javascript
// Add new categories
const newCategory = {
  name: 'Wearables',
  slug: 'wearables',
  description: 'Smart watches and fitness trackers',
  icon: 'watch',
  color: '#FF6B6B',
  isFeatured: true,
  displayOrder: 7
};

// Add new products
const newProduct = {
  name: 'Apple Watch Series 9',
  description: 'The most advanced Apple Watch yet...',
  price: 399.00,
  brand: 'Apple',
  category: 'wearables',
  // ... other properties
};
```

### **Environment-Specific Seeding**

```bash
# Development environment
NODE_ENV=development npm run seed

# Production environment (not recommended)
NODE_ENV=production npm run seed
```

### **Partial Seeding**

Modify the seed script to only create specific data:

```javascript
// In seedData.js, comment out sections you don't want
// await seedCategories();
// await seedUsers();
await seedProducts(); // Only seed products
// await seedOrders();
// await seedReviews();
```

## 🛡️ Safety Features

### **Data Protection**
- **Clear Before Seed**: All existing data is cleared before seeding
- **Confirmation Required**: Script shows what will be created
- **Environment Checks**: Prevents accidental production seeding

### **Error Handling**
- **Validation**: All data validates against model schemas
- **Rollback**: Failed seeding stops and reports errors
- **Logging**: Detailed progress and error logging

### **Performance**
- **Batch Operations**: Efficient bulk data creation
- **Index Updates**: Automatic index rebuilding after seeding
- **Memory Management**: Optimized for large datasets

## 📈 Post-Seeding Verification

After seeding, verify the data:

```bash
# Check collection counts
mongosh your_database_name
> db.categories.countDocuments()
> db.users.countDocuments()
> db.products.countDocuments()
> db.orders.countDocuments()
> db.reviews.countDocuments()

# Test login with sample accounts
# Visit your application and log in with:
# admin@techverse.com / Admin123!
# john.smith@example.com / User123!
```

## 🔄 Re-seeding

To refresh your database with clean sample data:

```bash
# This will clear all existing data and recreate sample data
npm run seed
```

**⚠️ Warning**: This will delete ALL existing data in your database!

## 🐛 Troubleshooting

### **Common Issues**

#### **Connection Errors**
```bash
Error: MongooseError: Operation `users.insertOne()` buffering timed out
```
**Solution**: Check MongoDB connection string in `.env` file

#### **Validation Errors**
```bash
ValidationError: Path `email` is required
```
**Solution**: Check required fields in model schemas match seed data

#### **Duplicate Key Errors**
```bash
E11000 duplicate key error collection
```
**Solution**: Ensure database is properly cleared before seeding

### **Debug Mode**

Enable detailed logging:

```javascript
// In seedData.js
mongoose.set('debug', true);
```

### **Memory Issues**

For large datasets, increase Node.js memory:

```bash
node --max-old-space-size=4096 src/scripts/seed.js
```

## 📚 Related Documentation

- [Model Schemas](./server/src/models/) - Database model definitions
- [API Documentation](./API_DOCUMENTATION.md) - API endpoint details
- [Environment Setup](./.env.example) - Environment configuration
- [Testing Guide](./TESTING_COMPREHENSIVE_GUIDE.md) - Testing procedures

## 🤝 Contributing

When adding new sample data:

1. **Follow Model Schema**: Ensure data matches model requirements
2. **Realistic Data**: Use realistic names, addresses, and product details
3. **Relationships**: Maintain proper relationships between collections
4. **Performance**: Consider impact on seeding performance
5. **Documentation**: Update this guide with new data types

## 📝 Sample Data Sources

The sample data is inspired by real products and follows UK e-commerce standards:

- **Addresses**: Valid UK postcodes and addresses
- **Pricing**: GBP currency with realistic pricing
- **Products**: Based on actual tech products and specifications
- **Reviews**: Realistic customer feedback patterns
- **Orders**: Typical e-commerce order patterns

---

**Happy Seeding! 🌱**

Your TechVerse database is now ready for development and testing with comprehensive, realistic sample data.