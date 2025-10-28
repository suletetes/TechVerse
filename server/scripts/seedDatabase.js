#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script populates the database with sample data for development and testing.
 * 
 * Usage:
 *   npm run seed
 *   npm run seed:dev
 *   node scripts/seedDatabase.js
 */

import { seedDatabase } from '../src/seeds/seedData.js';

console.log('🚀 TechVerse Database Seeding Script');
console.log('=====================================\n');

seedDatabase();