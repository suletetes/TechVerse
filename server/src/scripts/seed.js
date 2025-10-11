#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script populates the database with sample data for development and testing.
 * 
 * Usage:
 *   npm run seed
 *   node src/scripts/seed.js
 */

import { seedDatabase } from '../seeds/seedData.js';

console.log('🚀 TechVerse Database Seeding Script');
console.log('=====================================\n');

seedDatabase();