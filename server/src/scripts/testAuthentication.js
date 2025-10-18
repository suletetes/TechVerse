#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 * Tests the enhanced authentication implementation
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

class AuthenticationTester {
  constructor() {
    this.testResults = [];
    this.tokens = {};
  }

  log(message, data = {}) {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`🧪 Running test: ${testName}`);
      const result = await testFunction();
      this.testResults.push({ name: testName, status: 'PASS', result });
      this.log(`✅ Test passed: ${testName}`);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      this.log(`❌ Test failed: ${testName}`, { error: error.message });
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };

    if (this.tokens.accessToken && !options.skipAuth) {
      headers.Authorization = `Bearer ${this.tokens.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    return { response, data };
  }

  async testUserRegistration() {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.${crypto.randomBytes(4).toString('hex')}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    const { response, data } = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: testUser,
      skipAuth: true
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${data.message}`);
    }

    if (!data.success || !data.data?.tokens?.accessToken) {
      throw new Error('Invalid registration response format');
    }

    this.tokens = data.data.tokens;
    this.testUser = { ...testUser, ...data.data.user };

    return {
      userId: data.data.user._id,
      hasTokens: !!data.data.tokens.accessToken,
      hasRefreshToken: !!data.data.tokens.refreshToken,
      sessionId: data.data.tokens.sessionId
    };
  }

  async testUserLogin() {
    if (!this.testUser) {
      throw new Error('No test user available for login test');
    }

    const { response, data } = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: this.testUser.email,
        password: this.testUser.password
      },
      skipAuth: true
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${data.message}`);
    }

    if (!data.success || !data.data?.tokens?.accessToken) {
      throw new Error('Invalid login response format');
    }

    this.tokens = data.data.tokens;

    return {
      hasTokens: !!data.data.tokens.accessToken,
      hasRefreshToken: !!data.data.tokens.refreshToken,
      sessionId: data.data.tokens.sessionId,
      userPermissions: data.data.user.permissions,
      expiresAt: data.data.tokens.expiresAt
    };
  }

  async testTokenValidation() {
    const { response, data } = await this.makeRequest('/auth/me');

    if (!response.ok) {
      throw new Error(`Token validation failed: ${data.message}`);
    }

    if (!data.success || !data.data?.user) {
      throw new Error('Invalid token validation response');
    }

    return {
      userId: data.data.user._id,
      email: data.data.user.email,
      role: data.data.user.role
    };
  }

  async testTokenRefresh() {
    if (!this.tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    const { response, data } = await this.makeRequest('/auth/refresh-token', {
      method: 'POST',
      body: {
        refreshToken: this.tokens.refreshToken
      },
      skipAuth: true
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${data.message}`);
    }

    if (!data.success || !data.data?.tokens?.accessToken) {
      throw new Error('Invalid refresh response format');
    }

    const oldAccessToken = this.tokens.accessToken;
    this.tokens = data.data.tokens;

    return {
      tokenChanged: oldAccessToken !== this.tokens.accessToken,
      hasNewRefreshToken: !!data.data.tokens.refreshToken,
      sessionId: data.data.tokens.sessionId
    };
  }

  async testRateLimiting() {
    const promises = [];
    
    // Make 10 rapid login attempts to test rate limiting
    for (let i = 0; i < 10; i++) {
      promises.push(
        this.makeRequest('/auth/login', {
          method: 'POST',
          body: {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          },
          skipAuth: true
        }).catch(err => ({ error: err.message }))
      );
    }

    const results = await Promise.all(promises);
    const rateLimitedRequests = results.filter(result => 
      result.response?.status === 429 || result.error?.includes('429')
    );

    return {
      totalRequests: results.length,
      rateLimitedRequests: rateLimitedRequests.length,
      rateLimitingWorking: rateLimitedRequests.length > 0
    };
  }

  async testInvalidTokenHandling() {
    const invalidToken = 'invalid.token.here';
    
    const { response, data } = await this.makeRequest('/auth/me', {
      headers: {
        Authorization: `Bearer ${invalidToken}`
      },
      skipAuth: true
    });

    if (response.ok) {
      throw new Error('Invalid token was accepted');
    }

    return {
      statusCode: response.status,
      errorCode: data.code,
      message: data.message
    };
  }

  async testPasswordValidation() {
    const weakPasswords = [
      'password',
      '123456',
      'abc',
      'PASSWORD',
      'password123'
    ];

    const results = [];

    for (const password of weakPasswords) {
      const { response, data } = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: `test.${crypto.randomBytes(4).toString('hex')}@example.com`,
          password,
          confirmPassword: password
        },
        skipAuth: true
      });

      results.push({
        password,
        rejected: !response.ok,
        errorMessage: data.message || data.errors?.[0]
      });
    }

    const allRejected = results.every(r => r.rejected);

    return {
      testedPasswords: results.length,
      allWeakPasswordsRejected: allRejected,
      results
    };
  }

  async testLogout() {
    const { response, data } = await this.makeRequest('/auth/logout', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${data.message}`);
    }

    // Test that token is no longer valid
    const { response: testResponse } = await this.makeRequest('/auth/me');

    return {
      logoutSuccessful: response.ok,
      tokenInvalidated: testResponse.status === 401
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Authentication Flow Tests');
    this.log('=====================================');

    try {
      // Core authentication flow tests
      await this.runTest('User Registration', () => this.testUserRegistration());
      await this.runTest('User Login', () => this.testUserLogin());
      await this.runTest('Token Validation', () => this.testTokenValidation());
      await this.runTest('Token Refresh', () => this.testTokenRefresh());
      
      // Security tests
      await this.runTest('Rate Limiting', () => this.testRateLimiting());
      await this.runTest('Invalid Token Handling', () => this.testInvalidTokenHandling());
      await this.runTest('Password Validation', () => this.testPasswordValidation());
      
      // Cleanup test
      await this.runTest('User Logout', () => this.testLogout());

    } catch (error) {
      this.log('❌ Test suite failed', { error: error.message });
    }

    this.printResults();
  }

  printResults() {
    this.log('');
    this.log('📊 Test Results Summary');
    this.log('======================');

    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;

    this.log(`Total Tests: ${total}`);
    this.log(`Passed: ${passed} ✅`);
    this.log(`Failed: ${failed} ❌`);
    this.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      this.log('');
      this.log('❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`);
        });
    }

    this.log('');
    this.log('✅ Passed Tests:');
    this.testResults
      .filter(t => t.status === 'PASS')
      .forEach(test => {
        this.log(`  - ${test.name}`);
      });
  }
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthenticationTester();
  
  tester.runAllTests().catch(error => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}

export default AuthenticationTester;