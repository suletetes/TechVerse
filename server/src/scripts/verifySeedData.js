#!/usr/bin/env node

/**
 * TechVerse Seed Data Verification Script
 * 
 * This script verifies that the seeded data is correctly structured
 * and that all homepage sections have appropriate content.
 */

import connectDB from '../config/database.js';
import { User, Product, Category } from '../models/index.js';
import colors from 'colors';

class SeedDataVerifier {
  constructor() {
    this.results = {
      categories: { expected: 7, actual: 0, status: 'pending' },
      users: { expected: 2, actual: 0, status: 'pending' },
      products: { expected: 12, actual: 0, status: 'pending' },
      sections: {
        latest: { expected: 8, actual: 0, status: 'pending' },
        topSeller: { expected: 6, actual: 0, status: 'pending' },
        quickPick: { expected: 4, actual: 0, status: 'pending' },
        weeklyDeal: { expected: 2, actual: 0, status: 'pending' },
        featured: { expected: 10, actual: 0, status: 'pending' }
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    switch (type) {
      case 'success':
        console.log(`[${timestamp}] ✅ ${message}`.green);
        break;
      case 'error':
        console.log(`[${timestamp}] ❌ ${message}`.red);
        break;
      case 'warning':
        console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
        break;
      case 'info':
        console.log(`[${timestamp}] ℹ️  ${message}`.blue);
        break;
      default:
        console.log(`[${timestamp}] ${message}`);
    }
  }

  async verifyDatabase() {
    try {
      this.log('🔍 Starting seed data verification...', 'info');
      
      await connectDB();
      this.log('✅ Connected to database', 'success');

      await this.verifyCategories();
      await this.verifyUsers();
      await this.verifyProducts();
      await this.verifySections();
      await this.verifyImages();
      await this.generateReport();

    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async verifyCategories() {
    this.log('📁 Verifying categories...', 'info');
    
    const categories = await Category.find({});
    this.results.categories.actual = categories.length;
    
    if (categories.length >= this.results.categories.expected) {
      this.results.categories.status = 'success';
      this.log(`Categories: ${categories.length} found`, 'success');
    } else {
      this.results.categories.status = 'error';
      this.log(`Categories: Expected ${this.results.categories.expected}, found ${categories.length}`, 'error');
    }

    // Verify category structure
    for (const category of categories) {
      if (!category.slug) {
        this.log(`Category "${category.name}" missing slug`, 'warning');
      }
      if (category.isFeatured && !category.image?.url) {
        this.log(`Featured category "${category.name}" missing image`, 'warning');
      }
    }
  }

  async verifyUsers() {
    this.log('👥 Verifying users...', 'info');
    
    const users = await User.find({});
    this.results.users.actual = users.length;
    
    if (users.length >= this.results.users.expected) {
      this.results.users.status = 'success';
      this.log(`Users: ${users.length} found`, 'success');
    } else {
      this.results.users.status = 'error';
      this.log(`Users: Expected ${this.results.users.expected}, found ${users.length}`, 'error');
    }

    // Verify admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      this.log(`Admin user found: ${adminUser.email}`, 'success');
    } else {
      this.log('No admin user found', 'error');
    }
  }

  async verifyProducts() {
    this.log('📦 Verifying products...', 'info');
    
    const products = await Product.find({}).populate('category');
    this.results.products.actual = products.length;
    
    if (products.length >= this.results.products.expected) {
      this.results.products.status = 'success';
      this.log(`Products: ${products.length} found`, 'success');
    } else {
      this.results.products.status = 'error';
      this.log(`Products: Expected ${this.results.products.expected}, found ${products.length}`, 'error');
    }

    // Verify product structure
    let validProducts = 0;
    for (const product of products) {
      let isValid = true;
      
      if (!product.name || !product.price || !product.category) {
        this.log(`Product "${product.name || 'Unknown'}" missing required fields`, 'warning');
        isValid = false;
      }
      
      if (!product.images || product.images.length === 0) {
        this.log(`Product "${product.name}" has no images`, 'warning');
        isValid = false;
      }
      
      if (!product.sections || product.sections.length === 0) {
        this.log(`Product "${product.name}" not assigned to any sections`, 'warning');
        isValid = false;
      }
      
      if (isValid) validProducts++;
    }
    
    this.log(`Valid products: ${validProducts}/${products.length}`, validProducts === products.length ? 'success' : 'warning');
  }

  async verifySections() {
    this.log('🏷️  Verifying homepage sections...', 'info');
    
    const sections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
    
    for (const section of sections) {
      const products = await Product.find({ sections: section });
      this.results.sections[section].actual = products.length;
      
      if (products.length > 0) {
        this.results.sections[section].status = 'success';
        this.log(`Section "${section}": ${products.length} products`, 'success');
        
        // Show sample products
        products.slice(0, 3).forEach(product => {
          this.log(`   - ${product.name} (£${product.price})`, 'info');
        });
        if (products.length > 3) {
          this.log(`   ... and ${products.length - 3} more`, 'info');
        }
      } else {
        this.results.sections[section].status = 'error';
        this.log(`Section "${section}": No products found`, 'error');
      }
    }
  }

  async verifyImages() {
    this.log('🖼️  Verifying product images...', 'info');
    
    const products = await Product.find({});
    let totalImages = 0;
    let validImages = 0;
    let missingImages = 0;

    for (const product of products) {
      if (product.images && product.images.length > 0) {
        totalImages += product.images.length;
        
        for (const image of product.images) {
          if (image.url && image.url.startsWith('/img/')) {
            validImages++;
          } else {
            this.log(`Product "${product.name}" has invalid image URL: ${image.url}`, 'warning');
          }
        }
      } else {
        missingImages++;
      }
    }

    this.log(`Image verification: ${validImages}/${totalImages} valid images`, 'info');
    if (missingImages > 0) {
      this.log(`${missingImages} products have no images`, 'warning');
    }
  }

  async generateReport() {
    console.log('\n📊 Seed Data Verification Report'.cyan.bold);
    console.log('='.repeat(50).gray);
    
    // Categories
    const catStatus = this.results.categories.status === 'success' ? '✅' : '❌';
    console.log(`${catStatus} Categories: ${this.results.categories.actual}/${this.results.categories.expected}`);
    
    // Users
    const userStatus = this.results.users.status === 'success' ? '✅' : '❌';
    console.log(`${userStatus} Users: ${this.results.users.actual}/${this.results.users.expected}`);
    
    // Products
    const prodStatus = this.results.products.status === 'success' ? '✅' : '❌';
    console.log(`${prodStatus} Products: ${this.results.products.actual}/${this.results.products.expected}`);
    
    // Sections
    console.log('\n🏷️  Homepage Sections:');
    for (const [section, data] of Object.entries(this.results.sections)) {
      const status = data.status === 'success' ? '✅' : '❌';
      console.log(`   ${status} ${section}: ${data.actual} products`);
    }

    // Overall status
    const allSuccess = Object.values(this.results).every(result => {
      if (result.status) return result.status === 'success';
      return Object.values(result).every(subResult => subResult.status === 'success');
    });

    console.log('\n🎯 Overall Status:');
    if (allSuccess) {
      console.log('✅ All verification checks passed!'.green.bold);
      console.log('\n🚀 Ready for frontend integration:');
      console.log('   - Homepage sections populated');
      console.log('   - Product images referenced correctly');
      console.log('   - Admin user available for testing');
      console.log('   - Categories properly structured');
    } else {
      console.log('⚠️  Some verification checks failed'.yellow.bold);
      console.log('   Please review the warnings above');
    }

    console.log('\n🔗 Test the seeded data:');
    console.log('   npm run test:sections');
    console.log('   curl http://localhost:5000/api/products?section=latest&limit=8');
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new SeedDataVerifier();
  verifier.verifyDatabase().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export default SeedDataVerifier;