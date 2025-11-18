/**
 * Test Organization and Management System
 * Centralizes test discovery, execution, and reporting
 */

import { glob } from 'glob';
import path from 'path';
import fs from 'fs';

export class TestOrganizer {
  constructor() {
    this.testCategories = {
      unit: {
        pattern: 'src/**/*.test.{js,jsx}',
        exclude: ['**/integration/**', '**/e2e/**'],
        description: 'Unit tests for individual components and functions'
      },
      integration: {
        pattern: 'src/test/integration/**/*.test.{js,jsx}',
        description: 'Integration tests for component interactions'
      },
      hooks: {
        pattern: 'src/hooks/**/*.test.{js,jsx}',
        description: 'Tests for custom React hooks'
      },
      context: {
        pattern: 'src/context/**/*.test.{js,jsx}',
        description: 'Tests for React context providers'
      },
      services: {
        pattern: 'src/services/**/*.test.{js,jsx}',
        description: 'Tests for API services and utilities'
      },
      components: {
        pattern: 'src/components/**/*.test.{js,jsx}',
        exclude: ['**/integration/**'],
        description: 'Tests for React components'
      },
      utils: {
        pattern: 'src/utils/**/*.test.{js,jsx}',
        description: 'Tests for utility functions'
      }
    };
  }

  async discoverTests() {
    const testFiles = {};
    
    for (const [category, config] of Object.entries(this.testCategories)) {
      try {
        const files = await glob(config.pattern, {
          ignore: config.exclude || [],
          cwd: process.cwd()
        });
        
        testFiles[category] = {
          files,
          count: files.length,
          description: config.description
        };
      } catch (error) {
        console.error(`Error discovering ${category} tests:`, error);
        testFiles[category] = { files: [], count: 0, description: config.description };
      }
    }
    
    return testFiles;
  }

  async generateTestReport() {
    const testFiles = await this.discoverTests();
    const totalTests = Object.values(testFiles).reduce((sum, cat) => sum + cat.count, 0);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalTestFiles: totalTests,
      categories: testFiles,
      summary: this.generateSummary(testFiles)
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), 'src/test/reports/test-discovery.json');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  generateSummary(testFiles) {
    const summary = [];
    
    for (const [category, data] of Object.entries(testFiles)) {
      summary.push({
        category,
        count: data.count,
        description: data.description,
        status: data.count > 0 ? 'has-tests' : 'needs-tests'
      });
    }
    
    return summary;
  }

  async organizeExistingTests() {
    console.log('🔍 Discovering existing test files...');
    
    // Find all existing test files
    const allTestFiles = await glob('src/**/*.{test,spec}.{js,jsx}', {
      cwd: process.cwd()
    });
    
    console.log(`Found ${allTestFiles.length} test files`);
    
    // Categorize them
    const categorized = {};
    
    for (const file of allTestFiles) {
      const category = this.categorizeTestFile(file);
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(file);
    }
    
    // Generate organization report
    const organizationReport = {
      timestamp: new Date().toISOString(),
      totalFiles: allTestFiles.length,
      categorized,
      recommendations: this.generateRecommendations(categorized)
    };
    
    const reportPath = path.join(process.cwd(), 'src/test/reports/test-organization.json');
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(organizationReport, null, 2));
    
    return organizationReport;
  }

  categorizeTestFile(filePath) {
    if (filePath.includes('/hooks/')) return 'hooks';
    if (filePath.includes('/context/')) return 'context';
    if (filePath.includes('/services/')) return 'services';
    if (filePath.includes('/utils/')) return 'utils';
    if (filePath.includes('/components/')) return 'components';
    if (filePath.includes('/integration/')) return 'integration';
    if (filePath.includes('/e2e/')) return 'e2e';
    return 'unit';
  }

  generateRecommendations(categorized) {
    const recommendations = [];
    
    // Check for missing test categories
    for (const [category, config] of Object.entries(this.testCategories)) {
      if (!categorized[category] || categorized[category].length === 0) {
        recommendations.push({
          type: 'missing-category',
          category,
          message: `No tests found for ${category}. Consider adding tests for ${config.description.toLowerCase()}`
        });
      }
    }
    
    // Check for scattered test files
    if (categorized.unit && categorized.unit.length > 20) {
      recommendations.push({
        type: 'organization',
        message: 'Consider organizing unit tests into subdirectories by feature'
      });
    }
    
    return recommendations;
  }

  async cleanupDuplicateTests() {
    console.log('🧹 Checking for duplicate test files...');
    
    const allTestFiles = await glob('src/**/*.{test,spec}.{js,jsx}', {
      cwd: process.cwd()
    });
    
    const duplicates = [];
    const seen = new Set();
    
    for (const file of allTestFiles) {
      const basename = path.basename(file, path.extname(file));
      const normalizedName = basename.replace(/\.(test|spec)$/, '');
      
      if (seen.has(normalizedName)) {
        duplicates.push(file);
      } else {
        seen.add(normalizedName);
      }
    }
    
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} potential duplicate test files:`);
      duplicates.forEach(file => console.log(`  - ${file}`));
    }
    
    return duplicates;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const organizer = new TestOrganizer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'discover':
      organizer.generateTestReport().then(report => {
        console.log('Test Discovery Report:');
        console.log(JSON.stringify(report, null, 2));
      });
      break;
      
    case 'organize':
      organizer.organizeExistingTests().then(report => {
        console.log('Test Organization Report:');
        console.log(JSON.stringify(report, null, 2));
      });
      break;
      
    case 'cleanup':
      organizer.cleanupDuplicateTests().then(duplicates => {
        if (duplicates.length === 0) {
          console.log('✅ No duplicate test files found');
        }
      });
      break;
      
    default:
      console.log(`
Usage: node test-organization.js [command]

Commands:
  discover  - Discover and categorize all test files
  organize  - Generate organization report for existing tests
  cleanup   - Check for duplicate test files

Examples:
  node test-organization.js discover
  node test-organization.js organize
  node test-organization.js cleanup
      `);
  }
}

export default TestOrganizer;