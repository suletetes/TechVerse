/**
 * Setup Search Indexes Script
 * Run this script to create database indexes for optimal search performance
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createSearchIndexes, getSearchIndexStats } from '../src/utils/searchIndexes.js';
import logger from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techverse';

async function setupSearchIndexes() {
  try {
    logger.info('Setting up search indexes...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Create search indexes
    await createSearchIndexes();
    
    // Get index statistics
    const stats = await getSearchIndexStats();
    logger.info('Index Statistics:', stats);
    
    logger.info('Search indexes setup completed successfully!');
    
  } catch (error) {
    logger.error('Error setting up search indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSearchIndexes();
}

export default setupSearchIndexes;