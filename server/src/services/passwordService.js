import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

/**
 * Simplified Password Service - Using only bcrypt for consistency
 * This eliminates the intermittent auth issues caused by Argon2 fallback logic
 */
class PasswordService {
  constructor() {
    // Use consistent bcrypt rounds
    this.bcryptRounds = 12;
    
    // Log initialization
    logger.info('Password service initialized with bcrypt', {
      rounds: this.bcryptRounds,
      algorithm: 'bcrypt'
    });
  }

  /**
   * Hash a password using bcrypt consistently
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Generate salt and hash password
      const salt = await bcrypt.genSalt(this.bcryptRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.debug('Password hashed successfully', {
        passwordLength: password.length,
        hashLength: hashedPassword.length,
        algorithm: 'bcrypt',
        rounds: this.bcryptRounds
      });

      return hashedPassword;
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error.message,
        passwordLength: password?.length || 0
      });
      throw error;
    }
  }

  /**
   * Verify a password against a hash using bcrypt consistently
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} - True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        logger.debug('Password verification failed - missing password or hash', {
          hasPassword: !!password,
          hasHash: !!hash
        });
        return false;
      }

      // Handle legacy Argon2 hashes by rejecting them (force password reset)
      if (hash.startsWith('$argon2')) {
        logger.warn('Legacy Argon2 hash detected - password verification failed', {
          hashPrefix: hash.substring(0, 10)
        });
        return false;
      }

      // Use bcrypt for all password verification
      const isValid = await bcrypt.compare(password, hash);
      
      logger.debug('Password verification completed', {
        algorithm: 'bcrypt',
        isValid,
        hashLength: hash.length,
        passwordLength: password.length
      });

      return isValid;
    } catch (error) {
      logger.error('Password verification failed', {
        error: error.message,
        stack: error.stack,
        hashLength: hash?.length || 0,
        passwordLength: password?.length || 0
      });
      return false;
    }
  }

  /**
   * Check if a password hash needs upgrade (always false for bcrypt)
   * @param {string} hash - Password hash to check
   * @returns {boolean} - False (bcrypt doesn't need upgrade)
   */
  needsUpgrade(hash) {
    // Only Argon2 hashes need upgrade to bcrypt
    if (hash && hash.startsWith('$argon2')) {
      return true;
    }
    return false;
  }

  /**
   * Migrate an old hash to bcrypt (for Argon2 legacy hashes)
   * @param {string} password - Plain text password
   * @param {string} oldHash - Old password hash
   * @returns {Promise<string|null>} - New bcrypt hash or null if migration failed
   */
  async migrateHash(password, oldHash) {
    try {
      // For Argon2 hashes, we can't verify them, so we'll create a new hash
      if (oldHash.startsWith('$argon2')) {
        logger.info('Migrating Argon2 hash to bcrypt', {
          oldHashLength: oldHash.length
        });
        
        // Create new bcrypt hash
        const newHash = await this.hashPassword(password);
        
        logger.info('Password hash migrated successfully', {
          oldAlgorithm: 'argon2',
          newAlgorithm: 'bcrypt',
          oldHashLength: oldHash.length,
          newHashLength: newHash.length
        });

        return newHash;
      }

      // For bcrypt hashes, verify first then create new hash if needed
      const isValid = await this.verifyPassword(password, oldHash);
      
      if (!isValid) {
        logger.warn('Migration failed - password verification failed');
        return null;
      }

      // Create new hash with current settings
      const newHash = await this.hashPassword(password);
      
      logger.info('Password hash refreshed successfully', {
        algorithm: 'bcrypt',
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
   * Get algorithm info from hash
   * @param {string} hash - Password hash
   * @returns {object} - Algorithm information
   */
  getHashInfo(hash) {
    if (!hash) {
      return { algorithm: 'unknown', needsUpgrade: true };
    }

    if (hash.startsWith('$argon2')) {
      return { algorithm: 'argon2', needsUpgrade: true };
    }

    if (hash.startsWith('$2a') || hash.startsWith('$2b') || hash.startsWith('$2y')) {
      return { algorithm: 'bcrypt', needsUpgrade: false };
    }

    return { algorithm: 'unknown', needsUpgrade: true };
  }

  /**
   * Force bcrypt hashing (compatibility method)
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - bcrypt hash
   */
  async hashPasswordBcrypt(password) {
    return this.hashPassword(password);
  }
}

// Export singleton instance
const passwordService = new PasswordService();
export default passwordService;