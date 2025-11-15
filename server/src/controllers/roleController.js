/**
 * Role Management Controller
 * Handles role assignment and permission management
 */

import { User } from '../models/index.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { ROLES, ROLE_INFO, ROLE_PERMISSIONS, getRolePermissions } from '../config/roles.js';
import logger from '../utils/logger.js';

// @desc    Get all available roles
// @route   GET /api/admin/roles
// @access  Private (Admin/Super Admin)
export const getAllRoles = asyncHandler(async (req, res, next) => {
  const roles = Object.values(ROLES).map(role => ({
    value: role,
    ...ROLE_INFO[role],
    permissions: ROLE_PERMISSIONS[role] || []
  }));

  res.status(200).json({
    success: true,
    message: 'Roles retrieved successfully',
    data: { roles }
  });
});

// @desc    Get role details
// @route   GET /api/admin/roles/:role
// @access  Private (Admin/Super Admin)
export const getRoleDetails = asyncHandler(async (req, res, next) => {
  const { role } = req.params;

  if (!ROLES[role.toUpperCase()]) {
    return next(new AppError('Invalid role', 400, 'INVALID_ROLE'));
  }

  const roleValue = ROLES[role.toUpperCase()];
  const roleDetails = {
    value: roleValue,
    ...ROLE_INFO[roleValue],
    permissions: ROLE_PERMISSIONS[roleValue] || []
  };

  res.status(200).json({
    success: true,
    message: 'Role details retrieved successfully',
    data: { role: roleDetails }
  });
});

// @desc    Assign role to user
// @route   PATCH /api/admin/users/:userId/role
// @access  Private (Super Admin only)
export const assignRole = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    return next(new AppError('Invalid role', 400, 'INVALID_ROLE'));
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  // Prevent changing super admin role (only super admin can do this)
  if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError(
      'Only super administrators can modify super admin roles',
      403,
      'FORBIDDEN'
    ));
  }

  // Prevent assigning super admin role (only super admin can do this)
  if (role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    return next(new AppError(
      'Only super administrators can assign super admin role',
      403,
      'FORBIDDEN'
    ));
  }

  // Prevent users from changing their own role
  if (user._id.toString() === req.user._id.toString()) {
    return next(new AppError(
      'You cannot change your own role',
      400,
      'CANNOT_CHANGE_OWN_ROLE'
    ));
  }

  const oldRole = user.role;
  user.role = role;
  await user.save();

  logger.info('User role changed', {
    userId: user._id,
    userEmail: user.email,
    oldRole,
    newRole: role,
    changedBy: req.user._id,
    changedByEmail: req.user.email
  });

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleInfo: ROLE_INFO[user.role]
      }
    }
  });
});

// @desc    Get users by role
// @route   GET /api/admin/roles/:role/users
// @access  Private (Admin/Super Admin)
export const getUsersByRole = asyncHandler(async (req, res, next) => {
  const { role } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    return next(new AppError('Invalid role', 400, 'INVALID_ROLE'));
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({ role })
      .select('firstName lastName email isActive accountStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments({ role })
  ]);

  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
});

// @desc    Get role statistics
// @route   GET /api/admin/roles/stats
// @access  Private (Admin/Super Admin)
export const getRoleStats = asyncHandler(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        role: '$_id',
        count: 1,
        active: 1,
        inactive: 1,
        _id: 0
      }
    }
  ]);

  // Add role info to stats
  const enrichedStats = stats.map(stat => ({
    ...stat,
    roleInfo: ROLE_INFO[stat.role] || {}
  }));

  res.status(200).json({
    success: true,
    message: 'Role statistics retrieved successfully',
    data: { stats: enrichedStats }
  });
});

// @desc    Bulk assign roles
// @route   POST /api/admin/roles/bulk-assign
// @access  Private (Super Admin only)
export const bulkAssignRoles = asyncHandler(async (req, res, next) => {
  const { assignments } = req.body; // Array of { userId, role }

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return next(new AppError('Assignments array is required', 400, 'INVALID_INPUT'));
  }

  if (assignments.length > 100) {
    return next(new AppError('Maximum 100 assignments per request', 400, 'TOO_MANY_ASSIGNMENTS'));
  }

  const results = {
    success: [],
    failed: []
  };

  for (const assignment of assignments) {
    try {
      const { userId, role } = assignment;

      // Validate
      if (!userId || !role) {
        results.failed.push({ userId, error: 'Missing userId or role' });
        continue;
      }

      if (!Object.values(ROLES).includes(role)) {
        results.failed.push({ userId, error: 'Invalid role' });
        continue;
      }

      const user = await User.findById(userId);
      if (!user) {
        results.failed.push({ userId, error: 'User not found' });
        continue;
      }

      // Prevent changing super admin
      if (user.role === ROLES.SUPER_ADMIN) {
        results.failed.push({ userId, error: 'Cannot modify super admin' });
        continue;
      }

      // Prevent assigning super admin
      if (role === ROLES.SUPER_ADMIN) {
        results.failed.push({ userId, error: 'Cannot assign super admin role' });
        continue;
      }

      user.role = role;
      await user.save();

      results.success.push({ userId, role });

      logger.info('Bulk role assignment', {
        userId,
        role,
        assignedBy: req.user._id
      });

    } catch (error) {
      results.failed.push({ userId: assignment.userId, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Bulk role assignment completed',
    data: results
  });
});

export default {
  getAllRoles,
  getRoleDetails,
  assignRole,
  getUsersByRole,
  getRoleStats,
  bulkAssignRoles
};
