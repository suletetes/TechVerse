#!/usr/bin/env node

/**
 * Stock and Pricing Update Script
 * 
 * Updates all products with realistic stock levels and pricing strategy
 * 
 * Usage:
 *   npm run update-stock-pricing
 *   node src/scripts/updateStockPricing.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateStockLevel, 
  generatePricing, 
  generateVariantPriceModifier,
  distributeVariantStock 
} from '../utils/stockPricingGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to product data file
const productDataPath = path.join(__dirname, '../../product-data.js');

/**
 * Update product with realistic stock and pricing
 * @param {Object} product - Product to update
 * @param {number} index - Product index for stock distribution
 * @param {number} total - Total products for distribution
 * @param {string} category - Product category
 * @returns {Object} Updated product
 */
const updateProductStockPricing = (product, index, total, category) => {
  console.log(`Updating ${product.name}...`);

  // Generate realistic stock levels
  const stockConfig = generateStockLevel(index, total);
  
  // Generate realistic pricing
  const pricingConfig = generatePricing(product.price, {
    category,
    brand: product.brand,
    hasDiscount: Math.random() > 0.4 // 60% chance of discount
  });

  // Update variants with stock distribution and price modifiers
  let updatedVariants = product.variants || [];
  if (updatedVariants.length > 0) {
    updatedVariants = distributeVariantStock(updatedVariants, stockConfig);
    
    // Update variant price modifiers
    updatedVariants = updatedVariants.map(variant => ({
      ...variant,
      options: variant.options.map(option => ({
        ...option,
        priceModifier: generateVariantPriceModifier(
          variant.name, 
          option.value, 
          pricingConfig.price
        )
      }))
    }));
  }

  return {
    ...product,
    price: pricingConfig.price,
    originalPrice: pricingConfig.originalPrice,
    compareAtPrice: pricingConfig.compareAtPrice,
    discountPercentage: pricingConfig.discountPercentage,
    discountAmount: pricingConfig.discountAmount,
    hasDiscount: pricingConfig.hasDiscount,
    stock: stockConfig,
    variants: updatedVariants,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Process all products in a category
 * @param {Array} products - Products array
 * @param {string} category - Category name
 * @returns {Array} Updated products
 */
const processCategory = (products, category) => {
  console.log(`\n📦 Processing ${category} category (${products.length} products)`);
  
  return products.map((product, index) => 
    updateProductStockPricing(product, index, products.length, category)
  );
};

/**
 * Main update function
 */
const updateAllProducts = async () => {
  try {
    console.log('🚀 TechVerse Stock & Pricing Update Script');
    console.log('==========================================\n');

    // Read current product data
    console.log('📖 Reading product data...');
    const productDataContent = fs.readFileSync(productDataPath, 'utf8');
    
    // Extract the productData object (this is a simplified approach)
    // In a real scenario, you might want to use a proper parser
    const { productData } = await import(productDataPath);
    
    console.log('✅ Product data loaded successfully');

    // Update each category
    const updatedProductData = {};
    let totalProductsUpdated = 0;

    for (const [category, products] of Object.entries(productData)) {
      if (Array.isArray(products) && products.length > 0) {
        updatedProductData[category] = processCategory(products, category);
        totalProductsUpdated += products.length;
      } else {
        updatedProductData[category] = products;
      }
    }

    // Generate updated file content
    const updatedContent = `// Comprehensive product data for all categories
import { generateVariantsForCategory } from './src/utils/variantGenerator.js';

export const productData = ${JSON.stringify(updatedProductData, null, 2)};

export default productData;
`;

    // Write updated content back to file
    console.log('\n💾 Writing updated product data...');
    fs.writeFileSync(productDataPath, updatedContent, 'utf8');

    console.log('\n✅ Stock and pricing update completed successfully!');
    console.log(`📊 Updated ${totalProductsUpdated} products across ${Object.keys(updatedProductData).length} categories`);
    
    // Generate summary report
    generateSummaryReport(updatedProductData);

  } catch (error) {
    console.error('❌ Error updating stock and pricing:', error);
    process.exit(1);
  }
};

/**
 * Generate summary report of stock and pricing distribution
 * @param {Object} productData - Updated product data
 */
const generateSummaryReport = (productData) => {
  console.log('\n📈 Stock & Pricing Summary Report');
  console.log('==================================');

  let totalProducts = 0;
  let inStockProducts = 0;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;
  let discountedProducts = 0;
  let totalValue = 0;

  for (const [category, products] of Object.entries(productData)) {
    if (Array.isArray(products)) {
      products.forEach(product => {
        totalProducts++;
        totalValue += product.price;

        if (product.hasDiscount) {
          discountedProducts++;
        }

        const stockStatus = product.stock?.quantity > 0 
          ? (product.stock.quantity <= product.stock.lowStockThreshold ? 'low' : 'in')
          : 'out';

        switch (stockStatus) {
          case 'in':
            inStockProducts++;
            break;
          case 'low':
            lowStockProducts++;
            break;
          case 'out':
            outOfStockProducts++;
            break;
        }
      });
    }
  }

  console.log(`📦 Total Products: ${totalProducts}`);
  console.log(`💰 Total Inventory Value: $${totalValue.toLocaleString()}`);
  console.log(`\n📊 Stock Distribution:`);
  console.log(`   ✅ In Stock: ${inStockProducts} (${Math.round(inStockProducts/totalProducts*100)}%)`);
  console.log(`   ⚠️  Low Stock: ${lowStockProducts} (${Math.round(lowStockProducts/totalProducts*100)}%)`);
  console.log(`   ❌ Out of Stock: ${outOfStockProducts} (${Math.round(outOfStockProducts/totalProducts*100)}%)`);
  console.log(`\n💸 Pricing Distribution:`);
  console.log(`   🏷️  Discounted Products: ${discountedProducts} (${Math.round(discountedProducts/totalProducts*100)}%)`);
  console.log(`   💵 Regular Price Products: ${totalProducts - discountedProducts} (${Math.round((totalProducts - discountedProducts)/totalProducts*100)}%)`);
};

// Run the update
updateAllProducts();