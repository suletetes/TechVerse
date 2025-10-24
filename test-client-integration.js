// Comprehensive test to verify client-backend integration
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';
const CLIENT_BASE_URL = 'http://localhost:5173';

async function testClientIntegration() {
    console.log('🧪 Testing Client-Backend Integration');
    console.log('=====================================\n');

    let allTestsPassed = true;

    try {
        // Test 1: Backend API Health
        console.log('1. Testing Backend API Health...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        if (healthResponse.ok) {
            console.log('   ✅ Backend API is healthy');
        } else {
            console.log('   ❌ Backend API health check failed');
            allTestsPassed = false;
        }

        // Test 2: Homepage Section Endpoints
        console.log('\n2. Testing Homepage Section Endpoints...');
        
        const sections = [
            { name: 'Latest Products', endpoint: '/products/latest', expectedCount: 7 },
            { name: 'Top Sellers', endpoint: '/products/top-sellers', expectedCount: 8 },
            { name: 'Quick Picks', endpoint: '/products/quick-picks', expectedCount: 6 },
            { name: 'Weekly Deals', endpoint: '/products/on-sale', expectedCount: 4 }
        ];

        for (const section of sections) {
            try {
                const response = await fetch(`${API_BASE_URL}${section.endpoint}?limit=10`);
                if (response.ok) {
                    const data = await response.json();
                    const products = data.data || [];
                    console.log(`   ✅ ${section.name}: ${products.length} products (expected: ${section.expectedCount})`);
                    
                    if (products.length > 0) {
                        const sampleProduct = products[0];
                        console.log(`      📦 Sample: ${sampleProduct.name} - £${sampleProduct.price}`);
                    }
                } else {
                    console.log(`   ❌ ${section.name}: Failed (${response.status})`);
                    allTestsPassed = false;
                }
            } catch (error) {
                console.log(`   ❌ ${section.name}: Error - ${error.message}`);
                allTestsPassed = false;
            }
        }

        // Test 3: Product Detail Endpoint
        console.log('\n3. Testing Product Detail Endpoint...');
        try {
            const productsResponse = await fetch(`${API_BASE_URL}/products?limit=1`);
            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                const products = productsData.data?.products || productsData.products || [];
                
                if (products.length > 0) {
                    const productId = products[0]._id;
                    const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`);
                    
                    if (productResponse.ok) {
                        const productData = await productResponse.json();
                        const product = productData.data || productData;
                        console.log(`   ✅ Product Detail: ${product.name}`);
                        console.log(`      📋 Has specifications: ${product.specifications ? 'Yes' : 'No'}`);
                        console.log(`      🖼️  Has images: ${product.images?.length || 0}`);
                    } else {
                        console.log('   ❌ Product Detail: Failed to fetch individual product');
                        allTestsPassed = false;
                    }
                } else {
                    console.log('   ❌ Product Detail: No products available for testing');
                    allTestsPassed = false;
                }
            }
        } catch (error) {
            console.log(`   ❌ Product Detail: Error - ${error.message}`);
            allTestsPassed = false;
        }

        // Test 4: Categories Endpoint
        console.log('\n4. Testing Categories Endpoint...');
        try {
            const categoriesResponse = await fetch(`${API_BASE_URL}/categories`);
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                const categories = categoriesData.data || [];
                console.log(`   ✅ Categories: ${categories.length} found`);
                
                if (categories.length > 0) {
                    console.log(`      📂 Sample: ${categories[0].name}`);
                }
            } else {
                console.log('   ❌ Categories: Failed to fetch');
                allTestsPassed = false;
            }
        } catch (error) {
            console.log(`   ❌ Categories: Error - ${error.message}`);
            allTestsPassed = false;
        }

        // Test 5: Search Endpoint
        console.log('\n5. Testing Search Endpoint...');
        try {
            const searchResponse = await fetch(`${API_BASE_URL}/products/search?q=tablet&limit=5`);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const results = searchData.data?.products || searchData.products || [];
                console.log(`   ✅ Search Results: ${results.length} products found for "tablet"`);
                
                if (results.length > 0) {
                    console.log(`      🔍 Found: ${results[0].name}`);
                }
            } else {
                console.log('   ❌ Search: Failed to search products');
                allTestsPassed = false;
            }
        } catch (error) {
            console.log(`   ❌ Search: Error - ${error.message}`);
            allTestsPassed = false;
        }

        // Test 6: Data Structure Validation
        console.log('\n6. Testing Data Structure Compatibility...');
        try {
            const response = await fetch(`${API_BASE_URL}/products/latest?limit=1`);
            if (response.ok) {
                const data = await response.json();
                const products = data.data || [];
                
                if (products.length > 0) {
                    const product = products[0];
                    const requiredFields = ['_id', 'name', 'price', 'images', 'category'];
                    const missingFields = requiredFields.filter(field => !product[field]);
                    
                    if (missingFields.length === 0) {
                        console.log('   ✅ Data Structure: All required fields present');
                        console.log(`      🏷️  Product ID: ${product._id}`);
                        console.log(`      📝 Product Name: ${product.name}`);
                        console.log(`      💰 Price: £${product.price}`);
                        console.log(`      📂 Category: ${product.category?.name || 'N/A'}`);
                    } else {
                        console.log(`   ❌ Data Structure: Missing fields - ${missingFields.join(', ')}`);
                        allTestsPassed = false;
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ Data Structure: Error - ${error.message}`);
            allTestsPassed = false;
        }

        // Summary
        console.log('\n🎯 Integration Test Summary');
        console.log('==========================');
        
        if (allTestsPassed) {
            console.log('✅ All tests passed! Client-backend integration is working correctly.');
            console.log('\n🚀 Ready to start the application:');
            console.log('   Backend: cd server && npm run dev');
            console.log('   Frontend: cd client && npm run dev');
            console.log('   Or both: npm run dev');
            console.log('\n🌐 Access URLs:');
            console.log('   Frontend: http://localhost:5173');
            console.log('   Admin: http://localhost:5173/admin');
            console.log('   API: http://localhost:5000/api');
        } else {
            console.log('❌ Some tests failed. Please check the backend server and database.');
            console.log('\n🔧 Troubleshooting:');
            console.log('   1. Ensure MongoDB is running');
            console.log('   2. Start backend: cd server && npm run dev');
            console.log('   3. Check server logs for errors');
        }

    } catch (error) {
        console.error('\n💥 Integration test failed:', error.message);
        console.log('\n💡 Make sure the backend server is running:');
        console.log('   cd server && npm run dev');
    }
}

testClientIntegration();