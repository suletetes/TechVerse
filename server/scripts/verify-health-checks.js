#!/usr/bin/env node

/**
 * Health Check Verification Script
 * Tests all health check endpoints and functionality
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const ENDPOINTS = [
  '/api/health',
  '/api/health/detailed',
  '/api/health/database',
  '/api/health/monitor/status',
  '/api/health/monitor/stats'
];

class HealthCheckVerifier {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async verifyEndpoint(endpoint) {
    const startTime = performance.now();
    
    try {
      console.log(`\n🔍 Testing ${endpoint}...`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const data = await response.json();
      
      const result = {
        endpoint,
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: response.ok,
        data: data
      };

      if (response.ok) {
        console.log(`✅ ${endpoint} - ${response.status} (${responseTime}ms)`);
        this.logEndpointDetails(data);
      } else {
        console.log(`❌ ${endpoint} - ${response.status} (${responseTime}ms)`);
        console.log(`   Error: ${data.error || data.message || 'Unknown error'}`);
        this.errors.push(result);
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      console.log(`❌ ${endpoint} - Connection failed (${responseTime}ms)`);
      console.log(`   Error: ${error.message}`);
      
      const result = {
        endpoint,
        status: 'CONNECTION_ERROR',
        responseTime: `${responseTime}ms`,
        success: false,
        error: error.message
      };

      this.errors.push(result);
      this.results.push(result);
      return result;
    }
  }

  logEndpointDetails(data) {
    if (data.status) {
      console.log(`   Status: ${data.status}`);
    }
    
    if (data.services) {
      console.log(`   Services:`);
      Object.entries(data.services).forEach(([service, info]) => {
        if (typeof info === 'object' && info.status) {
          console.log(`     ${service}: ${info.status}`);
          if (info.responseTime) {
            console.log(`       Response Time: ${info.responseTime}`);
          }
        }
      });
    }

    if (data.isMonitoring !== undefined) {
      console.log(`   Monitoring: ${data.isMonitoring ? 'Active' : 'Inactive'}`);
      if (data.interval) {
        console.log(`   Interval: ${data.interval}ms`);
      }
    }

    if (data.totalChecks !== undefined) {
      console.log(`   Total Checks: ${data.totalChecks}`);
      console.log(`   Healthy: ${data.healthyPercentage}%`);
    }
  }

  async testHealthMonitoring() {
    console.log(`\n🔄 Testing health monitoring functionality...`);
    
    try {
      // Start monitoring
      console.log(`\n📊 Starting health monitoring...`);
      const startResponse = await fetch(`${BASE_URL}/api/health/monitor/start`, {
        method: 'POST'
      });
      
      if (startResponse.ok) {
        console.log(`✅ Health monitoring started`);
        
        // Wait a moment for monitoring to collect data
        console.log(`⏳ Waiting for monitoring data...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check stats
        const statsResponse = await fetch(`${BASE_URL}/api/health/monitor/stats`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          console.log(`✅ Monitoring stats retrieved`);
          console.log(`   Total Checks: ${stats.totalChecks}`);
          console.log(`   Health Percentage: ${stats.healthyPercentage}%`);
        }
        
        // Stop monitoring
        console.log(`\n🛑 Stopping health monitoring...`);
        const stopResponse = await fetch(`${BASE_URL}/api/health/monitor/stop`, {
          method: 'POST'
        });
        
        if (stopResponse.ok) {
          console.log(`✅ Health monitoring stopped`);
        }
        
      } else {
        console.log(`❌ Failed to start health monitoring`);
        this.errors.push({
          endpoint: '/api/health/monitor/start',
          status: startResponse.status,
          success: false
        });
      }
      
    } catch (error) {
      console.log(`❌ Health monitoring test failed: ${error.message}`);
      this.errors.push({
        endpoint: 'health-monitoring-test',
        error: error.message,
        success: false
      });
    }
  }

  async runAllTests() {
    console.log(`🚀 TechVerse Health Check Verification`);
    console.log(`📍 Testing server at: ${BASE_URL}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    // Test all basic endpoints
    for (const endpoint of ENDPOINTS) {
      await this.verifyEndpoint(endpoint);
    }

    // Test health monitoring functionality
    await this.testHealthMonitoring();

    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    console.log(`\n📋 VERIFICATION SUMMARY`);
    console.log(`======================`);
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const successRate = Math.round((successful / total) * 100);
    
    console.log(`✅ Successful: ${successful}/${total} (${successRate}%)`);
    console.log(`❌ Failed: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log(`\n🔍 FAILED TESTS:`);
      this.errors.forEach(error => {
        console.log(`   ❌ ${error.endpoint}: ${error.error || error.status}`);
      });
    }

    // Performance summary
    const responseTimes = this.results
      .filter(r => r.responseTime && r.success)
      .map(r => parseInt(r.responseTime.replace('ms', '')));
    
    if (responseTimes.length > 0) {
      const avgResponseTime = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      );
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log(`\n⚡ PERFORMANCE:`);
      console.log(`   Average Response Time: ${avgResponseTime}ms`);
      console.log(`   Max Response Time: ${maxResponseTime}ms`);
    }

    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    
    // Exit with appropriate code
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new HealthCheckVerifier();
  verifier.runAllTests().catch(error => {
    console.error(`❌ Verification failed:`, error);
    process.exit(1);
  });
}

export default HealthCheckVerifier;