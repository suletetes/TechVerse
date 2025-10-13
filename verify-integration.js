#!/usr/bin/env node

/**
 * TechVerse Integration Verification Script
 * 
 * This script verifies that the backend-frontend integration is working correctly.
 * Run this after setting up the database and starting the servers.
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';

const API_BASE = 'http://localhost:5001/api';
const CLIENT_BASE = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkEndpoint = async (url, description) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.success) {
      log(`✅ ${description}`, 'green');
      return true;
    } else {
      log(`❌ ${description} - ${data.message || 'Failed'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${description} - ${error.message}`, 'red');
    return false;
  }
};

const checkServer = async (url, name) => {
  try {
    const response = await fetch(url);
    if (response.ok) {
      log(`✅ ${name} server is running`, 'green');
      return true;
    } else {
      log(`❌ ${name} server returned ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${name} server is not running - ${error.message}`, 'red');
    return false;
  }
};

const main = async () => {
  log('\n🔍 TechVerse Integration Verification\n', 'bold');
  
  let passed = 0;
  let total = 0;
  
  // Check if servers are running
  log('📡 Checking Servers...', 'blue');
  total += 2;
  if (await checkServer(`${API_BASE}/health`, 'Backend API')) passed++;
  if (await checkServer(CLIENT_BASE, 'Frontend Client')) passed++;
  
  // Check API endpoints
  log('\n🔌 Checking API Endpoints...', 'blue');
  const endpoints = [
    [`${API_BASE}/products/latest`, 'Latest Products API'],
    [`${API_BASE}/products/top-sellers`, 'Top Sellers API'],
    [`${API_BASE}/products/quick-picks`, 'Quick Picks API'],
    [`${API_BASE}/products/weekly-deals`, 'Weekly Deals API'],
    [`${API_BASE}/stores`, 'Stores API'],
    [`${API_BASE}/pages/delivery`, 'Pages API'],
    [`${API_BASE}/products/categories`, 'Categories API']
  ];
  
  for (const [url, description] of endpoints) {
    total++;
    if (await checkEndpoint(url, description)) passed++;
  }
  
  // Check database seeding
  log('\n💾 Checking Database Content...', 'blue');
  try {
    const productsResponse = await fetch(`${API_BASE}/products/latest?limit=1`);
    const productsData = await productsResponse.json();
    
    total++;
    if (productsData.success && productsData.data.products.length > 0) {
      log('✅ Database has seeded products', 'green');
      passed++;
    } else {
      log('❌ Database appears empty - run "npm run seed" in server directory', 'red');
    }
  } catch (error) {
    total++;
    log(`❌ Could not check database content - ${error.message}`, 'red');
  }
  
  // Summary
  log('\n📊 Verification Summary', 'bold');
  log(`Passed: ${passed}/${total} checks`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All checks passed! Integration is working correctly.', 'green');
    log('\n🚀 You can now:', 'blue');
    log('   • Visit http://localhost:3000 to see the integrated frontend');
    log('   • Login with admin@techverse.com / admin123 for admin access');
    log('   • Check the homepage sections loading real data from API');
    log('   • Test the admin panel for managing homepage content');
  } else {
    log('\n⚠️  Some checks failed. Please ensure:', 'yellow');
    log('   • MongoDB is running and accessible');
    log('   • Backend server is started (npm run dev in server/)');
    log('   • Frontend client is started (npm run dev in client/)');
    log('   • Database is seeded (npm run seed in server/)');
    log('   • Environment variables are configured');
  }
  
  log('');
};

// Run verification
main().catch(error => {
  log(`\n💥 Verification failed: ${error.message}`, 'red');
  process.exit(1);
});