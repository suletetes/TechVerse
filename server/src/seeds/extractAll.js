#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { FrontendScanner } from './FrontendScanner.js';
import { DataExtractor } from './DataExtractor.js';
import { ValidationEngine } from './ValidationEngine.js';
import { AssetManager } from './AssetManager.js';

/**
 * Main Extraction Orchestrator - Coordinates all components for complete frontend data extraction
 */
class ExtractionOrchestrator {
  constructor(options = {}) {
    this.options = {
      clientPath: options.clientPath || 'client',
      serverPath: options.serverPath || 'server',
      outputPath: options.outputPath || 'server/seeds',
      dryRun: options.dryRun || false,
      copyAssets: options.copyAssets !== false,
      generatePlaceholders: options.generatePlaceholders !== false,
      ...options
    };

    this.scanner = new FrontendScanner(this.options.clientPath);
    this.validationEngine = new ValidationEngine({
      defaultCurrency: 'USD',
      defaultStock: 50,
      generatePlaceholders: this.options.generatePlaceholders,
      replaceLorem: true
    });
    this.extractor = new DataExtractor(this.validationEngine);
    this.assetManager = new AssetManager(this.options.clientPath, this.options.serverPath, {
      copyAssets: this.options.copyAssets
    });

    this.extractedData = {
      products: [],
      categories: [],
      reviews: [],
      users: [],
      pages: [],
      stores: [],
      settings: { homepage: {}, site: {} }
    };

    this.issues = [];
    this.stats = {
      filesScanned: 0,
      dataExtracted: 0,
      validationErrors: 0,
      assetsProcessed: 0
    };
  }

  /**
   * Run complete extraction process
   */
  async extractAll() {
    console.log('🚀 Starting Frontend Data Extraction...\n');

    try {
      // Step 1: Scan frontend files
      await this.scanFrontendFiles();

      // Step 2: Extract data from files
      await this.extractDataFromFiles();

      // Step 3: Validate and normalize data
      await this.validateAndNormalizeData();

      // Step 4: Process assets
      await this.processAssets();

      // Step 5: Generate seed files
      await this.generateSeedFiles();

      // Step 6: Generate documentation
      await this.generateDocumentation();

      // Step 7: Generate summary report
      this.generateSummaryReport();

      console.log('\n✅ Extraction completed successfully!');

    } catch (error) {
      console.error('\n❌ Extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Scan frontend files
   */
  async scanFrontendFiles() {
    console.log('📁 Scanning frontend files...');

    const scanResults = await this.scanner.getFullScanResults();
    this.stats.filesScanned = scanResults.stats.totalFiles;

    console.log(`   Found ${scanResults.stats.componentFiles} components`);
    console.log(`   Found ${scanResults.stats.assetFiles} assets`);
    console.log(`   Found ${scanResults.stats.dataFiles} data files`);
    console.log(`   Identified ${scanResults.stats.productSources} product sources`);
    console.log(`   Identified ${scanResults.stats.categorySources} category sources`);

    this.scanResults = scanResults;
  }

  /**
   * Extract data from scanned files
   */
  async extractDataFromFiles() {
    console.log('\n🔍 Extracting data from files...');

    const { categorized } = this.scanResults;
    let extractedCount = 0;

    // Extract products
    for (const filePath of categorized.productSources) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const products = await this.extractor.extractProducts(content, filePath);
        this.extractedData.products.push(...products);
        extractedCount += products.length;
      } catch (error) {
        this.addIssue(filePath, `Product extraction failed: ${error.message}`);
      }
    }

    // Extract categories
    for (const filePath of categorized.categorySources) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const categories = await this.extractor.extractCategories(content, filePath);
        this.extractedData.categories.push(...categories);
        extractedCount += categories.length;
      } catch (error) {
        this.addIssue(filePath, `Category extraction failed: ${error.message}`);
      }
    }

    // Extract reviews
    for (const filePath of categorized.reviewSources) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const reviews = await this.extractor.extractReviews(content, filePath);
        this.extractedData.reviews.push(...reviews);
        extractedCount += reviews.length;
      } catch (error) {
        this.addIssue(filePath, `Review extraction failed: ${error.message}`);
      }
    }

    // Extract users
    for (const filePath of categorized.userSources) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const users = await this.extractor.extractUsers(content, filePath);
        this.extractedData.users.push(...users);
        extractedCount += users.length;
      } catch (error) {
        this.addIssue(filePath, `User extraction failed: ${error.message}`);
      }
    }

    // Extract pages
    for (const filePath of categorized.pageSources) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const pages = await this.extractor.extractPages(content, filePath);
        this.extractedData.pages.push(...pages);
        extractedCount += pages.length;
      } catch (error) {
        this.addIssue(filePath, `Page extraction failed: ${error.message}`);
      }
    }

    // Extract settings
    for (const filePath of categorized.settingSources) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const settings = await this.extractor.extractSettings(content, filePath);
        Object.assign(this.extractedData.settings.homepage, settings.homepage);
        Object.assign(this.extractedData.settings.site, settings.site);
      } catch (error) {
        this.addIssue(filePath, `Settings extraction failed: ${error.message}`);
      }
    }

    this.stats.dataExtracted = extractedCount;
    console.log(`   Extracted ${this.extractedData.products.length} products`);
    console.log(`   Extracted ${this.extractedData.categories.length} categories`);
    console.log(`   Extracted ${this.extractedData.reviews.length} reviews`);
    console.log(`   Extracted ${this.extractedData.users.length} users`);
    console.log(`   Extracted ${this.extractedData.pages.length} pages`);
  }

  /**
   * Validate and normalize extracted data
   */
  async validateAndNormalizeData() {
    console.log('\n✅ Validating and normalizing data...');

    // Validate and normalize each data type
    this.extractedData.products = this.extractedData.products.map(product => {
      const validation = this.validationEngine.validateProduct(product);
      if (!validation.valid) {
        this.stats.validationErrors += validation.errors.length;
        this.addIssue('validation', `Product ${product.name}: ${validation.errors.join(', ')}`);
      }
      return validation.normalized;
    });

    this.extractedData.categories = this.extractedData.categories.map(category => {
      const validation = this.validationEngine.validateCategory(category);
      if (!validation.valid) {
        this.stats.validationErrors += validation.errors.length;
        this.addIssue('validation', `Category ${category.name}: ${validation.errors.join(', ')}`);
      }
      return validation.normalized;
    });

    this.extractedData.reviews = this.extractedData.reviews.map(review => {
      const validation = this.validationEngine.validateReview(review);
      if (!validation.valid) {
        this.stats.validationErrors += validation.errors.length;
        this.addIssue('validation', `Review ${review.id}: ${validation.errors.join(', ')}`);
      }
      return validation.normalized;
    });

    this.extractedData.users = this.extractedData.users.map(user => {
      const validation = this.validationEngine.validateUser(user);
      if (!validation.valid) {
        this.stats.validationErrors += validation.errors.length;
        this.addIssue('validation', `User ${user.name}: ${validation.errors.join(', ')}`);
      }
      return validation.normalized;
    });

    this.extractedData.pages = this.extractedData.pages.map(page => {
      const validation = this.validationEngine.validatePage(page);
      if (!validation.valid) {
        this.stats.validationErrors += validation.errors.length;
        this.addIssue('validation', `Page ${page.title}: ${validation.errors.join(', ')}`);
      }
      return validation.normalized;
    });

    // Deduplicate data
    this.extractedData.products = this.validationEngine.deduplicateProducts(this.extractedData.products);
    this.extractedData.categories = this.validationEngine.deduplicateCategories(this.extractedData.categories);
    this.extractedData.users = this.validationEngine.deduplicateUsers(this.extractedData.users);

    // Validate relationships
    const relationshipValidation = this.validationEngine.validateRelationships(this.extractedData);
    if (!relationshipValidation.valid) {
      for (const issue of relationshipValidation.issues) {
        this.addIssue('relationships', `${issue.type}: ${issue.suggestion}`);
      }
    }

    console.log(`   Validated ${this.extractedData.products.length} products`);
    console.log(`   Validated ${this.extractedData.categories.length} categories`);
    console.log(`   Found ${this.stats.validationErrors} validation errors`);
  }

  /**
   * Process assets (images)
   */
  async processAssets() {
    console.log('\n🖼️  Processing assets...');

    this.extractedData = await this.assetManager.validateAllImages(this.extractedData);
    const assetReport = this.assetManager.generateAssetReport();
    
    this.stats.assetsProcessed = assetReport.statistics.totalProcessed;
    
    console.log(`   Processed ${assetReport.statistics.totalProcessed} assets`);
    console.log(`   Found ${assetReport.statistics.foundCount} existing images`);
    console.log(`   Missing ${assetReport.statistics.missingCount} images`);
    
    if (this.options.copyAssets) {
      console.log(`   Copied ${assetReport.statistics.copiedCount} images to server`);
    }
  }

  /**
   * Generate seed files
   */
  async generateSeedFiles() {
    console.log('\n📄 Generating seed files...');

    if (this.options.dryRun) {
      console.log('   (Dry run - files not written)');
      return;
    }

    // Ensure output directory exists
    await fs.mkdir(this.options.outputPath, { recursive: true });

    // Generate individual seed files
    const seedFiles = [
      { name: 'products.json', data: this.extractedData.products },
      { name: 'categories.json', data: this.extractedData.categories },
      { name: 'reviews.json', data: this.extractedData.reviews },
      { name: 'users.json', data: this.extractedData.users },
      { name: 'pages.json', data: this.extractedData.pages },
      { name: 'stores.json', data: this.extractedData.stores },
      { name: 'settings.json', data: this.extractedData.settings }
    ];

    for (const seedFile of seedFiles) {
      const filePath = path.join(this.options.outputPath, seedFile.name);
      await fs.writeFile(filePath, JSON.stringify(seedFile.data, null, 2));
      console.log(`   Generated ${seedFile.name} (${seedFile.data.length || 1} records)`);
    }

    // Generate combined seed file
    const combinedPath = path.join(this.options.outputPath, 'initial_seed.json');
    await fs.writeFile(combinedPath, JSON.stringify(this.extractedData, null, 2));
    console.log(`   Generated initial_seed.json (combined)`);
  }

  /**
   * Generate documentation files
   */
  async generateDocumentation() {
    console.log('\n📚 Generating documentation...');

    if (this.options.dryRun) {
      console.log('   (Dry run - documentation not written)');
      return;
    }

    // Generate SEED_MAPPING.md
    await this.generateMappingDoc();

    // Generate SEED_ASSETS.md
    await this.generateAssetsDoc();

    // Generate SEED_ISSUES.md
    await this.generateIssuesDoc();

    // Generate SEED_TESTS.md
    await this.generateTestsDoc();
  }

  /**
   * Generate mapping documentation
   */
  async generateMappingDoc() {
    const content = `# Seed Data Mapping

This document maps frontend fields to server model fields for each data type.

## Product Model

| Frontend Field | Server Field | Type | Notes |
|---------------|--------------|------|-------|
| title/name | name | String | Product display name |
| price | price | Number | Numeric price value |
| currency | currency | String | ISO currency code |
| images | images | Array | Normalized image paths |
| category | category | String | Category slug reference |
| variants | variants | Array | Product variants with SKU |
| specs | specs | Object | Product specifications |
| stock | stock | Number | Inventory quantity |

## Category Model

| Frontend Field | Server Field | Type | Notes |
|---------------|--------------|------|-------|
| name | name | String | Category display name |
| slug | slug | String | URL-safe identifier |
| description | description | String | Category description |
| image | image | String | Category image path |
| parentId | parentId | String | Parent category reference |

## Review Model

| Frontend Field | Server Field | Type | Notes |
|---------------|--------------|------|-------|
| author/authorName | authorName | String | Reviewer name |
| rating/stars | rating | Number | Rating 1-5 |
| body/comment/review | body | String | Review content |
| date | date | String | ISO date format |
| verified | verified | Boolean | Verified purchase flag |

## User Model

| Frontend Field | Server Field | Type | Notes |
|---------------|--------------|------|-------|
| name | name | String | User full name |
| email | email | String | User email address |
| role | role | String | User role (admin/user) |
| status | status | String | Account status |
| joinDate | joinDate | String | ISO date format |
| permissions | permissions | Array | User permissions |

## Settings Model

| Frontend Field | Server Field | Type | Notes |
|---------------|--------------|------|-------|
| Homepage components | homepage.latestProducts | Array | Product slugs |
| Homepage components | homepage.topSellers | Array | Product slugs |
| Homepage components | homepage.quickPicks | Array | Product slugs |
| Homepage components | homepage.weeklyDeals | Array | Product slugs |

## Default Values Applied

- **Currency**: USD (if not specified)
- **Stock**: 50 (if not specified)
- **Status**: active (for products)
- **Created/Updated**: Current timestamp
- **User Role**: user (if not admin)
`;

    await fs.writeFile('server/SEED_MAPPING.md', content);
    console.log('   Generated SEED_MAPPING.md');
  }

  /**
   * Generate assets documentation
   */
  async generateAssetsDoc() {
    const assetReport = this.assetManager.generateAssetReport();
    
    let content = `# Seed Assets Report

Generated: ${assetReport.timestamp}

## Statistics

- **Total Processed**: ${assetReport.statistics.totalProcessed}
- **Found**: ${assetReport.statistics.foundCount}
- **Missing**: ${assetReport.statistics.missingCount}
- **Copied**: ${assetReport.statistics.copiedCount}
- **Success Rate**: ${assetReport.statistics.successRate.toFixed(1)}%

## Found Assets

`;

    for (const asset of assetReport.found) {
      content += `- ✅ ${asset}\n`;
    }

    content += `\n## Missing Assets\n\n`;

    for (const asset of assetReport.missing) {
      content += `- ❌ ${asset}\n`;
      if (assetReport.suggestions[asset]) {
        content += `  - Suggestions: ${assetReport.suggestions[asset].join(', ')}\n`;
      }
    }

    content += `\n## Copied Assets\n\n`;

    for (const copied of assetReport.copied) {
      content += `- 📁 ${copied.original} → ${copied.server}\n`;
    }

    await fs.writeFile('server/SEED_ASSETS.md', content);
    console.log('   Generated SEED_ASSETS.md');
  }

  /**
   * Generate issues documentation
   */
  async generateIssuesDoc() {
    let content = `# Seed Issues and Assumptions

Generated: ${new Date().toISOString()}

## Issues Found

`;

    for (const issue of this.issues) {
      content += `- **${issue.context}**: ${issue.message}\n`;
    }

    content += `\n## Assumptions Made

- Default currency set to USD where not specified
- Default stock quantity set to 50 where not specified
- Product status defaulted to 'active'
- Missing descriptions generated using product name context
- Lorem ipsum content replaced with realistic placeholders
- SVG images excluded from product image processing
- User passwords set to 'CHANGE_ME' placeholder

## Manual Actions Required

- Review and update placeholder passwords for users
- Verify generated product descriptions are appropriate
- Check missing image suggestions and upload assets as needed
- Validate homepage product assignments match business requirements
`;

    await fs.writeFile('server/SEED_ISSUES.md', content);
    console.log('   Generated SEED_ISSUES.md');
  }

  /**
   * Generate tests documentation
   */
  async generateTestsDoc() {
    const content = `# Seed Data Verification Tests

## Running Seeds

\`\`\`bash
cd server
npm run seed:drop  # Drop existing data and seed
npm run seed       # Seed without dropping
npm run seed:dry   # Dry run validation
\`\`\`

## Sanity Check

\`\`\`bash
npm run seed:check
\`\`\`

## API Verification

### Products Endpoint
\`\`\`bash
curl http://localhost:5000/api/products?limit=10
\`\`\`
Expected: Array of products with name, price, images

### Categories Endpoint
\`\`\`bash
curl http://localhost:5000/api/categories
\`\`\`
Expected: Array of categories with name, slug, description

### Health Check
\`\`\`bash
curl http://localhost:5000/api/health
\`\`\`
Expected: Status OK response

## Data Integrity Checks

1. **Product Count**: Should have ${this.extractedData.products.length}+ products
2. **Category References**: All products should reference existing categories
3. **Homepage Settings**: All referenced product slugs should exist
4. **Image Assets**: All product images should be accessible
5. **User Accounts**: Admin users should have proper permissions

## Manual Verification Steps

1. Start the server: \`npm run dev\`
2. Check product listings load correctly
3. Verify category navigation works
4. Test homepage sections display products
5. Confirm admin users can access admin features
`;

    await fs.writeFile('server/SEED_TESTS.md', content);
    console.log('   Generated SEED_TESTS.md');
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    console.log('\n📊 EXTRACTION SUMMARY');
    console.log('='.repeat(50));
    console.log(`📁 Files Scanned: ${this.stats.filesScanned}`);
    console.log(`📦 Products Extracted: ${this.extractedData.products.length}`);
    console.log(`🏷️  Categories Extracted: ${this.extractedData.categories.length}`);
    console.log(`⭐ Reviews Extracted: ${this.extractedData.reviews.length}`);
    console.log(`👥 Users Extracted: ${this.extractedData.users.length}`);
    console.log(`📄 Pages Extracted: ${this.extractedData.pages.length}`);
    console.log(`🖼️  Assets Processed: ${this.stats.assetsProcessed}`);
    console.log(`⚠️  Validation Errors: ${this.stats.validationErrors}`);
    console.log(`❗ Issues Found: ${this.issues.length}`);
    console.log('='.repeat(50));

    if (this.issues.length > 0) {
      console.log('\n⚠️  Review SEED_ISSUES.md for details on issues and assumptions');
    }
    
    if (this.stats.validationErrors > 0) {
      console.log('⚠️  Some validation errors occurred - check logs above');
    }
  }

  /**
   * Add issue to tracking
   */
  addIssue(context, message) {
    this.issues.push({
      context,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

// CLI setup
const program = new Command();

program
  .name('extract-all')
  .description('Extract all frontend data for database seeding')
  .version('1.0.0')
  .option('-c, --client <path>', 'Client directory path', 'client')
  .option('-s, --server <path>', 'Server directory path', 'server')
  .option('-o, --output <path>', 'Output directory for seed files', 'server/seeds')
  .option('--dry-run', 'Validate without writing files')
  .option('--no-copy-assets', 'Skip copying assets to server')
  .option('--no-placeholders', 'Skip generating placeholder content')
  .action(async (options) => {
    try {
      const orchestrator = new ExtractionOrchestrator(options);
      await orchestrator.extractAll();
    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      process.exit(1);
    }
  });

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export default ExtractionOrchestrator;