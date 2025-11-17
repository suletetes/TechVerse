#!/usr/bin/env node

import ComprehensiveSeed from './seed/index.js';

console.log('🚀 Starting comprehensive seed...');

const seeder = new ComprehensiveSeed();
seeder.seed().catch(error => {
  console.error('❌ Error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});