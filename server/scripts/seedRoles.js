#!/usr/bin/env node

/**
 * Role Seeder Script
 * Seeds default roles into the database
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.development') });

import mongoose from 'mongoose';
import { runRoleSeeder } from '../src/seeds/seedRoles.js';
import logger from '../src/utils/logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techverse_dev';

async function main() {
  try {
    console.log('🚀 Starting Role Seeder...\n');
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 MongoDB URI: ${MONGODB_URI}\n`);

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully\n');

    // Run the seeder
    console.log('🌱 Seeding roles...');
    const result = await runRoleSeeder();

    console.log('\n📊 Seeding Results:');
    console.log(`   ✅ Roles created: ${result.roles.created}`);
    console.log(`   🔄 Roles updated: ${result.roles.updated}`);
    console.log(`   ⏭️  Roles skipped: ${result.roles.skipped}`);
    console.log(`   👥 Users updated: ${result.users.updated}`);

    console.log('\n✨ Role seeding completed successfully!');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during role seeding:');
    console.error(error);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

main();
