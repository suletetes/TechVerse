/**
 * API Configuration Integration Test
 * 
 * This test verifies:
 * 1. Base URL configuration
 * 2. Authorization header injection
 * 3. Error response handling
 * 4. Token management
 */

import { apiClient, handleApiResponse } from '../api/interceptors/index.js';
import { tokenManager } from '../utils/tokenManager.js';
import API_BASE_URL from '../api/config.js';

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test helper function
function test(name, testFn) {
  try {
    const result = testFn();
    if (result === true || result === undefined) {
      console.log(`✅ ${name}`);
      testResults.passed++;
      testResults.tests.push({ name, status: 'PASSED' });
    } else {
      console.log(`❌ ${name}: ${result}`);
      testResults.failed++;
      testResults.tests.push({ name, status: 'FAILED', error: result });
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// Mock fetch for testing
let mockFetchCalls = [];
const originalFetch = globalThis.fetch;

function mockFetch(url, options) {
  mockFetchCalls.push({ url, options });
  
  // Return successful response by default
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: {
      get: (name) => {
        if (name === 'content-type') return 'application/json';
        return null;
      }
    },
    json: () => Promise.resolve({
      success: true,
      message: 'Test response',
      data: { test: true }
    })
  });
}

// Test suite
export async function runApiConfigTests() {
  console.log('🧪 API Configuration Integration Tests');
  console.log('=====================================\n');

  // Setup mock fetch
  globalThis.fetch = mockFetch;
  mockFetchCalls = [];

  // Test 1: Base URL Configuration
  test('Base URL points to correct server', () => {
    const expectedUrl = 'http://localhost:5000/api';
    if (API_BASE_URL === expectedUrl) {
      return true;
    }
    return `Expected ${expectedUrl}, got ${API_BASE_URL}`;
  });

  // Test 2: API Client Base URL
  test('API Client uses correct base URL', () => {
    if (apiClient.baseURL === API_BASE_URL) {
      return true;
    }
    return `API Client baseURL mismatch: ${apiClient.baseURL} vs ${API_BASE_URL}`;
  });

  // Test 3: Request without token
  test('Request without token (no auth header)', async () => {
    tokenManager.clearTokens();
    mockFetchCalls = [];
    
    await apiClient.get('/test');
    
    const call = mockFetchCalls[0];
    if (!call.options.headers.Authorization) {
      return true;
    }
    return 'Authorization header present when no token set';
  });

  // Test 4: Request with token
  test('Request with token includes Authorization header', async () => {
    const testToken = 'test-jwt-token-12345';
    tokenManager.setToken(testToken);
    mockFetchCalls = [];
    
    await apiClient.get('/test');
    
    const call = mockFetchCalls[0];
    const authHeader = call.options.headers.Authorization;
    
    if (authHeader === `Bearer ${testToken}`) {
      return true;
    }
    return `Expected "Bearer ${testToken}", got "${authHeader}"`;
  });

  // Test 5: Content-Type header
  test('Requests include correct Content-Type header', async () => {
    mockFetchCalls = [];
    
    await apiClient.get('/test');
    
    const call = mockFetchCalls[0];
    const contentType = call.options.headers['Content-Type'];
    
    if (contentType === 'application/json') {
      return true;
    }
    return `Expected "application/json", got "${contentType}"`;
  });

  // Test 6: Request ID header
  test('Requests include X-Request-ID header', async () => {
    mockFetchCalls = [];
    
    await apiClient.get('/test');
    
    const call = mockFetchCalls[0];
    const requestId = call.options.headers['X-Request-ID'];
    
    if (requestId && requestId.startsWith('req_')) {
      return true;
    }
    return `Missing or invalid X-Request-ID header: ${requestId}`;
  });

  // Test 7: POST request with data
  test('POST request serializes data correctly', async () => {
    mockFetchCalls = [];
    const testData = { name: 'Test Product', price: 99.99 };
    
    await apiClient.post('/test', testData);
    
    const call = mockFetchCalls[0];
    
    if (call.options.method === 'POST' && 
        call.options.body === JSON.stringify(testData)) {
      return true;
    }
    return 'POST data not serialized correctly';
  });

  // Test 8: Error response handling
  test('Error responses are handled consistently', async () => {
    // Mock error response
    globalThis.fetch = () => Promise.resolve({
      ok: false,
      status: 400,
      headers: {
        get: () => 'application/json'
      },
      json: () => Promise.resolve({
        success: false,
        message: 'Validation error',
        errors: { name: 'Name is required' }
      })
    });

    try {
      const response = await apiClient.get('/test-error');
      await handleApiResponse(response);
      return 'Should have thrown an error';
    } catch (error) {
      if (error.status === 400 && 
          error.message === 'Validation error' &&
          error.data.errors) {
        return true;
      }
      return `Incorrect error format: ${JSON.stringify(error)}`;
    }
  });

  // Test 9: Token manager functionality
  test('Token manager stores and retrieves tokens', () => {
    const testToken = 'test-token-123';
    const testRefreshToken = 'refresh-token-456';
    
    tokenManager.setToken(testToken);
    tokenManager.setRefreshToken(testRefreshToken);
    
    if (tokenManager.getToken() === testToken &&
        tokenManager.getRefreshToken() === testRefreshToken) {
      
      tokenManager.clearTokens();
      
      if (!tokenManager.getToken() && !tokenManager.getRefreshToken()) {
        return true;
      }
      return 'Token clearing failed';
    }
    return 'Token storage/retrieval failed';
  });

  // Test 10: File upload handling
  test('File upload removes Content-Type header', async () => {
    mockFetchCalls = [];
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }));
    
    await apiClient.upload('/upload', formData);
    
    const call = mockFetchCalls[0];
    
    if (!call.options.headers['Content-Type']) {
      return true;
    }
    return 'Content-Type header not removed for file upload';
  });

  // Restore original fetch
  globalThis.fetch = originalFetch;

  // Print results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   • ${t.name}: ${t.error}`));
  }

  return testResults;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runApiConfigTests = runApiConfigTests;
  console.log('API Config Tests loaded. Run runApiConfigTests() to execute.');
}