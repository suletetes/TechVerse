#!/usr/bin/env node

/**
 * Central Test Runner for TechVerse Platform
 * Organizes and runs all test suites with proper reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  unit: {
    name: 'Unit Tests',
    pattern: 'tests/unit/**/*.test.js',
    timeout: 10000,
    coverage: true
  },
  integration: {
    name: 'Integration Tests',
    pattern: 'tests/integration/**/*.test.js',
    timeout: 30000,
    coverage: true
  },
  e2e: {
    name: 'End-to-End Tests',
    pattern: 'tests/e2e/**/*.test.js',
    timeout: 60000,
    coverage: false
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    const border = '='.repeat(60);
    this.log(border, 'cyan');
    this.log(`  ${message}`, 'bright');
    this.log(border, 'cyan');
  }

  logSection(message) {
    this.log(`\n${'-'.repeat(40)}`, 'blue');
    this.log(`  ${message}`, 'blue');
    this.log(`${'-'.repeat(40)}`, 'blue');
  }

  async runTestSuite(type, config) {
    this.logSection(`Running ${config.name}`);
    
    try {
      const coverageFlag = config.coverage ? '--coverage' : '';
      const timeoutFlag = `--testTimeout=${config.timeout}`;
      
      const command = `npm test -- --testPathPattern="${config.pattern}" ${timeoutFlag} ${coverageFlag} --verbose`;
      
      this.log(`Command: ${command}`, 'yellow');
      
      const output = execSync(command, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.results[type] = {
        success: true,
        output,
        duration: Date.now() - this.startTime
      };
      
      this.log(`✅ ${config.name} completed successfully`, 'green');
      return true;
      
    } catch (error) {
      this.results[type] = {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || '',
        duration: Date.now() - this.startTime
      };
      
      this.log(`❌ ${config.name} failed`, 'red');
      this.log(`Error: ${error.message}`, 'red');
      
      if (error.stdout) {
        this.log('STDOUT:', 'yellow');
        this.log(error.stdout, 'reset');
      }
      
      if (error.stderr) {
        this.log('STDERR:', 'yellow');
        this.log(error.stderr, 'reset');
      }
      
      return false;
    }
  }

  async runAllTests() {
    this.logHeader('TechVerse Platform Test Suite');
    
    const testTypes = process.argv.slice(2);
    const runAll = testTypes.length === 0;
    
    let allPassed = true;
    
    // Run Unit Tests
    if (runAll || testTypes.includes('unit')) {
      const success = await this.runTestSuite('unit', TEST_CONFIG.unit);
      allPassed = allPassed && success;
    }
    
    // Run Integration Tests
    if (runAll || testTypes.includes('integration')) {
      const success = await this.runTestSuite('integration', TEST_CONFIG.integration);
      allPassed = allPassed && success;
    }
    
    // Run E2E Tests
    if (runAll || testTypes.includes('e2e')) {
      const success = await this.runTestSuite('e2e', TEST_CONFIG.e2e);
      allPassed = allPassed && success;
    }
    
    this.generateReport();
    
    process.exit(allPassed ? 0 : 1);
  }

  generateReport() {
    this.logHeader('Test Results Summary');
    
    const totalDuration = Date.now() - this.startTime;
    
    Object.entries(this.results).forEach(([type, result]) => {
      if (result === null) return;
      
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const color = result.success ? 'green' : 'red';
      
      this.log(`${TEST_CONFIG[type].name}: ${status}`, color);
      
      if (!result.success && result.error) {
        this.log(`  Error: ${result.error}`, 'red');
      }
    });
    
    this.log(`\nTotal Duration: ${(totalDuration / 1000).toFixed(2)}s`, 'cyan');
    
    // Generate detailed report file
    this.generateDetailedReport();
  }

  generateDetailedReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        total: Object.values(this.results).filter(r => r !== null).length,
        passed: Object.values(this.results).filter(r => r && r.success).length,
        failed: Object.values(this.results).filter(r => r && !r.success).length
      }
    };
    
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    this.log(`\nDetailed report saved to: ${reportFile}`, 'cyan');
  }

  static printUsage() {
    console.log(`
Usage: node testRunner.js [test-types...]

Test Types:
  unit         Run unit tests only
  integration  Run integration tests only
  e2e          Run end-to-end tests only
  
Examples:
  node testRunner.js              # Run all tests
  node testRunner.js unit         # Run unit tests only
  node testRunner.js unit e2e     # Run unit and e2e tests
  node testRunner.js integration  # Run integration tests only

Options:
  --help       Show this help message
    `);
  }
}

// Main execution
if (process.argv.includes('--help')) {
  TestRunner.printUsage();
  process.exit(0);
}

const runner = new TestRunner();
runner.runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});