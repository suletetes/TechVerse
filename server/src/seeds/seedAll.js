#!/usr/bin/env node

import { Command } from 'commander';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Seed Script - Executes database population with validation and error handling
 */
class SeedScript {
  constructor(options = {}) {
    this.options = {
      seedsPath: options.seedsPath || 'server/seeds',
      drop: options.drop || false,
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      models: options.models || null, // null means all models
      ...options
    };

    this.stats = {
      inserted: {},
      skipped: {},
      errors: {},
      warnings: []
    };

    this.seedOrder = ['categories', 'products', 'users', 'reviews', 'pages', 'stores', 'settings'];
  }

  /**
   * Run complete seeding process
   */
  async seedAll() {
    console.log('🌱 Starting Database Seeding...\n');

    try {
      // Connect to database
      await this.connectDatabase();

      // Load seed data
      const seedData = await this.loadSeedData();

      // Optionally drop existing data
      if (this.options.drop && !this.options.dryRun) {
        await this.dropExistingData();
      }

      // Seed data in dependency order
      await this.seedInOrder(seedData);

      // Generate summary report
      this.generateSummaryReport();

      console.log('\n✅ Seeding completed successfully!');

    } catch (error) {
      console.error('\n❌ Seeding failed:', error.message);
      throw error;
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
   * Load seed data from JSON files
   */
  async loadSeedData() {
    console.log('📂 Loading seed data...');
    const seedData = {};

    for (const model of this.seedOrder) {
      try {
        const filePath = path.join(this.options.seedsPath, `${model}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        seedData[model] = JSON.parse(content);
        console.log(`   Loaded ${seedData[model].length || 1} ${model} records`);
      } catch (error) {
        console.warn(`   ⚠️  Could not load ${model}.json: ${error.message}`);
        seedData[model] = model === 'settings' ? {} : [];
      }
    }

    return seedData;
  }

  /**
   * Drop existing data
   */
  async dropExistingData() {
    console.log('🗑️  Dropping existing data...');

    const collections = ['products', 'categories', 'users', 'reviews', 'pages', 'stores', 'settings'];
    
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
        console.log(`   Dropped ${collection} collection`);
      } catch (error) {
        console.warn(`   ⚠️  Could not drop ${collection}: ${error.message}`);
      }
    }
  }

  /**
   * Seed data in dependency order
   */
  async seedInOrder(seedData) {
    console.log('\n🌱 Seeding data...');

    for (const model of this.seedOrder) {
      if (this.options.models && !this.options.models.includes(model)) {
        console.log(`   Skipping ${model} (not in specified models)`);
        continue;
      }

      const data = seedData[model];
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log(`   Skipping ${model} (no data)`);
        continue;
      }

      await this.seedModel(model, data);
    }
  }

  /**
   * Seed individual model
   */
  async seedModel(modelName, data) {
    console.log(`\n📦 Seeding ${modelName}...`);

    this.stats.inserted[modelName] = 0;
    this.stats.skipped[modelName] = 0;
    this.stats.errors[modelName] = 0;

    if (modelName === 'settings') {
      await this.seedSettings(data);
      return;
    }

    const records = Array.isArray(data) ? data : [data];

    for (const record of records) {
      try {
        const validation = this.validateRecord(record, modelName);
        
        if (!validation.valid) {
          this.stats.errors[modelName]++;
          this.stats.warnings.push(`${modelName}: ${validation.errors.join(', ')}`);
          
          if (this.options.verbose) {
            console.log(`   ❌ Skipped invalid ${modelName}: ${validation.errors.join(', ')}`);
          }
          continue;
        }

        if (this.options.dryRun) {
          console.log(`   [DRY RUN] Would insert ${modelName}: ${record.name || record.slug || record.id}`);
          this.stats.inserted[modelName]++;
        } else {
          const result = await this.upsertRecord(modelName, record);
          
          if (result.upserted || result.inserted) {
            this.stats.inserted[modelName]++;
            
            if (this.options.verbose) {
              console.log(`   ✅ Inserted ${modelName}: ${record.name || record.slug || record.id}`);
            }
          } else {
            this.stats.skipped[modelName]++;
            
            if (this.options.verbose) {
              console.log(`   ⏭️  Skipped existing ${modelName}: ${record.name || record.slug || record.id}`);
            }
          }
        }

      } catch (error) {
        this.stats.errors[modelName]++;
        this.stats.warnings.push(`${modelName} ${record.name || record.id}: ${error.message}`);
        
        if (this.options.verbose) {
          console.log(`   ❌ Error inserting ${modelName}: ${error.message}`);
        }
      }
    }

    console.log(`   ${modelName}: ${this.stats.inserted[modelName]} inserted, ${this.stats.skipped[modelName]} skipped, ${this.stats.errors[modelName]} errors`);
  }

  /**
   * Seed settings (special case)
   */
  async seedSettings(settingsData) {
    try {
      if (this.options.dryRun) {
        console.log('   [DRY RUN] Would insert settings document');
        this.stats.inserted.settings = 1;
        return;
      }

      await mongoose.connection.db.collection('settings').replaceOne(
        {},
        settingsData,
        { upsert: true }
      );

      this.stats.inserted.settings = 1;
      console.log('   ✅ Settings document upserted');

    } catch (error) {
      this.stats.errors.settings = 1;
      this.stats.warnings.push(`Settings: ${error.message}`);
      console.log(`   ❌ Error inserting settings: ${error.message}`);
    }
  }

  /**
   * Validate record before insertion
   */
  validateRecord(record, modelName) {
    const errors = [];

    switch (modelName) {
      case 'products':
        if (!record.name) errors.push('name is required');
        if (typeof record.price !== 'number') errors.push('price must be a number');
        if (!record.slug) errors.push('slug is required');
        break;

      case 'categories':
        if (!record.name) errors.push('name is required');
        if (!record.slug) errors.push('slug is required');
        break;

      case 'users':
        if (!record.name) errors.push('name is required');
        if (!record.email) errors.push('email is required');
        break;

      case 'reviews':
        if (!record.authorName) errors.push('authorName is required');
        if (!record.body) errors.push('body is required');
        if (typeof record.rating !== 'number' || record.rating < 1 || record.rating > 5) {
          errors.push('rating must be between 1 and 5');
        }
        break;

      case 'pages':
        if (!record.title) errors.push('title is required');
        if (!record.slug) errors.push('slug is required');
        break;

      case 'stores':
        if (!record.city) errors.push('city is required');
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Upsert record using slug or unique field
   */
  async upsertRecord(modelName, record) {
    const collection = mongoose.connection.db.collection(modelName);
    
    // Determine unique field for upsert
    let uniqueField = 'slug';
    if (modelName === 'users') uniqueField = 'email';
    if (modelName === 'reviews') uniqueField = 'id';
    if (modelName === 'stores') uniqueField = 'id';

    const query = { [uniqueField]: record[uniqueField] };
    
    const result = await collection.replaceOne(
      query,
      record,
      { upsert: true }
    );

    return {
      upserted: result.upsertedCount > 0,
      inserted: result.modifiedCount > 0 || result.upsertedCount > 0,
      matched: result.matchedCount > 0
    };
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    console.log('\n📊 SEEDING SUMMARY');
    console.log('='.repeat(50));

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const model of this.seedOrder) {
      const inserted = this.stats.inserted[model] || 0;
      const skipped = this.stats.skipped[model] || 0;
      const errors = this.stats.errors[model] || 0;

      if (inserted > 0 || skipped > 0 || errors > 0) {
        console.log(`${model.padEnd(12)}: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
      }

      totalInserted += inserted;
      totalSkipped += skipped;
      totalErrors += errors;
    }

    console.log('='.repeat(50));
    console.log(`TOTAL: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalErrors} errors`);

    if (this.stats.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      for (const warning of this.stats.warnings.slice(0, 10)) {
        console.log(`   • ${warning}`);
      }
      
      if (this.stats.warnings.length > 10) {
        console.log(`   ... and ${this.stats.warnings.length - 10} more warnings`);
      }
    }

    if (totalErrors > 0) {
      console.log('\n❗ Some records failed to insert. Check warnings above for details.');
    }

    if (this.options.dryRun) {
      console.log('\n💡 This was a dry run. Use --drop to actually insert data.');
    }
  }
}

// CLI setup
const program = new Command();

program
  .name('seed-all')
  .description('Seed database with extracted frontend data')
  .version('1.0.0')
  .option('-p, --path <path>', 'Path to seed files directory', 'server/seeds')
  .option('--drop', 'Drop existing data before seeding')
  .option('--dry-run', 'Validate without inserting data')
  .option('-v, --verbose', 'Verbose logging')
  .option('-m, --models <models>', 'Comma-separated list of models to seed')
  .action(async (options) => {
    try {
      const seedOptions = {
        ...options,
        seedsPath: options.path,
        models: options.models ? options.models.split(',') : null
      };

      const seeder = new SeedScript(seedOptions);
      await seeder.seedAll();
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    }
  });

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export default SeedScript;