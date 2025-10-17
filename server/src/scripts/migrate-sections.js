#!/usr/bin/env node

/**
 * Migration Script: Add sections field to existing products
 * 
 * This script adds the sections field to products that don't have it
 * and assigns some products to sections based on their properties.
 */

import { Product } from '../models/index.js';
import connectDB from '../config/database.js';

const migrateSections = async () => {
  try {
    console.log('🔄 Starting sections migration...');
    
    // Connect to database
    await connectDB();
    
    // Get all products without sections field
    const productsWithoutSections = await Product.find({
      $or: [
        { sections: { $exists: false } },
        { sections: { $size: 0 } }
      ]
    });
    
    console.log(`📦 Found ${productsWithoutSections.length} products to migrate`);
    
    let migratedCount = 0;
    
    for (const product of productsWithoutSections) {
      const sections = [];
      
      // Auto-assign sections based on product properties
      if (product.featured) {
        sections.push('quickPick');
      }
      
      if (product.comparePrice && product.comparePrice > product.price) {
        sections.push('weeklyDeal');
      }
      
      if (product.sales && product.sales.totalSold > 50) {
        sections.push('topSeller');
      }
      
      // Assign some products to latest (newest 30%)
      const isRecent = Math.random() < 0.3;
      if (isRecent) {
        sections.push('latest');
      }
      
      // Update product with sections
      if (sections.length > 0) {
        await Product.findByIdAndUpdate(
          product._id,
          { $set: { sections: sections } },
          { new: true }
        );
        
        console.log(`   ✅ Updated ${product.name} with sections: ${sections.join(', ')}`);
        migratedCount++;
      } else {
        console.log(`   ⚪ Skipped ${product.name} (no sections assigned)`);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`   Products migrated: ${migratedCount}`);
    console.log(`   Products skipped: ${productsWithoutSections.length - migratedCount}`);
    
    // Show section summary
    const sectionCounts = await Promise.all([
      Product.countDocuments({ sections: 'latest' }),
      Product.countDocuments({ sections: 'topSeller' }),
      Product.countDocuments({ sections: 'quickPick' }),
      Product.countDocuments({ sections: 'weeklyDeal' })
    ]);
    
    console.log('\n📊 Section Summary:');
    console.log(`   Latest: ${sectionCounts[0]} products`);
    console.log(`   Top Sellers: ${sectionCounts[1]} products`);
    console.log(`   Quick Picks: ${sectionCounts[2]} products`);
    console.log(`   Weekly Deals: ${sectionCounts[3]} products`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSections();
}

export default migrateSections;