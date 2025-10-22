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
      const prefixedHash = `$argon2id$${hashedPassword}`;

      logger.debug('Password hashed successfully with Argon2', {
        passwordLength: password.length,
        hashLength: prefixedHash.length,
        algorithm: 'argon2id'
      });

      return prefixedHash;
    } catch (error) {
      logger.error('Password hashing failed', {
        error: error.message,
        stack: error.stack,
        algorithm: 'argon2id'
      });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify a password against a hash (supports both Argon2 and bcrypt)
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
      if (hash.startsWith('$argon2id$')) {
        // Remove our custom prefix and verify with Argon2
        const actualHash = hash.substring('$argon2id$'.length);
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
   * Check if a hash needs to be upgraded to Argon2
   * @param {string} hash - Stored password hash
   * @returns {boolean} - True if hash should be upgraded
   */
  needsUpgrade(hash) {
    if (!hash) return false;
    
    // If it's already an Argon2 hash with our prefix, no upgrade needed
    if (hash.startsWith('$argon2id$')) {
      return false;
    }

    // If it's a standard Argon2 hash, might need upgrade to our format
    if (hash.startsWith('$argon2')) {
      return true; // Upgrade to our prefixed format
    }

    // If it's bcrypt, definitely needs upgrade
    return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
  }

  /**
   * Migrate a bcrypt hash to Argon2 (requires plain text password)
   * This is used during login when we have access to the plain text password
   * @param {string} password - Plain text password
   * @param {string} oldHash - Current bcrypt hash
   * @returns {Promise<string|null>} - New Argon2 hash or null if verification fails
   */
  async migrateHash(password, oldHash) {
    try {
      // First verify the password against the old hash
      const isValid = await this.verifyPassword(password, oldHash);
      
      if (!isValid) {
        logger.warn('Hash migration failed: password verification failed', {
          oldHashType: this.getHashType(oldHash)
        });
        return null;
      }

      // Generate new Argon2 hash
      const newHash = await this.hashPassword(password);
      
      logger.info('Password hash migrated successfully', {
        oldHashType: this.getHashType(oldHash),
        newHashType: 'argon2id',
        oldHashLength: oldHash.length,
        newHashLength: newHash.length
      });

      return newHash;
    } catch (error) {
      logger.error('Hash migration failed', {
        error: error.message,
        stack: error.stack,
        oldHashType: this.getHashType(oldHash)
      });
      return null;
    }
  }

  /**
   * Get the type of hash algorithm used
   * @param {string} hash - Password hash
   * @returns {string} - Hash algorithm type
   */
  getHashType(hash) {
    if (!hash) return 'unknown';
    
    if (hash.startsWith('$argon2id$')) return 'argon2id-prefixed';
    if (hash.startsWith('$argon2id')) return 'argon2id';
    if (hash.startsWith('$argon2i')) return 'argon2i';
    if (hash.startsWith('$argon2d')) return 'argon2d';
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) return 'bcrypt';
    
    return 'unknown';
  }

  /**
   * Generate a secure random password
   * @param {number} length - Password length (default: 16)
   * @returns {string} - Generated password
   */
  generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with score and feedback
   */
  validatePasswordStrength(password) {
    if (!password) {
      return {
        isValid: false,
        score: 0,
        feedback: ['Password is required']
      };
    }

    const feedback = [];
    let score = 0;

    // Length check
    if (password.length < 6) {
      feedback.push('Password must be at least 6 characters long');
    } else if (password.length >= 8) {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Password should contain lowercase letters');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password should contain uppercase letters');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password should contain numbers');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password should contain special characters');
    } else {
      score += 1;
    }

    // Common password check
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      feedback.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    const isValid = password.length >= 6 && feedback.length === 0;

    return {
      isValid,
      score,
      feedback,
      strength: this.getStrengthLabel(score)
    };
  }

  /**
   * Get password strength label
   * @param {number} score - Password score
   * @returns {string} - Strength label
   */
  getStrengthLabel(score) {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  }
}

// Export singleton instance
export default new PasswordService();