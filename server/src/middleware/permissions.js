/**
 * Permission-based authorization middleware
 */

import { hasPermission, hasAnyPermission, hasAllPermissions, ROLES, getRolePermissions } from '../config/roles.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError(
        'You do not have permission to perform this action',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return next(new AppError(
        'You do not have permission to perform this action',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user has all of the specified permissions
 */
export const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      return next(new AppError(
        'You do not have permission to perform this action',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific role
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (req.user.role !== role) {
      return next(new AppError(
        'You do not have the required role to perform this action',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user has any of the specified roles
 */
export const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        'You do not have the required role to perform this action',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
};

/**
 * Middleware to check if user is admin or super admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError(
      'Administrator access required',
      403,
      'FORBIDDEN'
    ));
  }

  next();
};

/**
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError(
      'Super administrator access required',
      403,
      'FORBIDDEN'
    ));
  }

  next();
};

/**
 * Attach user permissions to request object
 */
export const attachPermissions = (req, res, next) => {
  if (req.user && req.user.role) {
    req.userPermissions = getRolePermissions(req.user.role);
  }
  next();
};

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  requireAdmin,
  requireSuperAdmin,
  attachPermissions
};
