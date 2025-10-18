#!/usr/bin/env node

/**
 * TechVerse Authentication & Security Testing Script
 * 
 * This script comprehensively tests all authentication flows and security measures
 */

import axios from 'axios';
import colors from 'colors';

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_USER_EMAIL = 'test-auth@techverse.com';
const TEST_USER_PASSWORD = 'TestAuth123!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@techverse.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

class AuthenticationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.testUserToken = null;
    this.adminToken = null;
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

  async testUserRegistration() {
    try {
      this.log('Testing user registration...', 'info');
      
      // Clean up any existing test user first
      try {
        await this.cleanupTestUser();
      } catch (error) {
        // Ignore cleanup errors
      }

      const response = await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'User',
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        confirmPassword: TEST_USER_PASSWORD
      });

      if (response.data.success && response.data.data.tokens.accessToken) {
        this.testUserToken = response.data.data.tokens.accessToken;
        this.recordTest('User Registration', true, 'User registered successfully');
        return true;
      } else {
        this.recordTest('User Registration', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      if (error.response?.data?.code === 'EMAIL_EXISTS') {
        // User already exists, try to login instead
        return await this.testUserLogin();
      }
      this.recordTest('User Registration', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testUserLogin() {
    try {
      this.log('Testing user login...', 'info');
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (response.data.success && response.data.data.tokens.accessToken) {
        this.testUserToken = response.data.data.tokens.accessToken;
        this.recordTest('User Login', true, 'Login successful');
        return true;
      } else {
        this.recordTest('User Login', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('User Login', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testAdminLogin() {
    try {
      this.log('Testing admin login...', 'info');
      
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

      if (response.data.success && response.data.data.tokens.accessToken) {
        this.adminToken = response.data.data.tokens.accessToken;
        this.recordTest('Admin Login', true, 'Admin login successful');
        return true;
      } else {
        this.recordTest('Admin Login', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('Admin Login', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testInvalidLogin() {
    try {
      this.log('Testing invalid login (should fail)...', 'info');
      
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: 'WrongPassword123!'
      });

      this.recordTest('Invalid Login Protection', false, 'Invalid login succeeded');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        this.recordTest('Invalid Login Protection', true, 'Correctly rejected invalid credentials');
        return true;
      } else {
        this.recordTest('Invalid Login Protection', false, `Unexpected error: ${error.message}`);
        return false;
      }
    }
  }

  async testProtectedRouteWithoutToken() {
    try {
      this.log('Testing protected route without token (should fail)...', 'info');
      
      await axios.get(`${BASE_URL}/auth/profile`);

      this.recordTest('Protected Route Without Token', false, 'Access granted without token');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        this.recordTest('Protected Route Without Token', true, 'Correctly rejected unauthorized access');
        return true;
      } else {
        this.recordTest('Protected Route Without Token', false, `Unexpected error: ${error.message}`);
        return false;
      }
    }
  }

  async testProtectedRouteWithToken() {
    try {
      this.log('Testing protected route with valid token...', 'info');
      
      if (!this.testUserToken) {
        this.recordTest('Protected Route With Token', false, 'No test user token available');
        return false;
      }

      const response = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${this.testUserToken}`
        }
      });

      if (response.data.success && response.data.data.user) {
        this.recordTest('Protected Route With Token', true, 'Access granted with valid token');
        return true;
      } else {
        this.recordTest('Protected Route With Token', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('Protected Route With Token', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testAdminRouteWithUserToken() {
    try {
      this.log('Testing admin route with user token (should fail)...', 'info');
      
      if (!this.testUserToken) {
        this.recordTest('Admin Route Access Control', false, 'No test user token available');
        return false;
      }

      await axios.get(`${BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${this.testUserToken}`
        }
      });

      this.recordTest('Admin Route Access Control', false, 'User gained admin access');
      return false;
    } catch (error) {
      if (error.response?.status === 403) {
        this.recordTest('Admin Route Access Control', true, 'Correctly rejected user access to admin route');
        return true;
      } else {
        this.recordTest('Admin Route Access Control', false, `Unexpected error: ${error.message}`);
        return false;
      }
    }
  }

  async testAdminRouteWithAdminToken() {
    try {
      this.log('Testing admin route with admin token...', 'info');
      
      if (!this.adminToken) {
        this.recordTest('Admin Route With Admin Token', false, 'No admin token available');
        return false;
      }

      const response = await axios.get(`${BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      if (response.data.success) {
        this.recordTest('Admin Route With Admin Token', true, 'Admin access granted correctly');
        return true;
      } else {
        this.recordTest('Admin Route With Admin Token', false, 'Invalid response structure');
        return false;
      }
    } catch (error) {
      this.recordTest('Admin Route With Admin Token', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testInvalidToken() {
    try {
      this.log('Testing invalid token (should fail)...', 'info');
      
      await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });

      this.recordTest('Invalid Token Protection', false, 'Invalid token accepted');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        this.recordTest('Invalid Token Protection', true, 'Correctly rejected invalid token');
        return true;
      } else {
        this.recordTest('Invalid Token Protection', false, `Unexpected error: ${error.message}`);
        return false;
      }
    }
  }

  async testRateLimiting() {
    try {
      this.log('Testing rate limiting (5 rapid requests)...', 'info');
      
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          axios.post(`${BASE_URL}/auth/login`, {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          }).catch(error => error.response)
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(response => 
        response && response.status === 429
      );

      if (rateLimitedResponses.length > 0) {
        this.recordTest('Rate Limiting', true, `${rateLimitedResponses.length} requests rate limited`);
        return true;
      } else {
        this.recordTest('Rate Limiting', false, 'No rate limiting detected');
        return false;
      }
    } catch (error) {
      this.recordTest('Rate Limiting', false, error.message);
      return false;
    }
  }

  async testPasswordValidation() {
    try {
      this.log('Testing password validation (weak password should fail)...', 'info');
      
      await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Weak',
        email: 'weak@test.com',
        password: '123', // Weak password
        confirmPassword: '123'
      });

      this.recordTest('Password Validation', false, 'Weak password accepted');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        this.recordTest('Password Validation', true, 'Correctly rejected weak password');
        return true;
      } else {
        this.recordTest('Password Validation', false, `Unexpected error: ${error.message}`);
        return false;
      }
    }
  }

  async testEmailValidation() {
    try {
      this.log('Testing email validation (invalid email should fail)...', 'info');
      
      await axios.post(`${BASE_URL}/auth/register`, {
        firstName: 'Test',
        lastName: 'Invalid',
        email: 'invalid-email', // Invalid email
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!'
      });

      this.recordTest('Email Validation', false, 'Invalid email accepted');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        this.recordTest('Email Validation', true, 'Correctly rejected invalid email');
        return true;
      } else {
        this.recordTest('Email Validation', false, `Unexpected error: ${error.message}`);
        return false;
      }
    }
  }

  async testTokenRefresh() {
    try {
      this.log('Testing token refresh...', 'info');
      
      if (!this.testUserToken) {
        this.recordTest('Token Refresh', false, 'No test user token available');
        return false;
      }

      // First get the refresh token by logging in again
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      const refreshToken = loginResponse.data.data.tokens.refreshToken;
      
      if (!refreshToken) {
        this.recordTest('Token Refresh', false, 'No refresh token received');
        return false;
      }

      // Test token refresh
      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refreshToken: refreshToken
      });

      if (refreshResponse.data.success && refreshResponse.data.data.tokens.accessToken) {
        this.recordTest('Token Refresh', true, 'Token refreshed successfully');
        return true;
      } else {
        this.recordTest('Token Refresh', false, 'Invalid refresh response');
        return false;
      }
    } catch (error) {
      this.recordTest('Token Refresh', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async testLogout() {
    try {
      this.log('Testing logout...', 'info');
      
      const response = await axios.post(`${BASE_URL}/auth/logout`);

      if (response.data.success) {
        this.recordTest('Logout', true, 'Logout successful');
        return true;
      } else {
        this.recordTest('Logout', false, 'Invalid logout response');
        return false;
      }
    } catch (error) {
      this.recordTest('Logout', false, error.response?.data?.message || error.message);
      return false;
    }
  }

  async cleanupTestUser() {
    try {
      // This would require admin privileges to delete users
      // For now, we'll just log that cleanup was attempted
      this.log('Test user cleanup attempted', 'info');
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async runAllTests() {
    console.log('🔐 Starting TechVerse Authentication & Security Tests\n'.cyan.bold);
    
    // Authentication Flow Tests
    await this.testUserRegistration();
    await this.testUserLogin();
    await this.testAdminLogin();
    
    // Security Tests
    await this.testInvalidLogin();
    await this.testProtectedRouteWithoutToken();
    await this.testProtectedRouteWithToken();
    await this.testAdminRouteWithUserToken();
    await this.testAdminRouteWithAdminToken();
    await this.testInvalidToken();
    
    // Validation Tests
    await this.testPasswordValidation();
    await this.testEmailValidation();
    
    // Advanced Features
    await this.testTokenRefresh();
    await this.testRateLimiting();
    await this.testLogout();

    this.printResults();
  }

  printResults() {
    console.log('\n🔐 Authentication & Security Test Results'.cyan.bold);
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

    console.log('\n🔒 Security Status:'.cyan.bold);
    if (this.results.failed === 0) {
      console.log('✅ All security tests passed - System is secure'.green.bold);
    } else {
      console.log('⚠️  Some security tests failed - Review required'.yellow.bold);
    }

    console.log('\n🔗 Manual Security Tests:'.cyan.bold);
    console.log(`  Login: POST ${BASE_URL}/auth/login`);
    console.log(`  Profile: GET ${BASE_URL}/auth/profile (with Bearer token)`);
    console.log(`  Admin: GET ${BASE_URL}/admin/dashboard (admin token required)`);

    console.log('\n🎯 Authentication test completed!'.cyan.bold);
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthenticationTester();
  tester.runAllTests().catch(error => {
    console.error('Authentication test runner failed:', error);
    process.exit(1);
  });
}

export default AuthenticationTester;