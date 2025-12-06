import permissionService from '../services/permissionService.js';
import logger from '../utils/logger.js';

/**
 * Permission Middleware
 * Provides middleware functions to protect routes based on permissions
 */

/**
 * Require a single permission
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
      }

      const hasPermission = await permissionService.checkUserPermission(
        req.user._id,
        permission
      );

      if (!hasPermission) {
        // Log unauthorized access
        await permissionService.logUnauthorizedAccess(
          req.user._id,
          permission,
          req.path,
          {
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        );

        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission required: ${permission}`,
          requiredPermission: permission
        });
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error', {
        error: error.message,
        permission,
        userId: req.user?._id,
        path: req.path
      });

      return res.status(500).json({
        success: false,
        code: 'PERMISSION_CHECK_ERROR',
        message: 'Error checking permissions'
      });
    }
  };
};

/**
 * Require all of multiple permissions
 */
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
      }

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(500).json({
          success: false,
          code: 'INVALID_PERMISSIONS_CONFIG',
          message: 'Invalid permissions configuration'
        });
      }

      const hasAll = await permissionService.checkUserPermissions(
        req.user._id,
        permissions,
        'all'
      );

      if (!hasAll) {
        // Log unauthorized access with all required permissions
        await permissionService.logUnauthorizedAccess(
          req.user._id,
          permissions.join(', '),
          req.path,
          {
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        );

        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Multiple permissions required',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error (all)', {
        error: error.message,
        permissions,
        userId: req.user?._id,
        path: req.path
      });

      return res.status(500).json({
        success: false,
        code: 'PERMISSION_CHECK_ERROR',
        message: 'Error checking permissions'
      });
    }
  };
};

/**
 * Require any one of multiple permissions
 */
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        });
      }

      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(500).json({
          success: false,
          code: 'INVALID_PERMISSIONS_CONFIG',
          message: 'Invalid permissions configuration'
        });
      }

      const hasAny = await permissionService.checkUserPermissions(
        req.user._id,
        permissions,
        'any'
      );

      if (!hasAny) {
        // Log unauthorized access
        await permissionService.logUnauthorizedAccess(
          req.user._id,
          permissions.join(' OR '),
          req.path,
          {
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        );

        return res.status(403).json({
          success: false,
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'At least one permission required',
          requiredPermissions: permissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error (any)', {
        error: error.message,
        permissions,
        userId: req.user?._id,
        path: req.path
      });

      return res.status(500).json({
        success: false,
        code: 'PERMISSION_CHECK_ERROR',
        message: 'Error checking permissions'
      });
    }
  };
};

/**
 * Check permission without blocking (adds hasPermission to req)
 */
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        req.hasPermission = false;
        return next();
      }

      const hasPermission = await permissionService.checkUserPermission(
        req.user._id,
        permission
      );

      req.hasPermission = hasPermission;
      next();
    } catch (error) {
      logger.error('Permission check error', {
        error: error.message,
        permission,
        userId: req.user?._id
      });

      req.hasPermission = false;
      next();
    }
  };
};

/**
 * Attach user permissions to request
 */
export const attachUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const permissions = await permissionService.getUserPermissions(req.user._id);
    req.userPermissions = permissions;

    next();
  } catch (error) {
    logger.error('Error attaching user permissions', {
      error: error.message,
      userId: req.user?._id
    });

    req.userPermissions = [];
    next();
  }
};

export default {
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  checkPermission,
  attachUserPermissions
};
