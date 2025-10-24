#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Sanity Check Script - Validates seeded data integrity and API accessibility
 */
class SanityChecker {
  constructor() {
    this.results = {
      database: { passed: 0, failed: 0, tests: [] },
      relationships: { passed: 0, failed: 0, tests: [] },
      api: { passed: 0, failed: 0, tests: [] },
      overall: { passed: 0, failed: 0 }
    };
  }

  /**
   * Run all sanity checks
   */
  async runAllChecks() {
    console.log('🔍 Starting Database Sanity Checks...\n');

    try {
      // Connect to database
      await this.connectDatabase();

      // Run database checks
      await this.checkDatabaseCounts();
      await this.checkDataIntegrity();
      
      // Run relationship checks
      await this.checkRelationships();
      
      // Run API checks (if server is running)
      await this.checkAPIEndpoints();

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Sanity check failed:', error.message);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
    }
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techverse';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to database');
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Check database record counts
   */
  async checkDatabaseCounts() {
    console.log('📊 Checking database record counts...');

    const collections = [
      { name: 'products', minCount: 1 },
      { name: 'categories', minCount: 1 },
      { name: 'users', minCount: 1 }
    ];

    for (const collection of collections) {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        
        if (count >= collection.minCount) {
          this.addResult('database', `${collection.name} count`, true, `Found ${count} records`);
        } else {
          this.addResult('database', `${collection.name} count`, false, `Expected >= ${collection.minCount}, found ${count}`);
        }
      } catch (error) {
        this.addResult('database', `${collection.name} count`, false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Check data integrity
   */
  async checkDataIntegrity() {
    console.log('🔍 Checking data integrity...');

    try {
      // Check products have required fields
      const products = await mongoose.connection.db.collection('products').find({}).toArray();
      
      let validProducts = 0;
      for (const product of products) {
        if (product.name && product.price && product.slug) {
          validProducts++;
        }
      }

      if (validProducts === products.length) {
        this.addResult('database', 'product integrity', true, `All ${products.length} products have required fields`);
      } else {
        this.addResult('database', 'product integrity', false, `${products.length - validProducts} products missing required fields`);
      }

      // Check for duplicate slugs
      const slugs = products.map(p => p.slug);
      const uniqueSlugs = new Set(slugs);
      
      if (slugs.length === uniqueSlugs.size) {
        this.addResult('database', 'unique slugs', true, 'No duplicate product slugs found');
      } else {
        this.addResult('database', 'unique slugs', false, `Found ${slugs.length - uniqueSlugs.size} duplicate slugs`);
      }

    } catch (error) {
      this.addResult('database', 'data integrity', false, `Error: ${error.message}`);
    }
  }

  /**
   * Check foreign key relationships
   */
  async checkRelationships() {
    console.log('🔗 Checking relationships...');

    try {
      const products = await mongoose.connection.db.collection('products').find({}).toArray();
      const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
      const categoryMap = new Map(categories.map(cat => [cat.slug, cat]));

      let validRelationships = 0;
      let invalidRelationships = 0;

      for (const product of products) {
        if (product.category && categoryMap.has(product.category)) {
          validRelationships++;
        } else if (product.category) {
          invalidRelationships++;
        }
      }

      if (invalidRelationships === 0) {
        this.addResult('relationships', 'product-category', true, `All ${validRelationships} product categories exist`);
      } else {
        this.addResult('relationships', 'product-category', false, `${invalidRelationships} products reference missing categories`);
      }

      // Check homepage settings references
      const settings = await mongoose.connection.db.collection('settings').findOne({});
      if (settings && settings.homepage) {
        const productMap = new Map(products.map(p => [p.slug, p]));
        let validSettings = 0;
        let invalidSettings = 0;

        for (const [section, productSlugs] of Object.entries(settings.homepage)) {
          if (Array.isArray(productSlugs)) {
            for (const slug of productSlugs) {
              if (productMap.has(slug)) {
                validSettings++;
              } else {
                invalidSettings++;
              }
            }
          }
        }

        if (invalidSettings === 0) {
          this.addResult('relationships', 'homepage-products', true, `All ${validSettings} homepage product references exist`);
        } else {
          this.addResult('relationships', 'homepage-products', false, `${invalidSettings} homepage settings reference missing products`);
        }
      }

    } catch (error) {
      this.addResult('relationships', 'relationship check', false, `Error: ${error.message}`);
    }
  }

  /**
   * Check API endpoints (basic connectivity test)
   */
  async checkAPIEndpoints() {
    console.log('🌐 Checking API endpoints...');

    const endpoints = [
      { path: '/api/products', method: 'GET', description: 'Products list' },
      { path: '/api/categories', method: 'GET', description: 'Categories list' },
      { path: '/api/health', method: 'GET', description: 'Health check' }
    ];

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`);
        
        if (response.ok) {
          const data = await response.json();
          this.addResult('api', endpoint.description, true, `Status: ${response.status}`);
        } else {
          this.addResult('api', endpoint.description, false, `Status: ${response.status}`);
        }
      } catch (error) {
        this.addResult('api', endpoint.description, false, `Connection failed: ${error.message}`);
      }
    }
  }

  /**
   * Add test result
   */
  addResult(category, test, passed, message) {
    this.results[category].tests.push({ test, passed, message });
    
    if (passed) {
      this.results[category].passed++;
      this.results.overall.passed++;
    } else {
      this.results[category].failed++;
      this.results.overall.failed++;
    }
  }

  /**
   * Generate and display report
   */
  generateReport() {
    console.log('\n📋 SANITY CHECK REPORT');
    console.log('='.repeat(50));

    // Overall summary
    const total = this.results.overall.passed + this.results.overall.failed;
    const successRate = total > 0 ? (this.results.overall.passed / total * 100).toFixed(1) : 0;
    
    console.log(`\n📊 Overall: ${this.results.overall.passed}/${total} tests passed (${successRate}%)`);

    // Category breakdown
    for (const [category, results] of Object.entries(this.results)) {
      if (category === 'overall') continue;

      console.log(`\n${this.getCategoryIcon(category)} ${category.toUpperCase()}:`);
      
      for (const test of results.tests) {
        const icon = test.passed ? '✅' : '❌';
        console.log(`  ${icon} ${test.test}: ${test.message}`);
      }
      
      console.log(`  Summary: ${results.passed}/${results.passed + results.failed} passed`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.database.failed > 0) {
      console.log('  • Run seed script to populate missing data');
    }
    
    if (this.results.relationships.failed > 0) {
      console.log('  • Check SEED_ISSUES.md for relationship problems');
      console.log('  • Re-run extraction with updated data');
    }
    
    if (this.results.api.failed > 0) {
      console.log('  • Ensure server is running on correct port');
      console.log('  • Check API routes match expected endpoints');
    }

    if (this.results.overall.failed === 0) {
      console.log('  🎉 All checks passed! Database is ready for use.');
    }

    console.log('\n' + '='.repeat(50));
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category) {
    const icons = {
      database: '🗄️',
      relationships: '🔗',
      api: '🌐'
    };
    return icons[category] || '📋';
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new SanityChecker();
  checker.runAllChecks().catch(error => {
    console.error('❌ Sanity check failed:', error);
    process.exit(1);
  });
}

export default SanityChecker;