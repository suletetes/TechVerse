#!/usr/bin/env node

/**
 * TechVerse API Integration Test Suite
 * 
 * This script tests the complete API integration between client and server
 * to ensure all endpoints are working correctly.
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Test function wrapper
async function test(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await testFn();
    console.log(`   ✅ PASSED`);
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// Assertion helpers
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertExists(value, message = '') {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value should exist');
  }
}

// Test Suite
async function runIntegrationTests() {
  console.log('🚀 TechVerse API Integration Test Suite');
  console.log('=====================================\n');

  // Test 1: Health Check
  await test('Health Check', async () => {
    const { data, status } = await apiRequest('/health');
    assertEqual(status, 200, 'Health check status');
    assertEqual(data.status, 'OK', 'Health check response');
    assertExists(data.message, 'Health check message');
  });

  // Test 2: Get All Products
  await test('Get All Products', async () => {
    const { data, status } = await apiRequest('/products');
    assertEqual(status, 200, 'Products status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
    assertTrue(data.data.products.length > 0, 'Products not empty');

    // Check product structure
    const product = data.data.products[0];
    assertExists(product._id, 'Product ID');
    assertExists(product.name, 'Product name');
    assertExists(product.price, 'Product price');
  });

  // Test 3: Get Categories
  await test('Get Categories', async () => {
    const { data, status } = await apiRequest('/products/categories');
    assertEqual(status, 200, 'Categories status');
    assertTrue(data.success, 'Response success flag');
    assertTrue(Array.isArray(data.data), 'Categories is array');
    assertTrue(data.data.length > 0, 'Categories not empty');

    // Check category structure
    const category = data.data[0];
    assertExists(category._id, 'Category ID');
    assertExists(category.name, 'Category name');
    assertExists(category.slug, 'Category slug');
  });

  // Test 4: Get Latest Products
  await test('Get Latest Products', async () => {
    const { data, status } = await apiRequest('/products/latest?limit=5');
    assertEqual(status, 200, 'Latest products status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
    assertTrue(data.data.products.length <= 5, 'Respects limit parameter');
  });

  // Test 5: Get Top Sellers
  await test('Get Top Sellers', async () => {
    const { data, status } = await apiRequest('/products/top-sellers?limit=5');
    assertEqual(status, 200, 'Top sellers status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
  });

  // Test 6: Get Quick Picks
  await test('Get Quick Picks', async () => {
    const { data, status } = await apiRequest('/products/quick-picks?limit=5');
    assertEqual(status, 200, 'Quick picks status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
  });

  // Test 7: Get Weekly Deals
  await test('Get Weekly Deals', async () => {
    const { data, status } = await apiRequest('/products/on-sale?limit=5');
    assertEqual(status, 200, 'Weekly deals status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
  });

  // Test 8: Get Featured Products
  await test('Get Featured Products', async () => {
    const { data, status } = await apiRequest('/products/featured?limit=5');
    assertEqual(status, 200, 'Featured products status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
  });

  // Test 9: Search Products
  await test('Search Products', async () => {
    const { data, status } = await apiRequest('/products/search?q=macbook&limit=5');
    assertEqual(status, 200, 'Search status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
  });

  // Test 10: Get Single Product
  await test('Get Single Product', async () => {
    // First get a product ID
    const { data: productsData } = await apiRequest('/products?limit=1');
    const productId = productsData.data.products[0]._id;

    const { data, status } = await apiRequest(`/products/${productId}`);
    assertEqual(status, 200, 'Single product status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.product, 'Product object');
    assertEqual(data.data.product._id, productId, 'Correct product returned');
  });

  // Test 11: Admin Login
  await test('Admin Login', async () => {
    const { data, status } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@techverse.com',
        password: 'Admin123!'
      })
    });

    assertEqual(status, 200, 'Login status');
    assertTrue(data.success, 'Login success flag');
    assertExists(data.data.token, 'Auth token');
    assertExists(data.data.user, 'User object');
    assertEqual(data.data.user.role, 'admin', 'Admin role');

    // Store token for subsequent tests
    authToken = data.data.token;
  });

  // Test 12: Admin Dashboard (Requires Auth)
  await test('Admin Dashboard', async () => {
    const { data, status } = await apiRequest('/admin/dashboard');
    assertEqual(status, 200, 'Dashboard status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.overview, 'Overview data');
    assertExists(data.data.overview.totalProducts, 'Total products count');
    assertExists(data.data.overview.totalUsers, 'Total users count');
  });

  // Test 13: Get All Sections (Requires Auth)
  await test('Get All Sections', async () => {
    const { data, status } = await apiRequest('/admin/sections');
    assertEqual(status, 200, 'Sections status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.sections, 'Sections array');
    assertTrue(Array.isArray(data.data.sections), 'Sections is array');
    assertEqual(data.data.sections.length, 4, 'Four sections exist');

    // Check section structure
    const section = data.data.sections[0];
    assertExists(section.name, 'Section name');
    assertExists(section.displayName, 'Section display name');
    assertTrue(typeof section.productCount === 'number', 'Product count is number');
  });

  // Test 14: Get Section Products (Requires Auth)
  await test('Get Section Products', async () => {
    const { data, status } = await apiRequest('/admin/sections/latest');
    assertEqual(status, 200, 'Section products status');
    assertTrue(data.success, 'Response success flag');
    assertExists(data.data.products, 'Products array');
    assertTrue(Array.isArray(data.data.products), 'Products is array');
    assertEqual(data.data.section, 'latest', 'Correct section');
  });

  // Test 15: Pagination Test
  await test('Pagination', async () => {
    const { data: page1 } = await apiRequest('/products?page=1&limit=2');
    const { data: page2 } = await apiRequest('/products?page=2&limit=2');

    assertTrue(page1.data.products.length <= 2, 'Page 1 respects limit');
    assertTrue(page2.data.products.length <= 2, 'Page 2 respects limit');

    if (page1.data.products.length > 0 && page2.data.products.length > 0) {
      assertTrue(
        page1.data.products[0]._id !== page2.data.products[0]._id,
        'Different products on different pages'
      );
    }
  });

  // Test 16: Error Handling
  await test('Error Handling - Invalid Product ID', async () => {
    const { status } = await apiRequest('/products/invalid-id');
    assertTrue(status >= 400, 'Returns error status for invalid ID');
  });

  // Test 17: CORS Headers
  await test('CORS Headers', async () => {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'OPTIONS'
    });

    assertTrue(response.status === 200 || response.status === 204, 'OPTIONS request succeeds');
  });

  // Print Results
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
  }

  console.log('\n🎯 INTEGRATION STATUS:');
  if (results.failed === 0) {
    console.log('   🟢 ALL TESTS PASSED - Integration is working correctly!');
  } else if (results.failed <= 2) {
    console.log('   🟡 MOSTLY WORKING - Minor issues detected');
  } else {
    console.log('   🔴 INTEGRATION ISSUES - Multiple failures detected');
  }

  console.log('\n📋 NEXT STEPS:');
  if (results.failed === 0) {
    console.log('   1. ✅ Start the client application');
    console.log('   2. ✅ Test the frontend integration');
    console.log('   3. ✅ Verify admin panel functionality');
    console.log('   4. ✅ Test section management features');
  } else {
    console.log('   1. 🔧 Fix failing API endpoints');
    console.log('   2. 🔄 Re-run integration tests');
    console.log('   3. 📝 Check server logs for errors');
    console.log('   4. 🔍 Verify database connection and data');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});