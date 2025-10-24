// Simple script to test if the backend API is working
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
    try {
        console.log('Testing backend API...');
        
        // Test health endpoint
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        console.log('Health check:', healthResponse.status);
        
        // Test products endpoint
        const productsResponse = await fetch(`${API_BASE_URL}/products`);
        console.log('Products endpoint:', productsResponse.status);
        
        if (productsResponse.ok) {
            const data = await productsResponse.json();
            console.log('Products found:', data.data?.products?.length || 0);
        }
        
        // Test latest products
        const latestResponse = await fetch(`${API_BASE_URL}/products/latest`);
        console.log('Latest products endpoint:', latestResponse.status);
        
        if (latestResponse.ok) {
            const data = await latestResponse.json();
            console.log('Latest products found:', data.data?.length || 0);
        }
        
    } catch (error) {
        console.error('API test failed:', error.message);
        console.log('Make sure the backend server is running on port 5000');
    }
}

testAPI();