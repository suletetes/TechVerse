import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techverse';
    
    // Log connection attempt
    logger.info('Attempting to connect to MongoDB...', {
      uri: mongoUri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
      environment: process.env.NODE_ENV || 'development'
    });

    const conn = await mongoose.connect(mongoUri, {
      // Remove deprecated options - these are now defaults in Mongoose 6+
    });

    // Log successful connection with details
    logger.info('MongoDB Connected Successfully', {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name,
      readyState: conn.connection.readyState,
      connectionId: conn.connection.id
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    // Enhanced connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error occurred', err, {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host
      });
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected', {
        timestamp: new Date().toISOString(),
        readyState: mongoose.connection.readyState
      });
      console.log('📦 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected', {
        timestamp: new Date().toISOString(),
        host: mongoose.connection.host
      });
      console.log('📦 MongoDB reconnected');
    });

    mongoose.connection.on('connecting', () => {
      logger.info('MongoDB connecting...', {
        timestamp: new Date().toISOString()
      });
    });

    // Log connection state changes
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established', {
        timestamp: new Date().toISOString(),
        host: mongoose.connection.host,
        database: mongoose.connection.name
      });
    });

    // Graceful shutdown with enhanced logging
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Closing MongoDB connection...`);
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed successfully');
        console.log('📦 MongoDB connection closed through app termination');
      } catch (error) {
        logger.error('Error closing MongoDB connection', error);
      }
    };

    process.on('SIGINT', async () => {
      await gracefulShutdown('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await gracefulShutdown('SIGTERM');
      process.exit(0);
    });

    // Return connection for testing purposes
    return conn;

  } catch (error) {
    logger.error('Database connection failed', error, {
      uri: (process.env.MONGODB_URI || 'mongodb://localhost:27017/techverse').replace(/\/\/.*@/, '//***:***@'),
      environment: process.env.NODE_ENV || 'development'
    });
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;