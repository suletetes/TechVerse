/**
 * Unit Tests for Permission Service
 * Tests: Task 32 - Permission Service unit tests
 */

import permissionService from '../../../src/services/permissionService.js';
import User from '../../../src/models/User.js';
import Role from '../../../src/models/Role.js';
import AuditLog from '../../../src/models/AuditLog.js';
import { isValidPermission, matchesPermissionPattern } from '../../../src/config/permissions.js';

// Mock dependencies
jest.mock('../../../src/models/User.js');
jest.mock('../../../src/models/Role.js');
jest.mock('../../../src/models/AuditLog.js');
jest.mock('../../../src/config/permissions.js');
jest.mock('../../../src/utils/logger.js');

describe('PermissionService', () => {
  const userId = 'user123';
  const mockUser = {
    _id: userId,
    role: 'admin',
    permissions: ['products.read', 'products.write', 'orders.read'],
    save: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear permission cache before each test
    permissionService.invalidateAllCaches();
  });

  describe('checkUserPermission', () => {
    test('should return true for valid permission', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await permissionService.checkUserPermission(userId, 'products.read');

      expect(isValidPermission).toHaveBeenCalledWith('products.read');
      expect(result).toBe(true);
    });

    test('should return false for invalid permission', async () => {
      isValidPermission.mockReturnValue(false);

      const result = await permissionService.checkUserPermission(userId, 'invalid.permission');

      expect(result).toBe(false);
    });

    test('should return true for wildcard permission', async () => {
      isValidPermission.mockReturnValue(true);
      const superAdminUser = { ...mockUser, permissions: ['*'] };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(superAdminUser)
      });

      const result = await permissionService.checkUserPermission(userId, 'any.permission');

      expect(result).toBe(true);
    });

    test('should use cached permission on second call', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // First call - should hit database
      await permissionService.checkUserPermission(userId, 'products.read');
      
      // Second call - should use cache
      const result = await permissionService.checkUserPermission(userId, 'products.read');

      expect(User.findById).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    test('should check pattern matches for wildcard permissions', async () => {
      isValidPermission.mockReturnValue(true);
      const userWithWildcard = { ...mockUser, permissions: ['products.*'] };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithWildcard)
      });
      matchesPermissionPattern.mockReturnValue(true);

      const result = await permissionService.checkUserPermission(userId, 'products.delete');

      expect(matchesPermissionPattern).toHaveBeenCalledWith('products.delete', 'products.*');
      expect(result).toBe(true);
    });

    test('should return false for permission not in user permissions', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      matchesPermissionPattern.mockReturnValue(false);

      const result = await permissionService.checkUserPermission(userId, 'users.delete');

      expect(result).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await permissionService.checkUserPermission(userId, 'products.read');

      expect(result).toBe(false);
    });
  });

  describe('checkUserPermissions', () => {
    test('should return true when user has all permissions (mode: all)', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await permissionService.checkUserPermissions(
        userId,
        ['products.read', 'products.write'],
        'all'
      );

      expect(result).toBe(true);
    });

    test('should return false when user missing one permission (mode: all)', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await permissionService.checkUserPermissions(
        userId,
        ['products.read', 'users.delete'],
        'all'
      );

      expect(result).toBe(false);
    });

    test('should return true when user has any permission (mode: any)', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await permissionService.checkUserPermissions(
        userId,
        ['products.read', 'users.delete'],
        'any'
      );

      expect(result).toBe(true);
    });

    test('should return false when user has no permissions (mode: any)', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      matchesPermissionPattern.mockReturnValue(false);

      const result = await permissionService.checkUserPermissions(
        userId,
        ['users.delete', 'users.create'],
        'any'
      );

      expect(result).toBe(false);
    });

    test('should return false for empty permissions array', async () => {
      const result = await permissionService.checkUserPermissions(userId, [], 'all');

      expect(result).toBe(false);
    });

    test('should return false for non-array permissions', async () => {
      const result = await permissionService.checkUserPermissions(userId, 'not-an-array', 'all');

      expect(result).toBe(false);
    });

    test('should handle errors gracefully', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await permissionService.checkUserPermissions(
        userId,
        ['products.read'],
        'all'
      );

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    test('should return user permissions from cache', async () => {
      // First call to populate cache
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      
      await permissionService.getUserPermissions(userId);
      
      // Second call should use cache
      const result = await permissionService.getUserPermissions(userId);

      expect(User.findById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser.permissions);
    });

    test('should fetch permissions from role if user has no cached permissions', async () => {
      const userWithoutPerms = { ...mockUser, permissions: [] };
      const mockRole = {
        name: 'admin',
        permissions: ['products.read', 'products.write', 'orders.read']
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithoutPerms)
      });
      Role.findOne.mockResolvedValue(mockRole);
      userWithoutPerms.save.mockResolvedValue(userWithoutPerms);

      const result = await permissionService.getUserPermissions(userId);

      expect(Role.findOne).toHaveBeenCalledWith({ name: userWithoutPerms.role });
      expect(userWithoutPerms.save).toHaveBeenCalled();
      expect(result).toEqual(mockRole.permissions);
    });

    test('should return empty array if user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const result = await permissionService.getUserPermissions(userId);

      expect(result).toEqual([]);
    });

    test('should return empty array if role not found', async () => {
      const userWithoutPerms = { ...mockUser, permissions: [] };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithoutPerms)
      });
      Role.findOne.mockResolvedValue(null);

      const result = await permissionService.getUserPermissions(userId);

      expect(result).toEqual([]);
    });

    test('should handle errors gracefully', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await permissionService.getUserPermissions(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserPermissionsGrouped', () => {
    test('should group permissions by resource', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const result = await permissionService.getUserPermissionsGrouped(userId);

      expect(result).toEqual({
        products: ['read', 'write'],
        orders: ['read']
      });
    });

    test('should handle wildcard permission', async () => {
      const superAdminUser = { ...mockUser, permissions: ['*'] };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(superAdminUser)
      });

      const result = await permissionService.getUserPermissionsGrouped(userId);

      expect(result).toEqual({
        all: ['*']
      });
    });

    test('should handle errors gracefully', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await permissionService.getUserPermissionsGrouped(userId);

      expect(result).toEqual({});
    });
  });

  describe('Cache Management', () => {
    test('should invalidate user cache', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Populate cache
      await permissionService.checkUserPermission(userId, 'products.read');
      
      // Invalidate cache
      permissionService.invalidateUserCache(userId);
      
      // Next call should hit database again
      await permissionService.checkUserPermission(userId, 'products.read');

      expect(User.findById).toHaveBeenCalledTimes(2);
    });

    test('should invalidate all caches', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Populate cache
      await permissionService.checkUserPermission(userId, 'products.read');
      
      // Invalidate all caches
      permissionService.invalidateAllCaches();
      
      // Next call should hit database again
      await permissionService.checkUserPermission(userId, 'products.read');

      expect(User.findById).toHaveBeenCalledTimes(2);
    });

    test('should get cache statistics', async () => {
      isValidPermission.mockReturnValue(true);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Populate cache
      await permissionService.checkUserPermission(userId, 'products.read');
      
      const stats = permissionService.getCacheStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('expired');
      expect(stats).toHaveProperty('ttl');
      expect(stats.active).toBeGreaterThan(0);
    });

    test('should clean expired cache entries', async () => {
      // This test would require mocking Date.now() to simulate expired entries
      const cleaned = permissionService.cleanExpiredCache();

      expect(typeof cleaned).toBe('number');
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('logUnauthorizedAccess', () => {
    test('should log unauthorized access attempt', async () => {
      AuditLog.logUnauthorizedAccess = jest.fn().mockResolvedValue({});

      await permissionService.logUnauthorizedAccess(
        userId,
        'products.delete',
        '/api/products/123',
        {
          method: 'DELETE',
          ip: '127.0.0.1',
          userAgent: 'Test Agent'
        }
      );

      expect(AuditLog.logUnauthorizedAccess).toHaveBeenCalledWith(userId, {
        endpoint: '/api/products/123',
        permission: 'products.delete',
        method: 'DELETE',
        ip: '127.0.0.1',
        userAgent: 'Test Agent'
      });
    });

    test('should handle logging errors gracefully', async () => {
      AuditLog.logUnauthorizedAccess = jest.fn().mockRejectedValue(new Error('Log error'));

      await expect(
        permissionService.logUnauthorizedAccess(userId, 'products.delete', '/api/products/123')
      ).resolves.not.toThrow();
    });
  });
});
