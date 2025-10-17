import mongoose from 'mongoose';
import Product from '../models/Product.js';
import connectDB from '../config/database.js';

/**
 * Migration script to add sections field to existing products
 * This script safely adds the sections array to products that don't have it
 */

async function updateProductSections() {
  try {
    console.log('🔄 Starting product sections migration...');
    
    // Connect to database
    await connectDB();
    
    // Find products without sections field
    const productsToUpdate = await Product.find({
      $or: [
        { sections: { $exists: false } },
        { sections: { $size: 0 } }
      ]
    });
    
    console.log(`📊 Found ${productsToUpdate.length} products to update`);
    
    let updatedCount = 0;
    
    for (const product of productsToUpdate) {
      try {
        // Initialize sections array
        product.sections = [];
        
        // Auto-assign to sections based on existing properties
        if (product.featured) {
          product.sections.push('featured');
        }
        
        // Assign recent products to latest section (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (product.createdAt > thirtyDaysAgo) {
          product.sections.push('latest');
        }
        
        // Assign high-rated products to topSeller
        if (product.rating?.average >= 4.5 && product.sales?.totalSold > 10) {
          product.sections.push('topSeller');
        }
        
        // Assign products with good sales to quickPick
        if (product.sales?.totalSold > 5 && product.rating?.average >= 4.0) {
          product.sections.push('quickPick');
        }
        
        // Save the product
        await product.save();
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`✅ Updated ${updatedCount}/${productsToUpdate.length} products`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating product ${product._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} products`);
    
    // Show section distribution
    const sectionStats = await Product.aggregate([
      { $unwind: { path: '$sections', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$sections', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Section distribution:');
    sectionStats.forEach(stat => {
      console.log(`  ${stat._id || 'No sections'}: ${stat.count} products`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateProductSections()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default updateProductSections;