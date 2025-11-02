#!/usr/bin/env node

import ComprehensiveSeed from './comprehensive-seed.js';

console.log('🚀 Starting comprehensive seed test...');

const seeder = new ComprehensiveSeed();
seeder.seed().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});