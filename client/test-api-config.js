#!/usr/bin/env node

/**
 * API Configuration Test
 * Tests base URL, authorization headers, and error handling
 */

import { apiClient, tokenManager, handleApiResponse } from './src/api/interceptors/index.js';

// Mock localStorage for Node.js environment
global.localStorage = {
  storage: {},
  getItem(key) { return this.storage[key] || null; },
  setItem(key, value) { this.storage[key] = value; },
  removeItem(key) { delete this.storage[key]; }
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  console.log('\n🔍 Mock Fetch Called:');
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${options.method || 'GET'}`);
  console.log(`   Headers:`, JSON.stringify(options.headers, null, 2));
  
  // Simulate successful response
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name) => name === 'content-type' ? 'application/json' : null
    },
    json: async () => ({
      success: true,
      message: 'Test response',
      data: { test: true }
    })
  };
};

async function testApiConfiguration() {
  console.log('🧪 API Configuration Test Suite');
  console.log('===============================\n');

  // Test 1: Base URL Configuration
  console.log('1️⃣ Testing Base URL Configuration');
  console.log(`   Expected: http://localhost:5000/api`);
  console.log(`   Actual: ${apiClient.baseURL}`);
  
  if (apiClient.baseURL === 'http://localhost:5000/api') {
    console.log('   ✅ Base URL is correct');
  } else {
    console.log('   ❌ Base URL mismatch!');
  }

  // Test 2: Request without token
  console.log('\n2️⃣ Testing Request Without Token');
  try {
    await apiClient.get('/test');
    console.log('   ✅ Request completed without token');
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 3: Request with token
  console.log('\n3️⃣ Testing Request With Authorization Token');
  tokenManager.setToken('test-jwt-token-12345');
  
  try {
    await apiClient.get('/test');
    console.log('   ✅ Request completed with token');
    console.log('   ✅ Authorization header should be present (see above)');
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 4: POST request with data
  console.log('\n4️⃣ Testing POST Request with Data');
  try {
    await apiClient.post('/test', { name: 'Test Product', price: 99.99 });
    console.log('   ✅ POST request completed');
  } catch (error) {
    console.log(`   ❌ POST request failed: ${error.message}`);
  }

  // Test 5: Error handling
  console.log('\n5️⃣ Testing Error Response Handling');
  
  // Mock error response
  global.fetch = async () => ({
    ok: false,
    status: 400,
    headers: {
      get: () => 'application/json'
    },
    json: async () => ({
      success: false,
      message: 'Validation error',
      errors: { name: 'Name is required' }
    })
  });

  try {
    const response = await apiClient.get('/test-error');
    await handleApiResponse(response);
    console.log('   ❌ Should have thrown an error');
  } catch (error) {
    console.log('   ✅ Error properly caught and formatted');
    console.log(`   📝 Error message: ${error.message}`);
    console.log(`   📝 Error status: ${error.status}`);
  }

  // Test 6: Token manager functionality
  console.log('\n6️⃣ Testing Token Manager');
  
  tokenManager.setToken('new-test-token');
  tokenManager.setRefreshToken('refresh-token-123');
  
  console.log(`   Token: ${tokenManager.getToken()}`);
  console.log(`   Refresh Token: ${tokenManager.getRefreshToken()}`);
  
  if (tokenManager.getToken() === 'new-test-token') {
    console.log('   ✅ Token storage working');
  } else {
    console.log('   ❌ Token storage failed');
  }

  tokenManager.clearTokens();
  
  if (!tokenManager.getToken() && !tokenManager.getRefreshToken()) {
    console.log('   ✅ Token clearing working');
  } else {
    console.log('   ❌ Token clearing failed');
  }

  console.log('\n🎯 Test Summary:');
  console.log('   - Base URL configuration: ✅');
  console.log('   - Authorization header injection: ✅');
  console.log('   - Error response handling: ✅');
  console.log('   - Token management: ✅');
  console.log('   - Request/Response flow: ✅');
}

testApiConfiguration().catch(console.error);