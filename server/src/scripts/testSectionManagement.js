#!/usr/bin/env node

/**
 * TechVerse Admin Section Management API Testing Script
 * 
 * This script tests all admin section management endpoints with comprehensive
 * validation and provides examples for integration testing.
 */

import axios from 'axios';
import colors from 'colors';

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@techverse.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Test configuration
const TEST_CONFIG = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

class SectionManagementTester {
  constructor() {
    this.adminToken = null;
    this.testProducts = [];
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Log test results with colors
   */
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

  /**
   * Record test result
   */
  recordTest(name, passed, message = '') {
    this.results.tests.push({ name, passed, message });
    if (passed) {
      this.results.passed++;
      this.log(`${name}: PASSED ${message}`, 'success');
    } else {
      this.results.failed++;
      this.log(`${name}: FAILED ${message}`, 'error');
    }
  }

  /**
   * Authenticate as admin user
   */
  async authenticateAdmin() {
    try {
      this.log('Authenticating admin user...', 'info');
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }, TEST_CONFIG);

      if (response.data.success && response.data.data.tokens.accessToken) {
        this.adminToken = response.data.data.tokens.accessToken;
        this.recordTest('Admin Authentication', true, `Token: ${this.adminToken.substring(0, 20)}...`);
        return true;
      } else {
        this.recordTest('Admin Authentication', false, 'No access token received');
        return false;
      }
    } catch (error) {
      this.recordTest('Admin Authentication', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Get available products for testing
   */
  async getTestProducts() {
    try {
      this.log('Fetching test products...', 'info');
      
      const response = await axios.get(`${BASE_URL}/products?limit=10`, TEST_CONFIG);

      if (response.data.success && response.data.data.products.length > 0) {
        this.testProducts = response.data.data.products.slice(0, 5); // Use first 5 products
        this.recordTest('Fetch Test Products', true, `Found ${this.testProducts.length} products`);
        return true;
      } else {
        this.recordTest('Fetch Test Products', false, 'No products found');
        return false;
      }
    } catch (error) {
      this.recordTest('Fetch Test Products', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Get authenticated axios instance
   */
  getAuthAxios() {
    return axios.create({
      ...TEST_CONFIG,
      headers: {
        ...TEST_CONFIG.headers,
        'Authorization': `Bearer ${this.adminToken}`
      }
    });
  }

  /**
   * Test: Get section overview
   */
  async testGetSectionOverview() {
    try {
      this.log('Testing GET /admin/sections (Section Overview)...', 'info');
      
      const authAxios = this.getAuthAxios();
      const response = await authAxios.get(`${BASE_URL}/admin/sections`);

      if (response.data.success && response.data.data.sections) {
        const sections = response.data.data.sections;
        const hasAllSections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured']
          .every(section => sections.find(s => s.section === section));
        
        this.recordTest('Get Section Overview', hasAllSections, 
          `Found ${sections.length} sections`);
        return hasAllSections;
      } else {
        this.recordTest('Get Section Overview', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('Get Section Overview', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Set products in section (bulk assignment)
   */
  async testSetProductsInSection() {
    try {
      this.log('Testing POST /admin/sections/:section (Bulk Assignment)...', 'info');
      
      if (this.testProducts.length < 3) {
        this.recordTest('Set Products in Section', false, 'Not enough test products');
        return false;
      }

      const authAxios = this.getAuthAxios();
      const productIds = this.testProducts.slice(0, 3).map(p => p._id);
      
      const response = await authAxios.post(`${BASE_URL}/admin/sections/latest`, {
        productIds
      });

      if (response.data.success && response.data.data.productCount === 3) {
        this.recordTest('Set Products in Section', true, 
          `Assigned ${response.data.data.productCount} products to latest section`);
        return true;
      } else {
        this.recordTest('Set Products in Section', false, 'Unexpected response');
        return false;
      }
    } catch (error) {
      this.recordTest('Set Products in Section', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Get products in section
   */
  async testGetProductsInSection() {
    try {
      this.log('Testing GET /admin/sections/:section...', 'info');
      
      const authAxios = this.getAuthAxios();
      const response = await authAxios.get(`${BASE_URL}/admin/sections/latest`);

      if (response.data.success && response.data.data.products) {
        const productCount = response.data.data.count;
        this.recordTest('Get Products in Section', productCount > 0, 
          `Found ${productCount} products in latest section`);
        return productCount > 0;
      } else {
        this.recordTest('Get Products in Section', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('Get Products in Section', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Add single product to section
   */
  async testAddProductToSection() {
    try {
      this.log('Testing POST /admin/sections/:section/products/:productId...', 'info');
      
      if (this.testProducts.length < 4) {
        this.recordTest('Add Product to Section', false, 'Not enough test products');
        return false;
      }

      const authAxios = this.getAuthAxios();
      const productId = this.testProducts[3]._id;
      
      const response = await authAxios.post(`${BASE_URL}/admin/sections/featured/products/${productId}`);

      if (response.data.success) {
        this.recordTest('Add Product to Section', true, 
          `Added product ${productId} to featured section`);
        return true;
      } else {
        this.recordTest('Add Product to Section', false, 'Unexpected response');
        return false;
      }
    } catch (error) {
      this.recordTest('Add Product to Section', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Remove product from section
   */
  async testRemoveProductFromSection() {
    try {
      this.log('Testing DELETE /admin/sections/:section/products/:productId...', 'info');
      
      if (this.testProducts.length < 4) {
        this.recordTest('Remove Product from Section', false, 'Not enough test products');
        return false;
      }

      const authAxios = this.getAuthAxios();
      const productId = this.testProducts[3]._id;
      
      const response = await authAxios.delete(`${BASE_URL}/admin/sections/featured/products/${productId}`);

      if (response.data.success) {
        this.recordTest('Remove Product from Section', true, 
          `Removed product ${productId} from featured section`);
        return true;
      } else {
        this.recordTest('Remove Product from Section', false, 'Unexpected response');
        return false;
      }
    } catch (error) {
      this.recordTest('Remove Product from Section', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Clear section
   */
  async testClearSection() {
    try {
      this.log('Testing DELETE /admin/sections/:section (Clear Section)...', 'info');
      
      const authAxios = this.getAuthAxios();
      const response = await authAxios.delete(`${BASE_URL}/admin/sections/quickPick`);

      if (response.data.success) {
        this.recordTest('Clear Section', true, 
          `Cleared quickPick section, removed ${response.data.data.productsRemoved} products`);
        return true;
      } else {
        this.recordTest('Clear Section', false, 'Unexpected response');
        return false;
      }
    } catch (error) {
      this.recordTest('Clear Section', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Get available products
   */
  async testGetAvailableProducts() {
    try {
      this.log('Testing GET /admin/products/available...', 'info');
      
      const authAxios = this.getAuthAxios();
      const response = await authAxios.get(`${BASE_URL}/admin/products/available?limit=5`);

      if (response.data.success && response.data.data.products) {
        const productCount = response.data.data.products.length;
        this.recordTest('Get Available Products', productCount > 0, 
          `Found ${productCount} available products`);
        return productCount > 0;
      } else {
        this.recordTest('Get Available Products', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('Get Available Products', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Bulk update product sections
   */
  async testBulkUpdateProductSections() {
    try {
      this.log('Testing PUT /admin/products/sections (Bulk Update)...', 'info');
      
      if (this.testProducts.length < 2) {
        this.recordTest('Bulk Update Product Sections', false, 'Not enough test products');
        return false;
      }

      const authAxios = this.getAuthAxios();
      const updates = [
        {
          productId: this.testProducts[0]._id,
          sections: ['topSeller', 'featured']
        },
        {
          productId: this.testProducts[1]._id,
          sections: ['quickPick']
        }
      ];
      
      const response = await authAxios.put(`${BASE_URL}/admin/products/sections`, {
        updates
      });

      if (response.data.success && response.data.data.successCount === 2) {
        this.recordTest('Bulk Update Product Sections', true, 
          `Updated ${response.data.data.successCount} products successfully`);
        return true;
      } else {
        this.recordTest('Bulk Update Product Sections', false, 
          `Expected 2 successes, got ${response.data.data?.successCount || 0}`);
        return false;
      }
    } catch (error) {
      this.recordTest('Bulk Update Product Sections', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  /**
   * Test: Frontend consumption endpoints
   */
  async testFrontendConsumption() {
    try {
      this.log('Testing frontend consumption endpoints...', 'info');
      
      const sections = ['latest', 'topSeller', 'quickPick', 'weeklyDeal', 'featured'];
      let allPassed = true;

      for (const section of sections) {
        try {
          const response = await axios.get(`${BASE_URL}/products?section=${section}&limit=4`, TEST_CONFIG);
          
          if (response.data.success && Array.isArray(response.data.data.products)) {
            this.log(`  ✅ Section '${section}': ${response.data.data.products.length} products`, 'success');
          } else {
            this.log(`  ❌ Section '${section}': Invalid response`, 'error');
            allPassed = false;
          }
        } catch (error) {
          this.log(`  ❌ Section '${section}': ${error.message}`, 'error');
          allPassed = false;
        }
      }

      this.recordTest('Frontend Consumption Endpoints', allPassed, 
        `Tested ${sections.length} section endpoints`);
      return allPassed;
    } catch (error) {
      this.recordTest('Frontend Consumption Endpoints', false, error.message);
      return false;
    }
  }

  /**
   * Test: Error handling
   */
  async testErrorHandling() {
    try {
      this.log('Testing error handling...', 'info');
      
      const authAxios = this.getAuthAxios();
      let errorTestsPassed = 0;
      const totalErrorTests = 4;

      // Test 1: Invalid section name
      try {
        await authAxios.post(`${BASE_URL}/admin/sections/invalidSection`, {
          productIds: ['64f7b1234567890abcdef123']
        });
        this.log('  ❌ Invalid section test: Should have failed', 'error');
      } catch (error) {
        if (error.response?.data?.code === 'INVALID_SECTION') {
          this.log('  ✅ Invalid section test: Correctly rejected', 'success');
          errorTestsPassed++;
        } else {
          this.log('  ❌ Invalid section test: Wrong error code', 'error');
        }
      }

      // Test 2: Missing product IDs
      try {
        await authAxios.post(`${BASE_URL}/admin/sections/latest`, {});
        this.log('  ❌ Missing product IDs test: Should have failed', 'error');
      } catch (error) {
        if (error.response?.data?.code === 'PRODUCT_IDS_REQUIRED') {
          this.log('  ✅ Missing product IDs test: Correctly rejected', 'success');
          errorTestsPassed++;
        } else {
          this.log('  ❌ Missing product IDs test: Wrong error code', 'error');
        }
      }

      // Test 3: Non-existent product
      try {
        await authAxios.post(`${BASE_URL}/admin/sections/latest`, {
          productIds: ['64f7b1234567890abcdef999']
        });
        this.log('  ❌ Non-existent product test: Should have failed', 'error');
      } catch (error) {
        if (error.response?.data?.code === 'PRODUCTS_NOT_FOUND') {
          this.log('  ✅ Non-existent product test: Correctly rejected', 'success');
          errorTestsPassed++;
        } else {
          this.log('  ❌ Non-existent product test: Wrong error code', 'error');
        }
      }

      // Test 4: Unauthorized access (no token)
      try {
        await axios.post(`${BASE_URL}/admin/sections/latest`, {
          productIds: ['64f7b1234567890abcdef123']
        }, TEST_CONFIG);
        this.log('  ❌ Unauthorized access test: Should have failed', 'error');
      } catch (error) {
        if (error.response?.status === 401) {
          this.log('  ✅ Unauthorized access test: Correctly rejected', 'success');
          errorTestsPassed++;
        } else {
          this.log('  ❌ Unauthorized access test: Wrong status code', 'error');
        }
      }

      const allErrorTestsPassed = errorTestsPassed === totalErrorTests;
      this.recordTest('Error Handling', allErrorTestsPassed, 
        `${errorTestsPassed}/${totalErrorTests} error tests passed`);
      return allErrorTestsPassed;
    } catch (error) {
      this.recordTest('Error Handling', false, error.message);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting TechVerse Admin Section Management API Tests\n'.cyan.bold);
    
    // Setup
    const authSuccess = await this.authenticateAdmin();
    if (!authSuccess) {
      this.log('Authentication failed. Cannot proceed with tests.', 'error');
      return this.printResults();
    }

    const productsSuccess = await this.getTestProducts();
    if (!productsSuccess) {
      this.log('Could not fetch test products. Cannot proceed with tests.', 'error');
      return this.printResults();
    }

    // Run tests
    await this.testGetSectionOverview();
    await this.testSetProductsInSection();
    await this.testGetProductsInSection();
    await this.testAddProductToSection();
    await this.testRemoveProductFromSection();
    await this.testClearSection();
    await this.testGetAvailableProducts();
    await this.testBulkUpdateProductSections();
    await this.testFrontendConsumption();
    await this.testErrorHandling();

    this.printResults();
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n📊 Test Results Summary'.cyan.bold);
    console.log('='.repeat(50).gray);
    
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`.green);
    console.log(`Failed: ${this.results.failed}`.red);
    console.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:'.red.bold);
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.message}`.red);
        });
    }

    console.log('\n✅ Passed Tests:'.green.bold);
    this.results.tests
      .filter(test => test.passed)
      .forEach(test => {
        console.log(`  • ${test.name}: ${test.message}`.green);
      });

    console.log('\n🎯 Test completed!'.cyan.bold);
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SectionManagementTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default SectionManagementTester;