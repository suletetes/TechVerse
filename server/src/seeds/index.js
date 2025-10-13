import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  User, 
  Product, 
  Category, 
  Store, 
  Page, 
  HomepageSection 
} from '../models/index.js';
import { categories, products, users, stores, pages } from './seedData.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Store.deleteMany({}),
      Page.deleteMany({}),
      HomepageSection.deleteMany({})
    ]);
    logger.info('Database cleared successfully');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
};

// Seed categories
const seedCategories = async () => {
  try {
    const createdCategories = await Category.insertMany(categories);
    logger.info(`${createdCategories.length} categories seeded successfully`);
    return createdCategories;
  } catch (error) {
    logger.error('Error seeding categories:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const createdUsers = await User.insertMany(users);
    logger.info(`${createdUsers.length} users seeded successfully`);
    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
};

// Seed products
const seedProducts = async (categoriesMap, adminUser) => {
  try {
    const productsWithRefs = products.map(product => ({
      ...product,
      category: categoriesMap[product.categorySlug]._id,
      createdBy: adminUser._id
    }));

    // Remove categorySlug as it's not part of the schema
    productsWithRefs.forEach(product => {
      delete product.categorySlug;
    });

    const createdProducts = await Product.insertMany(productsWithRefs);
    logger.info(`${createdProducts.length} products seeded successfully`);
    return createdProducts;
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
};

// Seed stores
const seedStores = async () => {
  try {
    const createdStores = await Store.insertMany(stores);
    logger.info(`${createdStores.length} stores seeded successfully`);
    return createdStores;
  } catch (error) {
    logger.error('Error seeding stores:', error);
    throw error;
  }
};

// Seed pages
const seedPages = async () => {
  try {
    const createdPages = await Page.insertMany(pages);
    logger.info(`${createdPages.length} pages seeded successfully`);
    return createdPages;
  } catch (error) {
    logger.error('Error seeding pages:', error);
    throw error;
  }
};

// Initialize homepage sections
const seedHomepageSections = async () => {
  try {
    await HomepageSection.initializeDefaults();
    logger.info('Homepage sections initialized successfully');
  } catch (error) {
    logger.error('Error initializing homepage sections:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearDatabase();

    // Seed data in order (due to dependencies)
    const createdCategories = await seedCategories();
    const createdUsers = await seedUsers();
    
    // Create category lookup map
    const categoriesMap = {};
    createdCategories.forEach(category => {
      categoriesMap[category.slug] = category;
    });

    // Find admin user
    const adminUser = createdUsers.find(user => user.role === 'admin');
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    // Seed products with category and user references
    await seedProducts(categoriesMap, adminUser);
    
    // Seed stores and pages
    await seedStores();
    await seedPages();
    
    // Initialize homepage sections
    await seedHomepageSections();

    logger.info('Database seeding completed successfully!');
    
    // Log summary
    const counts = await Promise.all([
      Category.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Store.countDocuments(),
      Page.countDocuments(),
      HomepageSection.countDocuments()
    ]);

    logger.info('Seeding Summary:', {
      categories: counts[0],
      users: counts[1],
      products: counts[2],
      stores: counts[3],
      pages: counts[4],
      homepageSections: counts[5]
    });

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${counts[0]}`);
    console.log(`   Users: ${counts[1]}`);
    console.log(`   Products: ${counts[2]}`);
    console.log(`   Stores: ${counts[3]}`);
    console.log(`   Pages: ${counts[4]}`);
    console.log(`   Homepage Sections: ${counts[5]}`);
    console.log('\n🔐 Admin Login:');
    console.log('   Email: admin@techverse.com');
    console.log('   Password: admin123');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;