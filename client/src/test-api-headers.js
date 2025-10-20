/**
 * Browser-compatible API Configuration Test
 * Run this in browser console to verify headers and configuration
 */

import { apiClient } from './api/interceptors/index.js';
import { tokenManager } from './utils/tokenManager.js';

// Test function to verify API configuration
window.testApiConfig = async function() {
  console.log('🧪 API Configuration Test');
  console.log('========================\n');

  // Test 1: Base URL
  console.log('1️⃣ Base URL:', apiClient.baseURL);
  
  // Test 2: Set test token
  console.log('\n2️⃣ Setting test token...');
  tokenManager.setToken('test-jwt-token-for-headers');
  
  // Test 3: Mock fetch to intercept and show headers
  const originalFetch = window.fetch;
  let capturedRequest = null;
  
  window.fetch = async function(url, options) {
    capturedRequest = { url, options };
    console.log('\n3️⃣ Intercepted Request:');
    console.log('   URL:', url);
    console.log('   Method:', options.method || 'GET');
    console.log('   Headers:', JSON.stringify(options.headers, null, 2));
    
    // Return mock response
    return {
      ok: true,
      status: 200,
      headers: {
        get: (name) => name === 'content-type' ? 'application/json' : null
      },
      json: async () => ({ success: true, test: true })
    };
  };
  
  // Test 4: Make test request
  console.log('\n4️⃣ Making test API request...');
  try {
    await apiClient.get('/test-endpoint');
    
    // Verify Authorization header
    const authHeader = capturedRequest?.options?.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('   ✅ Authorization header present:', authHeader);
    } else {
      console.log('   ❌ Authorization header missing or invalid');
    }
    
    // Verify Content-Type
    const contentType = capturedRequest?.options?.headers?.['Content-Type'];
    if (contentType === 'application/json') {
      console.log('   ✅ Content-Type header correct:', contentType);
    } else {
      console.log('   ❌ Content-Type header incorrect:', contentType);
    }
    
    // Verify base URL
    if (capturedRequest?.url?.startsWith('http://localhost:5000/api/')) {
      console.log('   ✅ Base URL correct');
    } else {
      console.log('   ❌ Base URL incorrect:', capturedRequest?.url);
    }
    
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
  }
  
  // Restore original fetch
  window.fetch = originalFetch;
  
  // Test 5: Clear tokens and test without auth
  console.log('\n5️⃣ Testing without token...');
  tokenManager.clearTokens();
  
  window.fetch = async function(url, options) {
    console.log('   Headers without token:', JSON.stringify(options.headers, null, 2));
    
    const authHeader = options.headers?.Authorization;
    if (!authHeader) {
      console.log('   ✅ No Authorization header when token cleared');
    } else {
      console.log('   ❌ Authorization header still present:', authHeader);
    }
    
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true })
    };
  };
  
  await apiClient.get('/test-no-auth');
  window.fetch = originalFetch;
  
  console.log('\n🎯 Test Complete!');
  console.log('   Run this in browser console after loading the app');
  console.log('   All tests should show ✅ for proper configuration');
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('API Configuration Test loaded. Run testApiConfig() to test.');
}