#!/usr/bin/env node

/**
 * Comprehensive test runner for TechVerse
 * Runs different types of tests with proper setup and reporting
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

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

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

class TestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: false, duration: 0 },
      integration: { passed: false, duration: 0 },
      coverage: { passed: false, threshold: 80 }
    };
  }

  async runCommand(command, description) {
    log.info(`Running: ${description}`);
    const startTime = Date.now();
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      const duration = Date.now() - startTime;
      log.success(`${description} completed in ${duration}ms`);
      
      return { success: true, output, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`${description} failed after ${duration}ms`);
      log.error(error.stdout || error.message);
      
      return { success: false, error: error.message, duration };
    }
  }

  async checkPrerequisites() {
    log.header('🔍 Checking Prerequisites');
    
    const checks = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          return major >= 16;
        },
        message: 'Node.js 16+ required'
      },
      {
        name: 'Package.json exists',
        check: () => existsSync('package.json'),
        message: 'package.json not found'
      },
      {
        name: 'Node modules installed',
        check: () => existsSync('node_modules'),
        message: 'Run npm install first'
      },
      {
        name: 'Test setup file exists',
        check: () => existsSync('src/test/setup.js'),
        message: 'Test setup file missing'
      },
      {
        name: 'MSW handlers exist',
        check: () => existsSync('src/mocks/handlers.js'),
        message: 'MSW handlers not found'
      }
    ];

    let allPassed = true;
    
    for (const check of checks) {
      if (check.check()) {
        log.success(check.name);
      } else {
        log.error(`${check.name}: ${check.message}`);
        allPassed = false;
      }
    }

    if (!allPassed) {
      log.error('Prerequisites check failed. Please fix the issues above.');
      process.exit(1);
    }

    log.success('All prerequisites met');
  }

  async runUnitTests() {
    log.header('🧪 Running Unit Tests');
    
    const result = await this.runCommand(
      'npm run test:unit -- --reporter=verbose',
      'Unit tests'
    );
    
    this.testResults.unit = {
      passed: result.success,
      duration: result.duration,
      output: result.output
    };

    return result.success;
  }

  async runIntegrationTests() {
    log.header('🔗 Running Integration Tests');
    
    const result = await this.runCommand(
      'npm run test:integration -- --reporter=verbose',
      'Integration tests'
    );
    
    this.testResults.integration = {
      passed: result.success,
      duration: result.duration,
      output: result.output
    };

    return result.success;
  }

  async runCoverageTests() {
    log.header('📊 Running Coverage Analysis');
    
    const result = await this.runCommand(
      'npm run test:coverage',
      'Coverage analysis'
    );
    
    if (result.success) {
      // Parse coverage results
      const coverageMatch = result.output.match(/All files\s+\|\s+(\d+\.?\d*)/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
      
      this.testResults.coverage = {
        passed: coverage >= this.testResults.coverage.threshold,
        coverage,
        threshold: this.testResults.coverage.threshold
      };
      
      if (coverage >= this.testResults.coverage.threshold) {
        log.success(`Coverage: ${coverage}% (threshold: ${this.testResults.coverage.threshold}%)`);
      } else {
        log.warning(`Coverage: ${coverage}% (below threshold: ${this.testResults.coverage.threshold}%)`);
      }
    } else {
      this.testResults.coverage.passed = false;
    }

    return result.success;
  }

  async runLinting() {
    log.header('🔍 Running Code Quality Checks');
    
    const lintResult = await this.runCommand(
      'npm run lint',
      'ESLint checks'
    );

    const typeResult = await this.runCommand(
      'npm run type-check',
      'TypeScript type checking'
    );

    return lintResult.success && typeResult.success;
  }

  async runPerformanceTests() {
    log.header('⚡ Running Performance Tests');
    
    const result = await this.runCommand(
      'npm run test:performance',
      'Performance benchmarks'
    );

    return result.success;
  }

  generateReport() {
    log.header('📋 Test Results Summary');
    
    const results = [
      {
        name: 'Unit Tests',
        passed: this.testResults.unit.passed,
        duration: this.testResults.unit.duration
      },
      {
        name: 'Integration Tests',
        passed: this.testResults.integration.passed,
        duration: this.testResults.integration.duration
      },
      {
        name: 'Coverage',
        passed: this.testResults.coverage.passed,
        details: this.testResults.coverage.coverage ? 
          `${this.testResults.coverage.coverage}%` : 'N/A'
      }
    ];

    results.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      const color = result.passed ? colors.green : colors.red;
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      const details = result.details ? ` - ${result.details}` : '';
      
      console.log(`${color}${status}${colors.reset} ${result.name}${duration}${details}`);
    });

    const allPassed = results.every(r => r.passed);
    const totalDuration = this.testResults.unit.duration + this.testResults.integration.duration;
    
    console.log(`\n${colors.bright}Overall Result:${colors.reset} ${allPassed ? 
      `${colors.green}PASSED${colors.reset}` : 
      `${colors.red}FAILED${colors.reset}`
    }`);
    
    console.log(`${colors.bright}Total Duration:${colors.reset} ${totalDuration}ms`);

    return allPassed;
  }

  async run(options = {}) {
    const {
      skipUnit = false,
      skipIntegration = false,
      skipCoverage = false,
      skipLinting = false,
      skipPerformance = true // Skip by default as it's optional
    } = options;

    log.header('🚀 TechVerse Test Suite');
    
    try {
      await this.checkPrerequisites();
      
      const results = [];
      
      if (!skipLinting) {
        results.push(await this.runLinting());
      }
      
      if (!skipUnit) {
        results.push(await this.runUnitTests());
      }
      
      if (!skipIntegration) {
        results.push(await this.runIntegrationTests());
      }
      
      if (!skipCoverage) {
        results.push(await this.runCoverageTests());
      }
      
      if (!skipPerformance) {
        results.push(await this.runPerformanceTests());
      }
      
      const allPassed = this.generateReport();
      
      if (allPassed) {
        log.success('All tests passed! 🎉');
        process.exit(0);
      } else {
        log.error('Some tests failed. Please check the results above.');
        process.exit(1);
      }
      
    } catch (error) {
      log.error(`Test runner failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--skip-unit':
        options.skipUnit = true;
        break;
      case '--skip-integration':
        options.skipIntegration = true;
        break;
      case '--skip-coverage':
        options.skipCoverage = true;
        break;
      case '--skip-linting':
        options.skipLinting = true;
        break;
      case '--include-performance':
        options.skipPerformance = false;
        break;
      case '--help':
        console.log(`
TechVerse Test Runner

Usage: node test-runner.js [options]

Options:
  --skip-unit           Skip unit tests
  --skip-integration    Skip integration tests
  --skip-coverage       Skip coverage analysis
  --skip-linting        Skip code quality checks
  --include-performance Include performance tests
  --help               Show this help message

Examples:
  node test-runner.js                    # Run all tests
  node test-runner.js --skip-coverage    # Skip coverage
  node test-runner.js --include-performance # Include performance tests
        `);
        process.exit(0);
        break;
    }
  });
  
  const runner = new TestRunner();
  runner.run(options);
}

export default TestRunner;