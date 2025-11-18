/**
 * Test Database Setup and Teardown
 * Manages MongoDB test database lifecycle
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Setup test database
 * Creates an in-memory MongoDB instance for testing
 */
const setupTestDb = async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Test database connected');
    return mongoUri;
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
};

/**
 * Teardown test database
 * Cleans up and closes MongoDB connection
 */
const teardownTestDb = async () => {
  try {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    // Close connection
    await mongoose.connection.close();

    // Stop MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error);
    throw error;
  }
};

/**
 * Clear all collections
 * Useful for cleaning up between tests
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Clear specific collection
 */
const clearCollection = async (collectionName) => {
  const collection = mongoose.connection.collections[collectionName];
  if (collection) {
    await collection.deleteMany({});
  }
};

module.exports = {
  setupTestDb,
  teardownTestDb,
  clearDatabase,
  clearCollection
};
