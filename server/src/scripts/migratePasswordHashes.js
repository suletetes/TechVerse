import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import passwordService from '../services/passwordService.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

/**
 * Migration script to identify users with bcrypt password hashes
 * Note: This script only identifies users that need migration.
 * Actual migration happens during login when we have access to plain text passwords.
 */
class PasswordHashMigration {
  constructor() {
    this.stats = {
      total: 0,
      argon2: 0,
      bcrypt: 0,
      unknown: 0,
      needsMigration: 0
    };
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('Connected to MongoDB for password hash migration');
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Failed to disconnect from MongoDB', { error: error.message });
    }
  }

  async analyzePasswordHashes() {
    try {
      console.log('🔍 Analyzing password hashes in the database...\n');

      // Get all users with passwords
      const users = await User.find({ password: { $exists: true, $ne: null } })
        .select('_id email password createdAt')
        .lean();

      this.stats.total = users.length;

      console.log(`Found ${users.length} users with password hashes\n`);

      const analysis = {
        argon2: [],
        bcrypt: [],
        unknown: [],
        needsMigration: []
      };

      for (const user of users) {
        const hashType = passwordService.getHashType(user.password);
        const needsUpgrade = passwordService.needsUpgrade(user.password);

        switch (hashType) {
          case 'argon2id-prefixed':
          case 'argon2id':
          case 'argon2i':
          case 'argon2d':
            this.stats.argon2++;
            analysis.argon2.push({
              id: user._id,
              email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              hashType,
              createdAt: user.createdAt
            });
            break;
          case 'bcrypt':
            this.stats.bcrypt++;
            analysis.bcrypt.push({
              id: user._id,
              email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              hashType,
              createdAt: user.createdAt
            });
            break;
          default:
            this.stats.unknown++;
            analysis.unknown.push({
              id: user._id,
              email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
              hashType,
              createdAt: user.createdAt
            });
        }

        if (needsUpgrade) {
          this.stats.needsMigration++;
          analysis.needsMigration.push({
            id: user._id,
            email: user.email.replace(/(.{3}).*(@.*)/, '$1***$2'),
            hashType,
            createdAt: user.createdAt
          });
        }
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze password hashes', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async addMigrationFlags() {
    try {
      console.log('🏷️  Adding migration flags to users...\n');

      // Add a flag to users who need password migration
      const result = await User.updateMany(
        {
          password: { $exists: true, $ne: null },
          $or: [
            { password: { $regex: /^\$2[aby]\$/ } }, // bcrypt hashes
            { password: { $regex: /^\$argon2[id]?\$/ } } // standard argon2 without our prefix
          ]
        },
        {
          $set: {
            needsPasswordMigration: true,
            passwordMigrationDate: new Date()
          }
        }
      );

      console.log(`✅ Added migration flags to ${result.modifiedCount} users`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Failed to add migration flags', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async removeMigrationFlags() {
    try {
      console.log('🧹 Removing migration flags from migrated users...\n');

      // Remove flags from users with Argon2 hashes (already migrated)
      const result = await User.updateMany(
        {
          password: { $regex: /^\$argon2id\$/ }, // Our prefixed Argon2 hashes
          needsPasswordMigration: true
        },
        {
          $unset: {
            needsPasswordMigration: 1,
            passwordMigrationDate: 1
          },
          $set: {
            passwordMigratedAt: new Date()
          }
        }
      );

      console.log(`✅ Removed migration flags from ${result.modifiedCount} migrated users`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Failed to remove migration flags', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  printReport(analysis) {
    console.log('📊 Password Hash Analysis Report');
    console.log('================================\n');

    console.log(`Total users with passwords: ${this.stats.total}`);
    console.log(`Users with Argon2 hashes: ${this.stats.argon2} (${((this.stats.argon2 / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`Users with bcrypt hashes: ${this.stats.bcrypt} (${((this.stats.bcrypt / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`Users with unknown hashes: ${this.stats.unknown} (${((this.stats.unknown / this.stats.total) * 100).toFixed(1)}%)`);
    console.log(`Users needing migration: ${this.stats.needsMigration} (${((this.stats.needsMigration / this.stats.total) * 100).toFixed(1)}%)\n`);

    if (this.stats.needsMigration > 0) {
      console.log('⚠️  Migration Required');
      console.log('=====================');
      console.log(`${this.stats.needsMigration} users have password hashes that should be migrated to Argon2.`);
      console.log('Migration will happen automatically when users log in.\n');

      console.log('📝 Migration Process:');
      console.log('1. Users with bcrypt hashes will be automatically migrated during login');
      console.log('2. The system supports both hash types during the transition period');
      console.log('3. No user action is required - migration is transparent');
      console.log('4. Run this script periodically to monitor migration progress\n');
    } else {
      console.log('✅ All password hashes are up to date!');
      console.log('No migration required.\n');
    }

    if (this.stats.unknown > 0) {
      console.log('❓ Unknown Hash Types');
      console.log('====================');
      console.log('Some users have password hashes with unknown formats.');
      console.log('These may need manual investigation:\n');
      
      analysis.unknown.forEach((user, index) => {
        if (index < 5) { // Show first 5 examples
          console.log(`- User: ${user.email}, Hash Type: ${user.hashType}, Created: ${user.createdAt}`);
        }
      });
      
      if (analysis.unknown.length > 5) {
        console.log(`... and ${analysis.unknown.length - 5} more`);
      }
      console.log();
    }

    console.log('🔒 Security Notes:');
    console.log('==================');
    console.log('- Argon2 is the current recommended password hashing algorithm');
    console.log('- bcrypt hashes remain secure but Argon2 provides better protection');
    console.log('- The migration preserves all existing functionality');
    console.log('- Users will not notice any difference in the login process\n');
  }

  async run(options = {}) {
    try {
      await this.connect();

      const analysis = await this.analyzePasswordHashes();
      this.printReport(analysis);

      if (options.addFlags && this.stats.needsMigration > 0) {
        await this.addMigrationFlags();
      }

      if (options.removeFlags) {
        await this.removeMigrationFlags();
      }

      await this.disconnect();
      
      return {
        success: true,
        stats: this.stats,
        analysis
      };
    } catch (error) {
      console.error('❌ Migration script failed:', error.message);
      await this.disconnect();
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const migration = new PasswordHashMigration();
  
  const options = {
    addFlags: process.argv.includes('--add-flags'),
    removeFlags: process.argv.includes('--remove-flags')
  };

  console.log('🔐 Password Hash Migration Tool');
  console.log('===============================\n');

  migration.run(options)
    .then((result) => {
      if (result.success) {
        console.log('✅ Migration analysis completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Migration analysis failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error.message);
      process.exit(1);
    });
}

export default PasswordHashMigration;