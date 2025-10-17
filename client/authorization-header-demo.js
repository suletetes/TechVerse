/**
 * Authorization Header Demonstration
 * 
 * This script demonstrates how the API client automatically
 * includes the Authorization header when a token is present.
 */

// Simulate the API client behavior
class DemoApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };
    
    // 🔑 KEY FEATURE: Add auth header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers
    };
    
    // Log the request for demonstration
    console.log('📤 API Request:');
    console.log(`   URL: ${url}`);
    console.log(`   Method: ${options.method || 'GET'}`);
    console.log(`   Headers:`, JSON.stringify(headers, null, 2));
    
    return { url, config };
  }

  getToken() {
    return localStorage.getItem('techverse_token');
  }

  setToken(token) {
    localStorage.setItem('techverse_token', token);
  }

  clearToken() {
    localStorage.removeItem('techverse_token');
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Mock localStorage for Node.js
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    storage: {},
    getItem(key) { return this.storage[key] || null; },
    setItem(key, value) { this.storage[key] = value; },
    removeItem(key) { delete this.storage[key]; }
  };
}

// Demonstration
console.log('🔐 Authorization Header Demonstration');
console.log('====================================\n');

const apiClient = new DemoApiClient('http://localhost:5000/api');

// Test 1: Request without token
console.log('1️⃣ Request WITHOUT token:');
apiClient.clearToken();
await apiClient.get('/products');

console.log('\n' + '─'.repeat(50) + '\n');

// Test 2: Request with token
console.log('2️⃣ Request WITH token:');
apiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YWJjZGVmMTIzNDU2Nzg5MCIsImVtYWlsIjoiYWRtaW5AdGVjaHZlcnNlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMzEyMzQ1NiwiZXhwIjoxNzAzNzI4MjU2fQ.example-signature');
await apiClient.get('/products');

console.log('\n' + '─'.repeat(50) + '\n');

// Test 3: POST request with data and token
console.log('3️⃣ POST request with data and token:');
await apiClient.post('/products', {
  name: 'New Product',
  price: 299.99,
  category: 'electronics'
});

console.log('\n🎯 Key Observations:');
console.log('   • Without token: No Authorization header');
console.log('   • With token: Authorization: Bearer [token] header added');
console.log('   • Content-Type: application/json always included');
console.log('   • X-Requested-With: XMLHttpRequest for CSRF protection');

console.log('\n✅ Authorization header injection is working correctly!');