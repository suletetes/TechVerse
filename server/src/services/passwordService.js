import { hash, verify } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

/**
 * Password Service with Argon2 and bcrypt support
 * Provides secure password hashing with migration support
 */
class PasswordService {
  constructor() {
    // Argon2 configuration - using recommended settings for 2024
    this.argon2Options = {
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 4,    // 4 parallel threads
      hashLength: 32,    // 32 byte hash length
      variant: 'argon2id' // Argon2id variant (most secure)
    };

    // bcrypt rounds for fallback
    this.bcryptRounds = 12;
  }

  /**
   * Hash a password using Argon2
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password with Argon2 prefix
   */
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const hashedPassword = await hash(password, this.argon2Options);
      
      // Add prefix to identify Argon2 hashes
      const prefixedHash = `$argon2id${hashedPassword}`;

      logger.debug('Password hashed successfully with Argon2', {
        passwordLength: password.length,
        hashLength: prefixedHash.length,
        algorithm: 'argon2id'
      });

      return prefixedHash;
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error.message,
        passwordLength: password?.length || 0
      });
      throw error;
    }
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} - True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }

      // Check if it's an Argon2 hash (has our custom prefix)
      if (hash.startsWith('$argon2id')) {
        // Remove our custom prefix and verify with Argon2
        const actualHash = hash.substring('$argon2id'.length);
        const isValid = await verify(actualHash, password);
        
        logger.debug('Password verification completed', {
          algorithm: 'argon2id',
          isValid,
          hashLength: hash.length
        });

        return isValid;
      }

      // Check if it's a standard Argon2 hash (without our prefix)
      if (hash.startsWith('$argon2')) {
        const isValid = await verify(hash, password);
        
        logger.debug('Password verification completed', {
          algorithm: 'argon2',
          isValid,
          hashLength: hash.length
        });

        return isValid;
      }

      // Fallback to bcrypt for existing passwords
      const isValid = await bcrypt.compare(password, hash);
      
      logger.debug('Password verification completed', {
        algorithm: 'bcrypt',
        isValid,
        hashLength: hash.length
      });

      return isValid;
    } catch (error) {
      logger.error('Password verification failed', {
        error: error.message,
        stack: error.stack,
        hashLength: hash?.length || 0
      });
      return false;
    }
  }

  /**
   * Check if a password hash needs upgrade
   * @param {string} hash - Password hash to check
   * @returns {boolean} - True if hash needs upgrade
   */
  needsUpgrade(hash) {
    if (!hash) return false;
    
    // If it's not using our Argon2 prefix, it needs upgrade
    return !hash.startsWith('$argon2id');
  }

  /**
   * Migrate an old hash to new format
   * @param {string} password - Plain text password
   * @param {string} oldHash - Old password hash
   * @returns {Promise<string|null>} - New hash or null if migration failed
   */
  async migrateHash(password, oldHash) {
    try {
      // First verify the password against the old hash
      const isValid = await this.verifyPassword(password, oldHash);
      
      if (!isValid) {
        return null;
      }

      // Create new hash with current algorithm
      const newHash = await this.hashPassword(password);
      
      logger.info('Password hash migrated successfully', {
        oldAlgorithm: oldHash.startsWith('$argon2') ? 'argon2' : 'bcrypt',
        newAlgorithm: 'argon2id',
        oldHashLength: oldHash.length,
        newHashLength: newHash.length
      });

      return newHash;
    } catch (error) {
      logger.error('Password hash migration failed', {
        error: error.message,
        oldHashLength: oldHash?.length || 0
      });
      return null;
    }
  }

  /**
   * Hash password with bcrypt (for compatibility)
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - bcrypt hash
   */
  async hashPasswordBcrypt(password) {
    try {
      const salt = await bcrypt.genSalt(this.bcryptRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.debug('Password hashed successfully with bcrypt', {
        passwordLength: password.length,
        hashLength: hashedPassword.length,
        algorithm: 'bcrypt'
      });

      return hashedPassword;
    } catch (error) {
      logger.error('bcrypt password hashing failed', {
        error: error.message,
        passwordLength: password?.length || 0
      });
      throw error;
    }
  }

  /**
   * Get algorithm info from hash
   * @param {string} hash - Password hash
   * @returns {object} - Algorithm information
   */
  getHashInfo(hash) {
    if (!hash) {
      return { algorithm: 'unknown', needsUpgrade: true };
    }

    if (hash.startsWith('$argon2id')) {
      return { algorithm: 'argon2id', needsUpgrade: false };
    }

    if (hash.startsWith('$argon2')) {
      return { algorithm: 'argon2', needsUpgrade: true };
    }

    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return { algorithm: 'bcrypt', needsUpgrade: true };
    }

    return { algorithm: 'unknown', needsUpgrade: true };
  }
}

// Export singleton instance
export default new PasswordService();