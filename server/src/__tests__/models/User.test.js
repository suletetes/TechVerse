import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { User } from '../../models/index.js';

describe('User Model', () => {
  let mongoServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isEmailVerified).toBe(false);
      expect(savedUser.createdAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50);
    });

    it('should generate username from email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.username).toBe('john.doe');
    });

    it('should set default role to user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.role).toBe('user');
    });

    it('should set default preferences', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.preferences).toBeDefined();
      expect(user.preferences.notifications).toBeDefined();
      expect(user.preferences.privacy).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should require firstName', async () => {
      const userData = {
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/firstName.*required/);
    });

    it('should require lastName', async () => {
      const userData = {
        firstName: 'John',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/lastName.*required/);
    });

    it('should require email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/email.*required/);
    });

    it('should validate email format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/email.*valid/);
    });

    it('should require unique email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      
      await expect(user2.save()).rejects.toThrow(/duplicate key/);
    });

    it('should require password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/password.*required/);
    });

    it('should validate password length', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/password.*8/);
    });

    it('should validate role enum', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid-role'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/role.*enum/);
    });

    it('should validate phone number format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: 'invalid-phone'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow(/phone.*valid/);
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await user.save();
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await user.comparePassword('wrongpassword');
        expect(isMatch).toBe(false);
      });
    });

    describe('createPasswordResetToken', () => {
      it('should create password reset token', () => {
        const token = user.createPasswordResetToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20);
        expect(user.passwordResetToken).toBeDefined();
        expect(user.passwordResetExpires).toBeDefined();
        expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
      });

      it('should set expiry to 10 minutes from now', () => {
        const beforeTime = Date.now();
        user.createPasswordResetToken();
        const afterTime = Date.now();
        
        const expectedExpiry = beforeTime + 10 * 60 * 1000;
        const actualExpiry = user.passwordResetExpires.getTime();
        
        expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry);
        expect(actualExpiry).toBeLessThanOrEqual(afterTime + 10 * 60 * 1000);
      });
    });

    describe('createEmailVerificationToken', () => {
      it('should create email verification token', () => {
        const token = user.createEmailVerificationToken();
        
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20);
        expect(user.emailVerificationToken).toBeDefined();
        expect(user.emailVerificationExpires).toBeDefined();
      });

      it('should set expiry to 24 hours from now', () => {
        const beforeTime = Date.now();
        user.createEmailVerificationToken();
        const afterTime = Date.now();
        
        const expectedExpiry = beforeTime + 24 * 60 * 60 * 1000;
        const actualExpiry = user.emailVerificationExpires.getTime();
        
        expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry);
        expect(actualExpiry).toBeLessThanOrEqual(afterTime + 24 * 60 * 60 * 1000);
      });
    });

    describe('getFullName', () => {
      it('should return full name', () => {
        const fullName = user.getFullName();
        expect(fullName).toBe('John Doe');
      });

      it('should handle missing names gracefully', () => {
        user.firstName = '';
        user.lastName = '';
        const fullName = user.getFullName();
        expect(fullName).toBe('');
      });
    });

    describe('getInitials', () => {
      it('should return initials', () => {
        const initials = user.getInitials();
        expect(initials).toBe('JD');
      });

      it('should handle single name', () => {
        user.lastName = '';
        const initials = user.getInitials();
        expect(initials).toBe('J');
      });

      it('should handle missing names', () => {
        user.firstName = '';
        user.lastName = '';
        const initials = user.getInitials();
        expect(initials).toBe('');
      });
    });

    describe('isAccountLocked', () => {
      it('should return false for unlocked account', () => {
        expect(user.isAccountLocked()).toBe(false);
      });

      it('should return true for locked account', () => {
        user.accountLocked = true;
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        expect(user.isAccountLocked()).toBe(true);
      });

      it('should return false for expired lock', () => {
        user.accountLocked = true;
        user.lockUntil = Date.now() - 1000;
        expect(user.isAccountLocked()).toBe(false);
      });
    });

    describe('incrementLoginAttempts', () => {
      it('should increment login attempts', async () => {
        await user.incrementLoginAttempts();
        expect(user.loginAttempts).toBe(1);
      });

      it('should lock account after max attempts', async () => {
        user.loginAttempts = 4; // One less than max
        await user.incrementLoginAttempts();
        
        expect(user.accountLocked).toBe(true);
        expect(user.lockUntil).toBeDefined();
        expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
      });

      it('should reset attempts after successful login', async () => {
        user.loginAttempts = 3;
        await user.resetLoginAttempts();
        
        expect(user.loginAttempts).toBe(0);
        expect(user.accountLocked).toBe(false);
        expect(user.lockUntil).toBeUndefined();
      });
    });

    describe('updateLastLogin', () => {
      it('should update last login timestamp', async () => {
        const beforeTime = Date.now();
        await user.updateLastLogin();
        const afterTime = Date.now();
        
        expect(user.lastLogin).toBeDefined();
        expect(user.lastLogin.getTime()).toBeGreaterThanOrEqual(beforeTime);
        expect(user.lastLogin.getTime()).toBeLessThanOrEqual(afterTime);
      });

      it('should update login count', async () => {
        const initialCount = user.loginCount || 0;
        await user.updateLastLogin();
        
        expect(user.loginCount).toBe(initialCount + 1);
      });
    });

    describe('addRefreshToken', () => {
      it('should add refresh token', () => {
        const token = 'refresh-token-123';
        user.addRefreshToken(token);
        
        expect(user.refreshTokens).toHaveLength(1);
        expect(user.refreshTokens[0].token).toBe(token);
        expect(user.refreshTokens[0].createdAt).toBeDefined();
      });

      it('should limit number of refresh tokens', () => {
        // Add maximum number of tokens
        for (let i = 0; i < 6; i++) {
          user.addRefreshToken(`token-${i}`);
        }
        
        expect(user.refreshTokens).toHaveLength(5); // Should be limited to 5
      });
    });

    describe('removeRefreshToken', () => {
      it('should remove specific refresh token', () => {
        const token1 = 'token-1';
        const token2 = 'token-2';
        
        user.addRefreshToken(token1);
        user.addRefreshToken(token2);
        
        user.removeRefreshToken(token1);
        
        expect(user.refreshTokens).toHaveLength(1);
        expect(user.refreshTokens[0].token).toBe(token2);
      });
    });

    describe('clearAllRefreshTokens', () => {
      it('should clear all refresh tokens', () => {
        user.addRefreshToken('token-1');
        user.addRefreshToken('token-2');
        
        user.clearAllRefreshTokens();
        
        expect(user.refreshTokens).toHaveLength(0);
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
          isEmailVerified: true
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'password123',
          role: 'admin',
          isEmailVerified: false
        },
        {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          password: 'password123',
          role: 'user',
          isEmailVerified: true,
          accountLocked: true,
          lockUntil: Date.now() + 15 * 60 * 1000
        }
      ]);
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const user = await User.findByEmail('john@example.com');
        
        expect(user).toBeDefined();
        expect(user.email).toBe('john@example.com');
        expect(user.firstName).toBe('John');
      });

      it('should return null for non-existent email', async () => {
        const user = await User.findByEmail('nonexistent@example.com');
        expect(user).toBeNull();
      });
    });

    describe('findByUsername', () => {
      it('should find user by username', async () => {
        const user = await User.findByUsername('john');
        
        expect(user).toBeDefined();
        expect(user.username).toBe('john');
      });
    });

    describe('findVerifiedUsers', () => {
      it('should return only verified users', async () => {
        const users = await User.findVerifiedUsers();
        
        expect(users).toHaveLength(2); // John and Bob (Jane is not verified)
        users.forEach(user => {
          expect(user.isEmailVerified).toBe(true);
        });
      });
    });

    describe('findByRole', () => {
      it('should find users by role', async () => {
        const adminUsers = await User.findByRole('admin');
        const regularUsers = await User.findByRole('user');
        
        expect(adminUsers).toHaveLength(1);
        expect(adminUsers[0].role).toBe('admin');
        
        expect(regularUsers).toHaveLength(2);
        regularUsers.forEach(user => {
          expect(user.role).toBe('user');
        });
      });
    });

    describe('findActiveUsers', () => {
      it('should return only active (non-locked) users', async () => {
        const activeUsers = await User.findActiveUsers();
        
        expect(activeUsers).toHaveLength(2); // John and Jane (Bob is locked)
        activeUsers.forEach(user => {
          expect(user.isAccountLocked()).toBe(false);
        });
      });
    });

    describe('searchUsers', () => {
      it('should search users by name or email', async () => {
        const results = await User.searchUsers('john');
        
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(user => 
          user.firstName.toLowerCase().includes('john') ||
          user.email.toLowerCase().includes('john')
        )).toBe(true);
      });

      it('should return empty array for no matches', async () => {
        const results = await User.searchUsers('nonexistent');
        expect(results).toHaveLength(0);
      });
    });

    describe('getUserStats', () => {
      it('should return user statistics', async () => {
        const stats = await User.getUserStats();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBe(3);
        expect(stats.verified).toBe(2);
        expect(stats.unverified).toBe(1);
        expect(stats.locked).toBe(1);
        expect(stats.byRole).toBeDefined();
        expect(stats.byRole.user).toBe(2);
        expect(stats.byRole.admin).toBe(1);
      });
    });
  });

  describe('Virtuals', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await user.save();
    });

    it('should have fullName virtual', () => {
      expect(user.fullName).toBe('John Doe');
    });

    it('should have initials virtual', () => {
      expect(user.initials).toBe('JD');
    });
  });

  describe('Middleware', () => {
    it('should hash password on save', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const originalPassword = user.password;
      await user.save();

      expect(user.password).not.toBe(originalPassword);
      expect(user.password.startsWith('$2a$')).toBe(true);
    });

    it('should not hash password if not modified', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await user.save();

      const hashedPassword = user.password;
      user.firstName = 'Jane';
      await user.save();

      expect(user.password).toBe(hashedPassword);
    });

    it('should generate username from email', async () => {
      const user = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      });
      await user.save();

      expect(user.username).toBe('john.doe');
    });

    it('should handle duplicate username generation', async () => {
      // Create first user
      const user1 = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await user1.save();

      // Create second user with same username base
      const user2 = new User({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@different.com',
        password: 'password123'
      });
      await user2.save();

      expect(user1.username).toBe('john');
      expect(user2.username).toMatch(/john\d+/);
    });
  });

  describe('Indexes', () => {
    it('should have unique index on email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user1 = new User(userData);
      await user1.save();

      const user2 = new User(userData);
      
      await expect(user2.save()).rejects.toThrow();
    });

    it('should have unique index on username', async () => {
      const user1 = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john1@example.com',
        password: 'password123',
        username: 'johndoe'
      });
      await user1.save();

      const user2 = new User({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'password123',
        username: 'johndoe'
      });
      
      await expect(user2.save()).rejects.toThrow();
    });
  });
});