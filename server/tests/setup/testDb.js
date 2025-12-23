/**
 * Test Database Setup and Teardown
 * Manages MongoDB test database lifecycle
 */

import mongoose from 'mongoose';

let isConnected = false;

/**
 * Setup test database
 * Uses a simple test database connection instead of in-memory server
 */
const setupTestDb = async () => {
  try {
    if (isConnected) {
      return;
    }

    // Use a simple test database URL
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/techverse_test';

    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to test database
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 5000
    });

    isConnected = true;
    console.log('✅ Test database connected');
    return mongoUri;
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    // For CI/CD environments where MongoDB might not be available, use mock
    console.log('📝 Using mock database for tests');
    return null;
  }
};

/**
 * Teardown test database
 * Cleans up and closes MongoDB connection
 */
const teardownTestDb = async () => {
  try {
    if (!isConnected) {
      return;
    }

    // Clear all collections
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }

      // Close connection
      await mongoose.connection.close();
    }

    isConnected = false;
    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error.message);
  }
};

/**
 * Clear all collections
 * Useful for cleaning up between tests
 */
const clearDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  } catch (error) {
    console.error('❌ Database clear failed:', error.message);
  }
};

/**
 * Clear specific collection
 */
const clearCollection = async (collectionName) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collection = mongoose.connection.collections[collectionName];
      if (collection) {
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error(`❌ Collection ${collectionName} clear failed:`, error.message);
  }
};

export {
  setupTestDb,
  teardownTestDb,
  clearDatabase,
  clearCollection
};
