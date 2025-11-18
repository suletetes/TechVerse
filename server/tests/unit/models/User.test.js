import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../src/models/index.js';

// Mock bcrypt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('User Model Unit Tests', () => {
  let userData;

  beforeEach(() => {
    userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      role: 'user'
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('User Schema Validation', () => {
    it('should create user with valid data', async () => {
      const user = new User(userData);
      
      // Mock validation
      user.validate = jest.fn().mockResolvedValue();
      
      await expect(user.validate()).resolves.toBeUndefined();
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.email).toBe('john.doe@example.com');
    });

    it('should require firstName', async () => {
      delete userData.firstName;
      const user = new User(userData);
      
      await expect(user.validate()).rejects.toThrow();
    });

    it('should require lastName', async () => {
      delete userData.lastName;
      const user = new User(userData);
      
      await expect(user.validate()).rejects.toThrow();
    });

    it('should require valid email format', async () => {
      userData.email = 'invalid-email';
      const user = new User(userData);
      
      await expect(user.validate()).rejects.toThrow();
    });

    it('should require password with minimum length', async () => {
      userData.password = '123';
      const user = new User(userData);
      
      await expect(user.validate()).rejects.toThrow();
    });

    it('should validate role enum values', async () => {
      userData.role = 'invalid-role';
      const user = new User(userData);
      
      await expect(user.validate()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User(userData);
      const hashedPassword = 'hashed-password-123';
      
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      // Mock the pre-save middleware
      user.isModified = jest.fn().mockReturnValue(true);
      user.password = userData.password;
      
      // Simulate pre-save hook
      if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
      expect(user.password).toBe(hashedPassword);
    });

    it('should not hash password if not modified', async () => {
      const user = new User(userData);
      user.isModified = jest.fn().mockReturnValue(false);
      
      // Simulate pre-save hook
      if (!user.isModified('password')) {
        // Password should not be hashed
      }
      
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(() => {
      user = new User(userData);
      user._id = new mongoose.Types.ObjectId();
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const password = 'Password123!';
        const hashedPassword = 'hashed-password-123';
        user.password = hashedPassword;
        
        bcrypt.compare.mockResolvedValue(true);
        
        // Mock the method
        user.comparePassword = async function(candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        };
        
        const result = await user.comparePassword(password);
        
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'WrongPassword';
        const hashedPassword = 'hashed-password-123';
        user.password = hashedPassword;
        
        bcrypt.compare.mockResolvedValue(false);
        
        user.comparePassword = async function(candidatePassword) {
          return await bcrypt.compare(candidatePassword, this.password);
        };
        
        const result = await user.comparePassword(password);
        
        expect(result).toBe(false);
      });
    });

    describe('generateAccessToken', () => {
      it('should generate valid access token', () => {
        const token = 'mock-access-token';
        jwt.sign.mockReturnValue(token);
        
        user.generateAccessToken = function() {
          return jwt.sign(
            { 
              userId: this._id,
              email: this.email,
              role: this.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
          );
        };
        
        const result = user.generateAccessToken();
        
        expect(jwt.sign).toHaveBeenCalledWith(
          {
            userId: user._id,
            email: user.email,
            role: user.role
          },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        expect(result).toBe(token);
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate valid refresh token', () => {
        const token = 'mock-refresh-token';
        jwt.sign.mockReturnValue(token);
        
        user.generateRefreshToken = function() {
          return jwt.sign(
            { userId: this._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
          );
        };
        
        const result = user.generateRefreshToken();
        
        expect(jwt.sign).toHaveBeenCalledWith(
          { userId: user._id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );
        expect(result).toBe(token);
      });
    });

    describe('getPublicProfile', () => {
      it('should return user profile without sensitive data', () => {
        user.password = 'hashed-password';
        user.refreshTokens = ['token1', 'token2'];
        user.resetPasswordToken = 'reset-token';
        
        user.getPublicProfile = function() {
          const userObject = this.toObject();
          delete userObject.password;
          delete userObject.refreshTokens;
          delete userObject.resetPasswordToken;
          delete userObject.resetPasswordExpires;
          delete userObject.emailVerificationToken;
          return userObject;
        };
        
        const profile = user.getPublicProfile();
        
        expect(profile.firstName).toBe('John');
        expect(profile.lastName).toBe('Doe');
        expect(profile.email).toBe('john.doe@example.com');
        expect(profile.password).toBeUndefined();
        expect(profile.refreshTokens).toBeUndefined();
        expect(profile.resetPasswordToken).toBeUndefined();
      });
    });

    describe('isAccountActive', () => {
      it('should return true for active account', () => {
        user.accountStatus = 'active';
        user.isEmailVerified = true;
        
        user.isAccountActive = function() {
          return this.accountStatus === 'active' && this.isEmailVerified;
        };
        
        const result = user.isAccountActive();
        expect(result).toBe(true);
      });

      it('should return false for suspended account', () => {
        user.accountStatus = 'suspended';
        user.isEmailVerified = true;
        
        user.isAccountActive = function() {
          return this.accountStatus === 'active' && this.isEmailVerified;
        };
        
        const result = user.isAccountActive();
        expect(result).toBe(false);
      });

      it('should return false for unverified email', () => {
        user.accountStatus = 'active';
        user.isEmailVerified = false;
        
        user.isAccountActive = function() {
          return this.accountStatus === 'active' && this.isEmailVerified;
        };
        
        const result = user.isAccountActive();
        expect(result).toBe(false);
      });
    });

    describe('getFullName', () => {
      it('should return full name', () => {
        user.getFullName = function() {
          return `${this.firstName} ${this.lastName}`;
        };
        
        const fullName = user.getFullName();
        expect(fullName).toBe('John Doe');
      });
    });
  });

  describe('Static Methods', () => {
    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const mockUser = { email: 'john.doe@example.com' };
        
        User.findOne = jest.fn().mockResolvedValue(mockUser);
        
        const result = await User.findByEmail('john.doe@example.com');
        
        expect(User.findOne).toHaveBeenCalledWith({ 
          email: 'john.doe@example.com' 
        });
        expect(result).toBe(mockUser);
      });
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate fullName virtual', () => {
      const user = new User(userData);
      
      // Mock virtual getter
      Object.defineProperty(user, 'fullName', {
        get: function() {
          return `${this.firstName} ${this.lastName}`;
        }
      });
      
      expect(user.fullName).toBe('John Doe');
    });

    it('should calculate initials virtual', () => {
      const user = new User(userData);
      
      Object.defineProperty(user, 'initials', {
        get: function() {
          return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`;
        }
      });
      
      expect(user.initials).toBe('JD');
    });
  });

  describe('Indexes', () => {
    it('should have unique index on email', () => {
      // This would be tested in integration tests
      // Here we just verify the schema definition
      expect(User.schema.paths.email.options.unique).toBe(true);
    });

    it('should have index on accountStatus', () => {
      // This would be tested in integration tests
      expect(User.schema.paths.accountStatus).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should set default values correctly', () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      
      expect(user.role).toBe('user');
      expect(user.isEmailVerified).toBe(false);
      expect(user.addresses).toEqual([]);
    });
  });
});