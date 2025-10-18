#!/usr/bin/env node

/**
 * TechVerse File Upload and Static Serving Test Script
 * 
 * This script tests file upload functionality and static serving configuration
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@techverse.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

class FileUploadTester {
  constructor() {
    this.adminToken = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
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

  async authenticateAdmin() {
    try {
      this.log('Authenticating admin user...', 'info');
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

      if (response.data.success && response.data.data.tokens.accessToken) {
        this.adminToken = response.data.data.tokens.accessToken;
        this.recordTest('Admin Authentication', true, `Token obtained`);
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

  async testStaticImageServing() {
    try {
      this.log('Testing static image serving...', 'info');
      
      // Test client public images
      const clientImages = [
        '/img/laptop-product.webp',
        '/img/phone-product.webp',
        '/img/tablet-product.webp',
        '/img/tv-product.webp'
      ];

      let successCount = 0;
      for (const imagePath of clientImages) {
        try {
          const response = await axios.head(`${BASE_URL}${imagePath}`);
          if (response.status === 200) {
            successCount++;
            this.log(`  ✅ ${imagePath}: Accessible`, 'success');
          }
        } catch (error) {
          this.log(`  ❌ ${imagePath}: Not accessible (${error.response?.status || error.message})`, 'error');
        }
      }

      const allAccessible = successCount === clientImages.length;
      this.recordTest('Static Image Serving', allAccessible, 
        `${successCount}/${clientImages.length} client images accessible`);
      
      return allAccessible;
    } catch (error) {
      this.recordTest('Static Image Serving', false, error.message);
      return false;
    }
  }

  async testImageAccessibilityEndpoint() {
    try {
      this.log('Testing image accessibility endpoint...', 'info');
      
      const response = await axios.get(`${BASE_URL}/api/upload/test`);
      
      if (response.data.success && response.data.data.testImages) {
        this.recordTest('Image Accessibility Endpoint', true, 'Test endpoint working');
        
        // Log test URLs for manual verification
        this.log('Test URLs available:', 'info');
        Object.entries(response.data.data.testImages.clientImages).forEach(([key, url]) => {
          this.log(`  ${key}: ${url}`, 'info');
        });
        
        return true;
      } else {
        this.recordTest('Image Accessibility Endpoint', false, 'Invalid response');
        return false;
      }
    } catch (error) {
      this.recordTest('Image Accessibility Endpoint', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testSingleImageUpload() {
    try {
      this.log('Testing single image upload...', 'info');
      
      // Create a test image file
      const testImagePath = await this.createTestImage();
      
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      
      const response = await axios.post(`${BASE_URL}/api/upload/image`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      if (response.data.success && response.data.data.image) {
        const imageData = response.data.data.image;
        this.recordTest('Single Image Upload', true, 
          `Image uploaded: ${imageData.original.url}`);
        
        // Test if uploaded image is accessible
        try {
          const imageResponse = await axios.head(imageData.original.url);
          if (imageResponse.status === 200) {
            this.log('  ✅ Uploaded image is accessible', 'success');
          }
        } catch (error) {
          this.log('  ⚠️  Uploaded image not accessible via URL', 'warning');
        }
        
        // Clean up test file
        fs.unlinkSync(testImagePath);
        
        return imageData;
      } else {
        this.recordTest('Single Image Upload', false, 'Invalid response');
        return null;
      }
    } catch (error) {
      this.recordTest('Single Image Upload', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testMultipleImageUpload() {
    try {
      this.log('Testing multiple image upload...', 'info');
      
      // Create multiple test image files
      const testImagePaths = [
        await this.createTestImage('test1'),
        await this.createTestImage('test2')
      ];
      
      const formData = new FormData();
      testImagePaths.forEach(imagePath => {
        formData.append('images', fs.createReadStream(imagePath));
      });
      
      const response = await axios.post(`${BASE_URL}/api/upload/images`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      if (response.data.success && response.data.data.images) {
        const images = response.data.data.images;
        this.recordTest('Multiple Image Upload', true, 
          `${images.length} images uploaded`);
        
        // Clean up test files
        testImagePaths.forEach(path => fs.unlinkSync(path));
        
        return images;
      } else {
        this.recordTest('Multiple Image Upload', false, 'Invalid response');
        return null;
      }
    } catch (error) {
      this.recordTest('Multiple Image Upload', false, error.response?.data?.message || error.message);
      return null;
    }
  }

  async testUnauthorizedUpload() {
    try {
      this.log('Testing unauthorized upload (should fail)...', 'info');
      
      const testImagePath = await this.createTestImage('unauthorized');
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testImagePath));
      
      try {
        await axios.post(`${BASE_URL}/api/upload/image`, formData, {
          headers: formData.getHeaders()
          // No authorization header
        });
        
        this.recordTest('Unauthorized Upload Protection', false, 'Upload succeeded without auth');
        fs.unlinkSync(testImagePath);
        return false;
      } catch (error) {
        if (error.response?.status === 401) {
          this.recordTest('Unauthorized Upload Protection', true, 'Correctly rejected unauthorized upload');
          fs.unlinkSync(testImagePath);
          return true;
        } else {
          this.recordTest('Unauthorized Upload Protection', false, `Unexpected error: ${error.message}`);
          fs.unlinkSync(testImagePath);
          return false;
        }
      }
    } catch (error) {
      this.recordTest('Unauthorized Upload Protection', false, error.message);
      return false;
    }
  }

  async testInvalidFileUpload() {
    try {
      this.log('Testing invalid file upload (should fail)...', 'info');
      
      // Create a text file instead of image
      const testFilePath = path.join(__dirname, 'test-invalid.txt');
      fs.writeFileSync(testFilePath, 'This is not an image file');
      
      const formData = new FormData();
      formData.append('image', fs.createReadStream(testFilePath));
      
      try {
        await axios.post(`${BASE_URL}/api/upload/image`, formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.adminToken}`
          }
        });
        
        this.recordTest('Invalid File Upload Protection', false, 'Invalid file upload succeeded');
        fs.unlinkSync(testFilePath);
        return false;
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 500) {
          this.recordTest('Invalid File Upload Protection', true, 'Correctly rejected invalid file');
          fs.unlinkSync(testFilePath);
          return true;
        } else {
          this.recordTest('Invalid File Upload Protection', false, `Unexpected error: ${error.message}`);
          fs.unlinkSync(testFilePath);
          return false;
        }
      }
    } catch (error) {
      this.recordTest('Invalid File Upload Protection', false, error.message);
      return false;
    }
  }

  async createTestImage(name = 'test') {
    // Create a simple test image using a 1x1 pixel PNG
    const testImagePath = path.join(__dirname, `${name}-image.png`);
    
    // 1x1 pixel transparent PNG in base64
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    fs.writeFileSync(testImagePath, pngData);
    return testImagePath;
  }

  async runAllTests() {
    console.log('🚀 Starting TechVerse File Upload and Static Serving Tests\n'.cyan.bold);
    
    // Setup
    const authSuccess = await this.authenticateAdmin();
    if (!authSuccess) {
      this.log('Authentication failed. Cannot proceed with upload tests.', 'error');
      await this.testStaticImageServing(); // Still test static serving
      await this.testImageAccessibilityEndpoint();
      return this.printResults();
    }

    // Run tests
    await this.testStaticImageServing();
    await this.testImageAccessibilityEndpoint();
    await this.testSingleImageUpload();
    await this.testMultipleImageUpload();
    await this.testUnauthorizedUpload();
    await this.testInvalidFileUpload();

    this.printResults();
  }

  printResults() {
    console.log('\n📊 File Upload Test Results Summary'.cyan.bold);
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

    console.log('\n🔗 Manual Test URLs:'.cyan.bold);
    console.log(`  Static Images: ${BASE_URL}/img/laptop-product.webp`);
    console.log(`  Test Endpoint: ${BASE_URL}/api/upload/test`);
    console.log(`  Upload Endpoint: ${BASE_URL}/api/upload/image (POST with auth)`);

    console.log('\n🎯 Test completed!'.cyan.bold);
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FileUploadTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default FileUploadTester;