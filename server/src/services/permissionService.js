import User from '../models/User.js';
import Role from '../models/Role.js';
import AuditLog from '../models/AuditLog.js';
import { isValidPermission, matchesPermissionPattern } from '../config/permissions.js';
import { DEFAULT_ROLES } from '../config/defaultRoles.js';
import logger from '../utils/logger.js';

/**
 * Permission Service
 * Handles permission checking and caching
 */

// In-memory cache for user permissions (with TTL)
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class PermissionService {
  /**
   * Check if user has a specific permission
   */
  async checkUserPermission(userId, permission) {
    try {
      // Validate permission
      if (!isValidPermission(permission)) {
        logger.warn('Invalid permission check attempted', {
          userId,
          permission
        });
        return false;
      }

      // Check cache first
      const cacheKey = `${userId}:${permission}`;
      const cached = this.getCachedPermission(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Get user permissions
      const userPermissions = await this.getUserPermissions(userId);

      // Check if user has wildcard permission (super admin)
      if (userPermissions.includes('*')) {
        this.setCachedPermission(cacheKey, true);
        return true;
      }

      // Check for exact permission match
      if (userPermissions.includes(permission)) {
        this.setCachedPermission(cacheKey, true);
        return true;
      }

      // Check for pattern matches (e.g., 'products.*')
      const hasPermission = userPermissions.some(userPerm =>
        matchesPermissionPattern(permission, userPerm)
      );

      this.setCachedPermission(cacheKey, hasPermission);
      return hasPermission;
    } catch (error) {
      logger.error('Error checking user permission', {
        error: error.message,
        userId,
        permission
      });
      return false;
    }
  }

  /**
   * Check if user has multiple permissions
   */
  async checkUserPermissions(userId, permissions, mode = 'all') {
    try {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return false;
      }

      const checks = await Promise.all(
        permissions.map(permission => this.checkUserPermission(userId, permission))
      );

      if (mode === 'all') {
        return checks.every(result => result === true);
      } else if (mode === 'any') {
        return checks.some(result => result === true);
      }

      return false;
    } catch (error) {
      logger.error('Error checking user permissions', {
        error: error.message,
        userId,
        permissions,
        mode
      });
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId) {
    try {
      // Check cache first
      const cacheKey = `user:${userId}:permissions`;
      const cached = this.getCachedPermissions(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Fetch user with permissions
      const user = await User.findById(userId).select('role permissions');

      if (!user) {
        logger.warn('User not found when fetching permissions', { userId });
        return [];
      }

      // If user has cached permissions, use them
      if (user.permissions && user.permissions.length > 0) {
        this.setCachedPermissions(cacheKey, user.permissions);
        return user.permissions;
      }

      // Otherwise, fetch from role
      let rolePermissions = [];
      const role = await Role.findOne({ name: user.role });

      if (role) {
        rolePermissions = role.permissions;
      } else {
        // Fallback to default roles configuration if Role document doesn't exist
        const defaultRole = DEFAULT_ROLES[user.role];
        if (defaultRole) {
          rolePermissions = defaultRole.permissions;
          logger.info('Using default role permissions', {
            userId,
            roleName: user.role,
            permissionsCount: rolePermissions.length
          });
        } else {
          logger.warn('Role not found for user', {
            userId,
            roleName: user.role
          });
          return [];
        }
      }

      // Update user's cached permissions
      user.permissions = rolePermissions;
      await user.save();

      this.setCachedPermissions(cacheKey, rolePermissions);
      return rolePermissions;
    } catch (error) {
      logger.error('Error getting user permissions', {
        error: error.message,
        userId
      });
      return [];
    }
  }

  /**
   * Get permissions grouped by resource for a user
   */
  async getUserPermissionsGrouped(userId) {
    try {
      const permissions = await this.getUserPermissions(userId);

      const grouped = {};

      permissions.forEach(permission => {
        if (permission === '*') {
          grouped['all'] = ['*'];
          return;
        }

        const [resource, action] = permission.split('.');
        if (!grouped[resource]) {
          grouped[resource] = [];
        }
        grouped[resource].push(action);
      });

      return grouped;
    } catch (error) {
      logger.error('Error getting grouped user permissions', {
        error: error.message,
        userId
      });
      return {};
    }
  }

  /**
   * Invalidate permission cache for a user
   */
  invalidateUserCache(userId) {
    try {
      const keysToDelete = [];

      for (const key of permissionCache.keys()) {
        if (key.startsWith(`${userId}:`) || key === `user:${userId}:permissions`) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => permissionCache.delete(key));

      logger.debug('Invalidated permission cache for user', {
        userId,
        keysDeleted: keysToDelete.length
      });
    } catch (error) {
      logger.error('Error invalidating user cache', {
        error: error.message,
        userId
      });
    }
  }

  /**
   * Invalidate all permission caches
   */
  invalidateAllCaches() {
    try {
      const size = permissionCache.size;
      permissionCache.clear();

      logger.info('Cleared all permission caches', {
        entriesCleared: size
      });
    } catch (error) {
      logger.error('Error clearing all caches', {
        error: error.message
      });
    }
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(userId, permission, endpoint, metadata = {}) {
    try {
      await AuditLog.logUnauthorizedAccess(userId, {
        endpoint,
        permission,
        method: metadata.method,
        ip: metadata.ip,
        userAgent: metadata.userAgent
      });

      logger.warn('Unauthorized access attempt', {
        userId,
        permission,
        endpoint,
        ...metadata
      });
    } catch (error) {
      logger.error('Error logging unauthorized access', {
        error: error.message,
        userId,
        permission,
        endpoint
      });
    }
  }

  /**
   * Get cached permission result
   */
  getCachedPermission(key) {
    const cached = permissionCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() > cached.expiresAt) {
      permissionCache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set cached permission result
   */
  setCachedPermission(key, value) {
    permissionCache.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL
    });
  }

  /**
   * Get cached permissions array
   */
  getCachedPermissions(key) {
    const cached = permissionCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() > cached.expiresAt) {
      permissionCache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set cached permissions array
   */
  setCachedPermissions(key, value) {
    permissionCache.set(key, {
      value,
      expiresAt: Date.now() + CACHE_TTL
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    let expired = 0;
    let active = 0;

    for (const [key, value] of permissionCache.entries()) {
      if (Date.now() > value.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: permissionCache.size,
      active,
      expired,
      ttl: CACHE_TTL
    };
  }

  /**
   * Clean expired cache entries
   */
  cleanExpiredCache() {
    const keysToDelete = [];

    for (const [key, value] of permissionCache.entries()) {
      if (Date.now() > value.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => permissionCache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug('Cleaned expired cache entries', {
        entriesRemoved: keysToDelete.length
      });
    }

    return keysToDelete.length;
  }
}

// Clean expired cache entries every minute
setInterval(() => {
  const service = new PermissionService();
  service.cleanExpiredCache();
}, 60 * 1000);

export default new PermissionService();
