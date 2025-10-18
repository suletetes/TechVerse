// Manual verification script for API integration
import { productService } from '../api/services/index.js';

async function testApiIntegration() {
  console.log('🧪 Testing API Integration...\n');

  try {
    // Test Latest Products
    console.log('📦 Testing Latest Products...');
    const latestProducts = await productService.getLatestProducts(3);
    console.log(`✅ Latest Products: ${latestProducts.data?.products?.length || 0} products loaded`);
    
    // Test Top Selling Products
    console.log('🏆 Testing Top Selling Products...');
    const topSellingProducts = await productService.getTopSellingProducts(3);
    console.log(`✅ Top Selling Products: ${topSellingProducts.data?.products?.length || 0} products loaded`);
    
    // Test Quick Picks
    console.log('⚡ Testing Quick Picks...');
    const quickPicks = await productService.getQuickPicks(3);
    console.log(`✅ Quick Picks: ${quickPicks.data?.products?.length || 0} products loaded`);
    
    // Test Products on Sale
    console.log('💰 Testing Products on Sale...');
    const productsOnSale = await productService.getProductsOnSale(3);
    console.log(`✅ Products on Sale: ${productsOnSale.data?.products?.length || 0} products loaded`);
    
    console.log('\n🎉 All API endpoints are working correctly!');
    
    // Test data transformation
    if (latestProducts.data?.products?.length > 0) {
      const product = latestProducts.data.products[0];
      console.log('\n📋 Sample Product Data Structure:');
      console.log(`- ID: ${product._id}`);
      console.log(`- Name: ${product.name}`);
      console.log(`- Price: £${product.price}`);
      console.log(`- Images: ${product.images?.length || 0} images`);
      console.log(`- Category: ${product.category?.name || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ API Integration Test Failed:', error.message);
  }
}

// Export for use in other files
export { testApiIntegration };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testApiIntegration();
}