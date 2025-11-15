#!/usr/bin/env node

/**
 * Comprehensive Database Seeding Script
 * 
 * Creates realistic test data for the TechVerse e-commerce platform
 * 
 * Usage:
 *   npm run seed:comprehensive
 *   node comprehensive-seed.js
 */

import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import connectDB from './src/config/database.js';
import { User, Product, Category, Order, Review } from './src/models/index.js';
import { generateSpecificationsForProduct } from './src/utils/specificationGenerator.js';
import { generateStockLevel, generatePricing } from './src/utils/stockPricingGenerator.js';
import { generateProductSEO, generateProductImages } from './src/utils/seoGenerator.js';
import passwordService from './src/services/passwordService.js';
import logger from './src/utils/logger.js';

// Seeding configuration
const SEED_CONFIG = {
  users: 25,
  categories: 11,
  productsPerCategory: 15,
  ordersPerUser: { min: 0, max: 8 },
  reviewsPerProduct: { min: 0, max: 15 }
};

class ComprehensiveSeed {
  constructor() {
    this.users = [];
    this.categories = [];
    this.products = [];
    this.orders = [];
    this.reviews = [];
  }

  /**
   * Main seeding function
   */
  async seed() {
    try {
      console.log('🚀 Starting comprehensive database seeding...\n');
      
      // Connect to database
      await connectDB();
      
      // Clear existing data
      await this.clearDatabase();
      
      // Seed data in order
      await this.seedCategories();
      await this.seedUsers();
      await this.seedProducts();
      await this.seedOrders();
      await this.seedReviews();
      
      // Generate summary
      await this.generateSummary();
      
      console.log('\n✅ Comprehensive seeding completed successfully!');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }

  /**
   * Clear existing database data
   */
  async clearDatabase() {
    console.log('🧹 Clearing existing data...');
    
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({})
    ]);
    
    console.log('✅ Database cleared\n');
  }

  /**
   * Seed product categories
   */
  async seedCategories() {
    console.log('📂 Seeding categories...');
    
    const categoryData = [
      {
        name: 'Smartphones',
        slug: 'phones',
        description: 'Latest smartphones with cutting-edge technology',
        isActive: true,
        showInMenu: true,
        displayOrder: 1,
        isFeatured: true
      },
      {
        name: 'Tablets',
        slug: 'tablets',
        description: 'Powerful tablets for work and entertainment',
        isActive: true,
        showInMenu: true,
        displayOrder: 2,
        isFeatured: true
      },
      {
        name: 'Laptops & Computers',
        slug: 'computers',
        description: 'High-performance computers and laptops',
        isActive: true,
        showInMenu: true,
        displayOrder: 3,
        isFeatured: true
      },
      {
        name: 'Smart TVs',
        slug: 'tvs',
        description: 'Smart TVs with stunning picture quality',
        isActive: true,
        showInMenu: true,
        displayOrder: 4,
        isFeatured: false
      },
      {
        name: 'Gaming Consoles',
        slug: 'gaming',
        description: 'Gaming consoles and accessories',
        isActive: true,
        showInMenu: true,
        displayOrder: 5,
        isFeatured: true
      },
      {
        name: 'Smart Watches',
        slug: 'watches',
        description: 'Smartwatches and fitness trackers',
        isActive: true,
        showInMenu: true,
        displayOrder: 6,
        isFeatured: false
      },
      {
        name: 'Audio & Headphones',
        slug: 'audio',
        description: 'Premium audio equipment and headphones',
        isActive: true,
        showInMenu: true,
        displayOrder: 7,
        isFeatured: true
      },
      {
        name: 'Cameras',
        slug: 'cameras',
        description: 'Digital cameras and photography equipment',
        isActive: true,
        showInMenu: true,
        displayOrder: 8,
        isFeatured: false
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Tech accessories and peripherals',
        isActive: true,
        showInMenu: true,
        displayOrder: 9,
        isFeatured: false
      },
      {
        name: 'Smart Home',
        slug: 'home-smart-devices',
        description: 'Smart home devices and automation',
        isActive: true,
        showInMenu: true,
        displayOrder: 10,
        isFeatured: false
      },
      {
        name: 'Fitness & Health',
        slug: 'fitness-health',
        description: 'Fitness trackers and health monitoring devices',
        isActive: true,
        showInMenu: true,
        displayOrder: 11,
        isFeatured: false
      }
    ];

    this.categories = await Category.insertMany(categoryData);
    console.log(`✅ Created ${this.categories.length} categories\n`);
  }

  /**
   * Seed users with realistic data
   */
  async seedUsers() {
    console.log('👥 Seeding users...');
    
    const users = [];
    
    // Create admin user with hashed password
    const adminPassword = await passwordService.hashPassword('Admin123!');
    users.push({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@techverse.com',
      password: adminPassword,
      role: 'admin',
      emailVerified: true,
      isActive: true,
      accountStatus: 'active',
      profile: {
        phone: faker.phone.number(),
        dateOfBirth: faker.date.birthdate({ min: 25, max: 65, mode: 'age' }),
        gender: 'prefer-not-to-say'
      },
      addresses: [this.generateAddress()],
      preferences: {
        newsletter: true,
        notifications: true,
        emailMarketing: true,
        smsMarketing: false
      }
    });

    // Hash the user password once for all users
    const userPassword = await passwordService.hashPassword('User123!');

    // Create regular users
    for (let i = 0; i < SEED_CONFIG.users - 1; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      users.push({
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: userPassword,
        role: 'user',
        phone: faker.helpers.arrayElement(['+447700900123', '+447700900456', '+447700900789']),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
        gender: faker.helpers.arrayElement(['male', 'female', 'other', 'prefer-not-to-say']),
        isActive: faker.datatype.boolean(0.95),
        isEmailVerified: faker.datatype.boolean(0.8),
        addresses: Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () => this.generateAddress()),
        preferences: {
          newsletter: faker.datatype.boolean(0.6),
          notifications: faker.datatype.boolean(0.8),
          emailMarketing: faker.datatype.boolean(0.4),
          smsMarketing: faker.datatype.boolean(0.2)
        }
      });
    }

    this.users = await User.insertMany(users);
    console.log(`✅ Created ${this.users.length} users\n`);
  }

  /**
   * Generate realistic address
   */
  generateAddress() {
    return {
      type: faker.helpers.arrayElement(['home', 'work', 'other']),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      company: faker.datatype.boolean(0.3) ? faker.company.name() : undefined,
      address: faker.location.streetAddress(),
      apartment: faker.datatype.boolean(0.2) ? faker.location.secondaryAddress() : undefined,
      city: faker.location.city(),
      postcode: faker.helpers.arrayElement(['SW1A 1AA', 'M1 1AA', 'B33 8TH', 'W1A 0AX', 'EC1A 1BB']),
      country: 'United Kingdom',
      phone: faker.helpers.arrayElement(['+447700900123', '+447700900456', '+447700900789']),
      isDefault: true
    };
  }

  /**
   * Seed products with comprehensive data
   */
  async seedProducts() {
    console.log('📱 Seeding products...');
    
    const products = [];
    
    for (const category of this.categories) {
      console.log(`  Creating products for ${category.name}...`);
      
      for (let i = 0; i < SEED_CONFIG.productsPerCategory; i++) {
        const product = await this.generateProduct(category);
        products.push(product);
      }
    }

    this.products = await Product.insertMany(products);
    console.log(`✅ Created ${this.products.length} products\n`);
  }

  /**
   * Generate realistic product
   */
  async generateProduct(category) {
    const brands = this.getBrandsForCategory(category.slug);
    const brand = faker.helpers.arrayElement(brands);
    const name = this.generateProductName(category.slug, brand);
    
    // Generate base price
    const basePrice = this.generateBasePrice(category.slug);
    
    // Generate pricing with discounts
    const pricing = generatePricing(basePrice, {
      category: category.slug,
      brand,
      hasDiscount: faker.datatype.boolean(0.4) // 40% chance of discount
    });

    // Generate stock levels
    const stockConfig = generateStockLevel(
      faker.number.int({ min: 0, max: 100 }),
      100
    );

    // Generate specifications
    const specifications = generateSpecificationsForProduct(category.slug, name, { brand });
    
    // Generate SEO data
    const seoData = generateProductSEO({ name, brand, shortDescription: faker.commerce.productDescription() }, category.slug);
    
    // Generate images
    const images = generateProductImages({ name, brand }, category.slug);

    return {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + faker.string.alphanumeric(4).toLowerCase(),
      subtitle: faker.commerce.productAdjective() + ' ' + faker.commerce.productMaterial(),
      description: faker.commerce.productDescription() + ' ' + faker.lorem.paragraph(),
      shortDescription: faker.commerce.productDescription(),
      ...pricing,
      brand,
      category: category._id,
      sku: `${brand.toUpperCase()}-${faker.string.alphanumeric(8).toUpperCase()}`,
      stock: stockConfig,
      variants: this.generateVariants(category.slug),
      images,
      specifications,
      features: Array.from({ length: faker.number.int({ min: 4, max: 8 }) }, () => faker.commerce.productAdjective() + ' ' + faker.commerce.productMaterial()),
      tags: this.generateTags(category.slug, brand),
      sections: this.generateSections(),
      featured: faker.datatype.boolean(0.2), // 20% featured
      status: 'active',
      seo: seoData,
      createdBy: this.users[0]._id, // Admin user
      createdAt: faker.date.between({ 
        from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), 
        to: new Date() 
      })
    };
  }

  /**
   * Get brands for category
   */
  getBrandsForCategory(categorySlug) {
    const brandMap = {
      phones: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing'],
      tablets: ['Apple', 'Samsung', 'Microsoft', 'Lenovo', 'Amazon'],
      computers: ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft'],
      tvs: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense'],
      gaming: ['Sony', 'Microsoft', 'Nintendo', 'Valve'],
      watches: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Fossil'],
      audio: ['Apple', 'Sony', 'Bose', 'Sennheiser', 'Audio-Technica'],
      cameras: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic'],
      accessories: ['Anker', 'Belkin', 'Logitech', 'Razer', 'SteelSeries'],
      'home-smart-devices': ['Amazon', 'Google', 'Philips', 'Ring', 'Nest'],
      'fitness-health': ['Fitbit', 'Garmin', 'Polar', 'Withings', 'Oura']
    };

    return brandMap[categorySlug] || ['Generic', 'TechVerse', 'Premium'];
  }

  /**
   * Generate product name
   */
  generateProductName(categorySlug, brand) {
    const namePatterns = {
      phones: [`${brand} Galaxy Pro`, `${brand} iPhone Pro`, `${brand} Pixel`, `${brand} Edge`],
      tablets: [`${brand} Pad Pro`, `${brand} Tab`, `${brand} Surface`],
      computers: [`${brand} Book Pro`, `${brand} Laptop`, `${brand} ThinkPad`],
      tvs: [`${brand} QLED TV`, `${brand} OLED TV`, `${brand} Smart TV`],
      gaming: [`${brand} Console`, `${brand} Gaming System`],
      watches: [`${brand} Watch`, `${brand} Fitness Tracker`],
      audio: [`${brand} Headphones`, `${brand} Earbuds`, `${brand} Speaker`],
      cameras: [`${brand} Camera`, `${brand} DSLR`, `${brand} Mirrorless`]
    };

    const patterns = namePatterns[categorySlug] || [`${brand} Device`];
    const baseName = faker.helpers.arrayElement(patterns);
    const model = faker.helpers.arrayElement(['Pro', 'Max', 'Ultra', 'Plus', 'Air', 'Mini']);
    const series = faker.number.int({ min: 1, max: 9 });

    return `${baseName} ${series} ${model}`;
  }

  /**
   * Generate base price for category
   */
  generateBasePrice(categorySlug) {
    const priceRanges = {
      phones: { min: 299, max: 1599 },
      tablets: { min: 199, max: 1299 },
      computers: { min: 599, max: 2999 },
      tvs: { min: 399, max: 2499 },
      gaming: { min: 299, max: 699 },
      watches: { min: 199, max: 899 },
      audio: { min: 49, max: 599 },
      cameras: { min: 399, max: 2999 },
      accessories: { min: 19, max: 199 },
      'home-smart-devices': { min: 29, max: 299 },
      'fitness-health': { min: 99, max: 499 }
    };

    const range = priceRanges[categorySlug] || { min: 50, max: 500 };
    return faker.number.int(range);
  }

  /**
   * Generate product variants
   */
  generateVariants(categorySlug) {
    const variantTypes = {
      phones: [
        {
          name: 'Color',
          options: [
            { value: 'midnight', priceModifier: 0, stock: faker.number.int({ min: 5, max: 25 }) },
            { value: 'starlight', priceModifier: 0, stock: faker.number.int({ min: 5, max: 25 }) },
            { value: 'blue', priceModifier: 0, stock: faker.number.int({ min: 5, max: 25 }) }
          ]
        },
        {
          name: 'Storage',
          options: [
            { value: '128GB', priceModifier: 0, stock: faker.number.int({ min: 10, max: 30 }) },
            { value: '256GB', priceModifier: 100, stock: faker.number.int({ min: 8, max: 20 }) },
            { value: '512GB', priceModifier: 300, stock: faker.number.int({ min: 5, max: 15 }) }
          ]
        }
      ],
      computers: [
        {
          name: 'Configuration',
          options: [
            { value: 'i5 / 8GB / 256GB', priceModifier: 0, stock: faker.number.int({ min: 5, max: 15 }) },
            { value: 'i7 / 16GB / 512GB', priceModifier: 400, stock: faker.number.int({ min: 3, max: 10 }) }
          ]
        }
      ]
    };

    return variantTypes[categorySlug] || [];
  }

  /**
   * Generate product tags
   */
  generateTags(categorySlug, brand) {
    const baseTags = [categorySlug, brand.toLowerCase(), 'tech', 'electronics'];
    const categoryTags = {
      phones: ['smartphone', 'mobile', '5g'],
      tablets: ['tablet', 'touchscreen', 'portable'],
      computers: ['laptop', 'pc', 'productivity'],
      gaming: ['console', 'games', 'entertainment']
    };

    return [...baseTags, ...(categoryTags[categorySlug] || [])];
  }

  /**
   * Generate product sections
   * Ensures good distribution across all homepage sections
   */
  generateSections() {
    const sections = [];
    // Increased probabilities and added quickPick
    if (faker.datatype.boolean(0.15)) sections.push('latest');      // ~15% of products
    if (faker.datatype.boolean(0.15)) sections.push('topSeller');   // ~15% of products
    if (faker.datatype.boolean(0.10)) sections.push('quickPick');   // ~10% of products
    if (faker.datatype.boolean(0.10)) sections.push('weeklyDeal');  // ~10% of products
    if (faker.datatype.boolean(0.05)) sections.push('featured');    // ~5% of products
    return sections;
  }

  /**
   * Seed orders
   */
  async seedOrders() {
    console.log('🛒 Seeding orders...');
    
    const orders = [];
    
    for (const user of this.users.slice(1)) { // Skip admin user
      const orderCount = faker.number.int(SEED_CONFIG.ordersPerUser);
      
      for (let i = 0; i < orderCount; i++) {
        const order = await this.generateOrder(user);
        orders.push(order);
      }
    }

    this.orders = await Order.insertMany(orders);
    console.log(`✅ Created ${this.orders.length} orders\n`);
  }

  /**
   * Generate realistic order
   */
  async generateOrder(user) {
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items = [];
    let subtotal = 0;

    // Select random products for order
    for (let i = 0; i < itemCount; i++) {
      const product = faker.helpers.arrayElement(this.products);
      const quantity = faker.number.int({ min: 1, max: 3 });
      const itemTotal = product.price * quantity;
      
      items.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity,
        total: itemTotal
      });
      
      subtotal += itemTotal;
    }

    const tax = Math.round(subtotal * 0.085 * 100) / 100;
    const shipping = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;

    const orderDate = faker.date.between({ 
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 
      to: new Date() 
    });

    return {
      orderNumber: `ORD${Date.now()}${faker.string.numeric(4)}`,
      user: user._id,
      items,
      subtotal,
      tax,
      shipping,
      total,
      status: faker.helpers.weightedArrayElement([
        { weight: 60, value: 'delivered' },
        { weight: 15, value: 'shipped' },
        { weight: 10, value: 'processing' },
        { weight: 10, value: 'confirmed' },
        { weight: 5, value: 'cancelled' }
      ]),
      payment: {
        method: 'stripe',
        status: 'completed',
        amount: total,
        currency: 'USD'
      },
      shipping: {
        method: faker.helpers.arrayElement(['standard', 'express', 'overnight']),
        status: 'delivered',
        trackingNumber: `TRK${faker.string.alphanumeric(10).toUpperCase()}`
      },
      shippingAddress: user.addresses[0] || this.generateAddress(),
      createdAt: orderDate,
      updatedAt: faker.date.between({ from: orderDate, to: new Date() })
    };
  }

  /**
   * Seed reviews
   */
  async seedReviews() {
    console.log('⭐ Seeding reviews...');
    
    const reviews = [];
    const userProductPairs = new Set(); // Track user-product combinations to avoid duplicates
    
    for (const product of this.products) {
      const reviewCount = faker.number.int(SEED_CONFIG.reviewsPerProduct);
      const availableUsers = [...this.users.slice(1)]; // Skip admin, create copy
      faker.helpers.shuffle(availableUsers); // Randomize user order
      
      let createdReviews = 0;
      for (let i = 0; i < Math.min(reviewCount, availableUsers.length); i++) {
        const user = availableUsers[i];
        const pairKey = `${user._id}-${product._id}`;
        
        if (!userProductPairs.has(pairKey)) {
          userProductPairs.add(pairKey);
          
          // Try to find an order from this user that contains this product
          let linkedOrder = null;
          if (this.orders && this.orders.length > 0) {
            linkedOrder = this.orders.find(order => 
              order.user.toString() === user._id.toString() &&
              order.items.some(item => item.product.toString() === product._id.toString()) &&
              order.status === 'delivered'
            );
          }
          
          const review = this.generateReview(product, user, linkedOrder?._id);
          reviews.push(review);
          createdReviews++;
        }
      }
    }

    this.reviews = await Review.insertMany(reviews);
    console.log(`✅ Created ${this.reviews.length} reviews\n`);
  }

  /**
   * Generate realistic review
   */
  generateReview(product, user, orderId = null) {
    const rating = faker.helpers.weightedArrayElement([
      { weight: 5, value: 1 },
      { weight: 10, value: 2 },
      { weight: 15, value: 3 },
      { weight: 35, value: 4 },
      { weight: 35, value: 5 }
    ]);

    // Generate helpful votes array
    const helpfulCount = faker.number.int({ min: 0, max: 15 });
    const helpful = [];
    const usedUsers = new Set();
    
    for (let i = 0; i < helpfulCount; i++) {
      let randomUser;
      do {
        randomUser = faker.helpers.arrayElement(this.users);
      } while (usedUsers.has(randomUser._id.toString()) && usedUsers.size < this.users.length);
      
      if (!usedUsers.has(randomUser._id.toString())) {
        usedUsers.add(randomUser._id.toString());
        helpful.push({
          user: randomUser._id,
          votedAt: faker.date.between({ 
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
            to: new Date() 
          })
        });
      }
    }

    // Generate not helpful votes array
    const notHelpfulCount = faker.number.int({ min: 0, max: 5 });
    const notHelpful = [];
    const usedUsersNotHelpful = new Set([...usedUsers]); // Don't let same user vote both ways
    
    for (let i = 0; i < notHelpfulCount; i++) {
      let randomUser;
      do {
        randomUser = faker.helpers.arrayElement(this.users);
      } while (usedUsersNotHelpful.has(randomUser._id.toString()) && usedUsersNotHelpful.size < this.users.length);
      
      if (!usedUsersNotHelpful.has(randomUser._id.toString())) {
        usedUsersNotHelpful.add(randomUser._id.toString());
        notHelpful.push({
          user: randomUser._id,
          votedAt: faker.date.between({ 
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
            to: new Date() 
          })
        });
      }
    }

    const reviewData = {
      user: user._id,
      product: product._id,
      rating,
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      comment: faker.lorem.paragraphs({ min: 1, max: 3 }),
      status: faker.helpers.weightedArrayElement([
        { weight: 85, value: 'approved' },
        { weight: 10, value: 'pending' },
        { weight: 5, value: 'rejected' }
      ]),
      verified: orderId ? true : faker.datatype.boolean(0.3), // If linked to order, mark as verified
      verifiedPurchase: orderId ? true : false, // Only true if linked to an order
      helpful,
      notHelpful,
      createdAt: faker.date.between({ 
        from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 
        to: new Date() 
      })
    };

    // Add order reference if available
    if (orderId) {
      reviewData.order = orderId;
    }

    return reviewData;
  }

  /**
   * Generate seeding summary
   */
  async generateSummary() {
    console.log('\n📈 Seeding Summary');
    console.log('==================');
    console.log(`👥 Users: ${this.users.length}`);
    console.log(`📂 Categories: ${this.categories.length}`);
    console.log(`📱 Products: ${this.products.length}`);
    console.log(`🛒 Orders: ${this.orders.length}`);
    console.log(`⭐ Reviews: ${this.reviews.length}`);
    
    // Calculate some statistics
    const totalRevenue = this.orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalRevenue / this.orders.length || 0;
    const avgRating = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length || 0;
    
    console.log(`\n💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`📊 Average Order Value: $${avgOrderValue.toFixed(2)}`);
    console.log(`⭐ Average Rating: ${avgRating.toFixed(1)}/5`);
    
    // Homepage sections distribution
    console.log('\n🏠 Homepage Sections:');
    const sectionCounts = { latest: 0, topSeller: 0, quickPick: 0, weeklyDeal: 0, featured: 0 };
    this.products.forEach(product => {
      product.sections?.forEach(section => {
        if (sectionCounts[section] !== undefined) sectionCounts[section]++;
      });
    });
    console.log(`   Latest: ${sectionCounts.latest} | Top Sellers: ${sectionCounts.topSeller} | Quick Picks: ${sectionCounts.quickPick} | Weekly Deals: ${sectionCounts.weeklyDeal} | Featured: ${sectionCounts.featured}`);
    
    // Review status
    console.log('\n📝 Review Status:');
    const reviewStatus = { approved: 0, pending: 0, rejected: 0 };
    this.reviews.forEach(review => {
      if (reviewStatus[review.status] !== undefined) reviewStatus[review.status]++;
    });
    console.log(`   Approved: ${reviewStatus.approved} | Pending: ${reviewStatus.pending} | Rejected: ${reviewStatus.rejected}`);
    
    console.log('\n🔐 Admin: admin@techverse.com / Admin123!');
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new ComprehensiveSeed();
  seeder.seed();
}

export default ComprehensiveSeed;