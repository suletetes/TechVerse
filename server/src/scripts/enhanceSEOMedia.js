#!/usr/bin/env node

/**
 * SEO and Media Enhancement Script
 * 
 * Enhances all products with SEO-optimized content and media configurations
 * 
 * Usage:
 *   npm run enhance-seo-media
 *   node src/scripts/enhanceSEOMedia.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateProductSEO, 
  generateProductImages, 
  generateProductFeatures,
  generateProductTags 
} from '../utils/seoGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to product data file
const productDataPath = path.join(__dirname, '../../product-data.js');

/**
 * Enhance product with SEO and media
 * @param {Object} product - Product to enhance
 * @param {string} category - Product category
 * @returns {Object} Enhanced product
 */
const enhanceProduct = (product, category) => {
  console.log(`Enhancing ${product.name}...`);

  // Generate SEO data
  const seoData = generateProductSEO(product, category);
  
  // Generate enhanced images (only if not already enhanced)
  let enhancedImages = product.images || [];
  if (!enhancedImages.some(img => img.width)) {
    enhancedImages = generateProductImages(product, category);
  }
  
  // Generate enhanced features
  const enhancedFeatures = generateProductFeatures(product, category);
  
  // Generate enhanced tags
  const enhancedTags = generateProductTags(product, category);

  return {
    ...product,
    images: enhancedImages,
    features: enhancedFeatures,
    tags: enhancedTags,
    seo: seoData,
    lastEnhanced: new Date().toISOString()
  };
};

/**
 * Process all products in a category
 * @param {Array} products - Products array
 * @param {string} category - Category name
 * @returns {Array} Enhanced products
 */
const processCategory = (products, category) => {
  console.log(`\n🎨 Enhancing ${category} category (${products.length} products)`);
  
  return products.map(product => enhanceProduct(product, category));
};

/**
 * Main enhancement function
 */
const enhanceAllProducts = async () => {
  try {
    console.log('🚀 TechVerse SEO & Media Enhancement Script');
    console.log('===========================================\n');

    // Read current product data
    console.log('📖 Reading product data...');
    const { productData } = await import(productDataPath);
    
    console.log('✅ Product data loaded successfully');

    // Enhance each category
    const enhancedProductData = {};
    let totalProductsEnhanced = 0;

    for (const [category, products] of Object.entries(productData)) {
      if (Array.isArray(products) && products.length > 0) {
        enhancedProductData[category] = processCategory(products, category);
        totalProductsEnhanced += products.length;
      } else {
        enhancedProductData[category] = products;
      }
    }

    // Generate updated file content
    const updatedContent = `// Comprehensive product data for all categories
import { generateVariantsForCategory } from './src/utils/variantGenerator.js';

export const productData = ${JSON.stringify(enhancedProductData, null, 2)};

export default productData;
`;

    // Write updated content back to file
    console.log('\n💾 Writing enhanced product data...');
    fs.writeFileSync(productDataPath, updatedContent, 'utf8');

    console.log('\n✅ SEO and media enhancement completed successfully!');
    console.log(`🎨 Enhanced ${totalProductsEnhanced} products across ${Object.keys(enhancedProductData).length} categories`);
    
    // Generate summary report
    generateSummaryReport(enhancedProductData);

  } catch (error) {
    console.error('❌ Error enhancing SEO and media:', error);
    process.exit(1);
  }
};

/**
 * Generate summary report of enhancements
 * @param {Object} productData - Enhanced product data
 */
const generateSummaryReport = (productData) => {
  console.log('\n📊 SEO & Media Enhancement Report');
  console.log('==================================');

  let totalProducts = 0;
  let productsWithSEO = 0;
  let productsWithMultipleImages = 0;
  let productsWithEnhancedFeatures = 0;
  let totalImages = 0;
  let totalFeatures = 0;

  for (const [category, products] of Object.entries(productData)) {
    if (Array.isArray(products)) {
      products.forEach(product => {
        totalProducts++;
        
        if (product.seo) {
          productsWithSEO++;
        }
        
        if (product.images && product.images.length > 2) {
          productsWithMultipleImages++;
        }
        
        if (product.features && product.features.length > 4) {
          productsWithEnhancedFeatures++;
        }
        
        totalImages += product.images?.length || 0;
        totalFeatures += product.features?.length || 0;
      });
    }
  }

  console.log(`📦 Total Products: ${totalProducts}`);
  console.log(`🔍 Products with SEO Data: ${productsWithSEO} (${Math.round(productsWithSEO/totalProducts*100)}%)`);
  console.log(`📸 Products with Multiple Images: ${productsWithMultipleImages} (${Math.round(productsWithMultipleImages/totalProducts*100)}%)`);
  console.log(`⭐ Products with Enhanced Features: ${productsWithEnhancedFeatures} (${Math.round(productsWithEnhancedFeatures/totalProducts*100)}%)`);
  console.log(`🖼️  Total Images: ${totalImages} (avg: ${Math.round(totalImages/totalProducts)} per product)`);
  console.log(`🏷️  Total Features: ${totalFeatures} (avg: ${Math.round(totalFeatures/totalProducts)} per product)`);
  
  console.log('\n📈 SEO Enhancements:');
  console.log('   ✅ Meta titles and descriptions generated');
  console.log('   ✅ Keywords and tags optimized');
  console.log('   ✅ Structured data (JSON-LD) added');
  console.log('   ✅ Open Graph data configured');
  console.log('   ✅ Image alt text enhanced for accessibility');
};

// Run the enhancement
enhanceAllProducts();