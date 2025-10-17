// Simple API test script
const API_BASE = 'http://localhost:5000/api';

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   URL: ${API_BASE}${endpoint}`);
    
    const response = await fetch(`${API_BASE}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Data count: ${data.data?.products?.length || data.data?.length || 'N/A'}`);
      if (data.data?.products?.length > 0) {
        console.log(`   📝 First item: ${data.data.products[0].name}`);
      }
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   💬 Message: ${data.message}`);
    }
  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 TechVerse API Integration Test');
  console.log('==================================');
  
  // Test health endpoint
  await testEndpoint('/health', 'Health Check');
  
  // Test product endpoints
  await testEndpoint('/products', 'All Products');
  await testEndpoint('/products/latest', 'Latest Products');
  await testEndpoint('/products/top-sellers', 'Top Selling Products');
  await testEndpoint('/products/quick-picks', 'Quick Picks');
  await testEndpoint('/products/on-sale', 'Products on Sale (Weekly Deals)');
  await testEndpoint('/products/featured', 'Featured Products');
  await testEndpoint('/products/categories', 'Categories');
  
  console.log('\n🎉 API Test Complete!');
}

runTests();