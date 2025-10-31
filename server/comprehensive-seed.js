import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Product, Category, Cart, Wishlist, Review, Order } from './src/models/index.js';
import { productData } from './product-data.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techverse';

// Product categories data
const categories = [
  { name: 'Phones', slug: 'phones', description: 'Smartphones and mobile devices' },
  { name: 'Tablets', slug: 'tablets', description: 'Tablets and iPad devices' },
  { name: 'Computers', slug: 'computers', description: 'Laptops and desktop computers' },
  { name: 'TVs', slug: 'tvs', description: 'Smart TVs and displays' },
  { name: 'Gaming', slug: 'gaming', description: 'Gaming consoles and accessories' },
  { name: 'Watches', slug: 'watches', description: 'Smartwatches and wearables' },
  { name: 'Audio', slug: 'audio', description: 'Headphones and speakers' },
  { name: 'Cameras', slug: 'cameras', description: 'Digital cameras and accessories' },
  { name: 'Accessories', slug: 'accessories', description: 'Phone cases and accessories' },
  { name: 'Home & Smart Devices', slug: 'home-smart-devices', description: 'Smart home products' },
  { name: 'Fitness & Health', slug: 'fitness-health', description: 'Fitness trackers and health devices' }
];

// Sample users data
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@techverse.com',
    password: 'Admin123!@#',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    accountStatus: 'active'
  },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'User123!@#',
    role: 'user',
    phone: '+447700900123',
    isActive: true,
    isEmailVerified: true,
    accountStatus: 'active'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'User123!@#',
    role: 'user',
    phone: '+447700900124',
    isActive: true,
    isEmailVerified: true,
    accountStatus: 'active'
  }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.log('⚠️ Error clearing database:', error.message);
    console.log('Continuing with seeding...');
  }
}async function createCategories() {
  console.log('📂 Creating categories...');
  const createdCategories = {};
  
  for (const categoryData of categories) {
    const category = new Category(categoryData);
    await category.save();
    createdCategories[categoryData.slug] = category._id;
    console.log(`✅ Created category: ${categoryData.name}`);
  }
  
  return createdCategories;
}

async function createUsers() {
  console.log('👥 Creating users...');
  const createdUsers = {};
  
  for (const userData of users) {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        user = new User({
          ...userData,
          addresses: userData.role === 'user' ? [{
            type: 'home',
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: '123 High Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'United Kingdom',
            phone: userData.phone || '+447700900123',
            isDefault: true
          }] : []
        });
        
        await user.save();
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`ℹ️ User already exists: ${userData.email}`);
      }
      
      createdUsers[userData.email] = user;
    } catch (error) {
      console.log(`⚠️ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

async function createProducts(categoryIds, adminUser) {
  console.log('📦 Creating comprehensive products...');
  const createdProducts = [];
  
  // Create products for each category
  for (const [categorySlug, products] of Object.entries(productData)) {
    if (categoryIds[categorySlug]) {
      for (const productTemplate of products) {
        const product = new Product({
          ...productTemplate,
          category: categoryIds[categorySlug],
          createdBy: adminUser._id,
          discountPercentage: productTemplate.compareAtPrice ? 
            Math.round(((productTemplate.compareAtPrice - productTemplate.price) / productTemplate.compareAtPrice) * 100) : 0,
          status: 'active',
          visibility: 'public',
          rating: { 
            average: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0 rating
            count: Math.floor(Math.random() * 200) + 20 // 20-220 reviews
          },
          sales: { 
            totalSold: Math.floor(Math.random() * 500) + 50, // 50-550 sold
            revenue: Math.floor(Math.random() * 100000) + 10000 // $10k-$110k revenue
          }
        });
        
        await product.save();
        createdProducts.push(product);
        console.log(`✅ Created product: ${product.name}`);
      }
    }
  }
  
  return createdProducts;
}async function createReviews(products, users) {
  console.log('⭐ Creating product reviews...');
  const userArray = Object.values(users).filter(user => user.role === 'user');
  
  for (const product of products) {
    // Create 3-5 reviews per product
    const reviewCount = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < reviewCount; i++) {
      const randomUser = userArray[Math.floor(Math.random() * userArray.length)];
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
      
      const reviewTitles = [
        'Excellent product, highly recommended!',
        'Great value for money',
        'Amazing quality and performance',
        'Perfect for my needs',
        'Outstanding features and design'
      ];
      
      const reviewComments = [
        'This product exceeded my expectations. The build quality is fantastic and it performs exactly as advertised. Would definitely buy again.',
        'Really impressed with the quality and features. Setup was easy and it works perfectly. Great customer service too.',
        'Excellent product with great performance. The design is sleek and modern. Highly recommend to anyone looking for quality.',
        'Perfect product for the price. Fast delivery and excellent packaging. Very satisfied with my purchase.',
        'Outstanding quality and performance. The features are exactly what I needed. Will definitely recommend to friends.'
      ];
      
      try {
        const review = new Review({
          user: randomUser._id,
          product: product._id,
          rating: rating,
          title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          variant: product.variants.length > 0 ? `${product.variants[0].options[0].value}` : '',
          recommend: rating >= 4,
          status: 'approved',
          verifiedPurchase: Math.random() > 0.3, // 70% verified purchases
          helpfulUsers: [], // Will be populated later
          helpfulCount: Math.floor(Math.random() * 10)
        });
        
        await review.save();
      } catch (error) {
        // Skip if user already reviewed this product (unique constraint)
        if (!error.message.includes('duplicate key')) {
          console.error('Error creating review:', error);
        }
      }
    }
  }
  
  console.log('✅ Reviews created');
}

async function createCarts(users, products) {
  console.log('🛒 Creating user carts...');
  const userArray = Object.values(users).filter(user => user.role === 'user');
  
  for (const user of userArray) {
    // 50% chance of having items in cart
    if (Math.random() > 0.5) {
      const cartItemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const cartItems = [];
      
      for (let i = 0; i < cartItemCount; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        // Select random variant options
        const options = {};
        if (randomProduct.variants && randomProduct.variants.length > 0) {
          randomProduct.variants.forEach(variant => {
            const randomOption = variant.options[Math.floor(Math.random() * variant.options.length)];
            options[variant.name.toLowerCase()] = randomOption.value;
          });
        }
        
        cartItems.push({
          product: randomProduct._id,
          quantity: quantity,
          price: randomProduct.price,
          options: options
        });
      }
      
      const cart = new Cart({
        user: user._id,
        items: cartItems
      });
      
      await cart.save();
    }
  }
  
  console.log('✅ Carts created');
}

async function createWishlists(users, products) {
  console.log('💝 Creating user wishlists...');
  const userArray = Object.values(users).filter(user => user.role === 'user');
  
  for (const user of userArray) {
    // 60% chance of having wishlist items
    if (Math.random() > 0.4) {
      const wishlistItemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
      const wishlistItems = [];
      
      for (let i = 0; i < wishlistItemCount; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        
        wishlistItems.push({
          product: randomProduct._id,
          priceWhenAdded: randomProduct.price,
          addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
      }
      
      const wishlist = new Wishlist({
        user: user._id,
        items: wishlistItems
      });
      
      await wishlist.save();
    }
  }
  
  console.log('✅ Wishlists created');
}

async function createOrders(users, products) {
  console.log('📋 Creating order history...');
  const userArray = Object.values(users).filter(user => user.role === 'user');
  
  for (const user of userArray) {
    // Create 1-3 orders per user
    const orderCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < orderCount; i++) {
      const orderItemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      const orderItems = [];
      let subtotal = 0;
      
      for (let j = 0; j < orderItemCount; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const price = randomProduct.price;
        
        orderItems.push({
          product: randomProduct._id,
          name: randomProduct.name,
          price: price,
          quantity: quantity,
          sku: randomProduct.sku
        });
        
        subtotal += price * quantity;
      }
      
      const tax = subtotal * 0.08; // 8% tax
      const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
      const total = subtotal + tax + shipping;
      
      const statuses = ['delivered', 'shipped', 'processing', 'confirmed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const order = new Order({
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user: user._id,
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        shipping: {
          cost: shipping,
          method: 'Standard Shipping',
          estimatedDays: 5
        },
        total: total,
        shippingAddress: user.addresses[0] || {
          firstName: user.firstName,
          lastName: user.lastName,
          address: '123 High Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom'
        },
        payment: {
          method: 'card',
          status: 'completed',
          amount: total,
          transactionId: `txn_${Date.now()}`,
          paidAt: new Date()
        },
        status: status,
        fulfillmentStatus: status === 'delivered' ? 'fulfilled' : 'unfulfilled',
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
      });
      
      await order.save();
    }
  }
  
  console.log('✅ Orders created');
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const categoryIds = await createCategories();
    const users = await createUsers();
    const adminUser = users['admin@techverse.com'];
    
    const products = await createProducts(categoryIds, adminUser);
    
    await createReviews(products, users);
    await createCarts(users, products);
    await createWishlists(users, products);
    await createOrders(users, products);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Products: ${products.length}`);
    console.log('\n🔐 Admin Login:');
    console.log('Email: admin@techverse.com');
    console.log('Password: Admin123!@#');
    console.log('\n👤 Test User Login:');
    console.log('Email: john.doe@example.com');
    console.log('Password: User123!@#');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding
main().catch(console.error);