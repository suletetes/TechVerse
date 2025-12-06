import express from 'express';
import { body, param, query } from 'express-validator';
import roleService from '../services/roleService.js';
import auditService from '../services/auditService.js';
import permissionService from '../services/permissionService.js';
import { authenticate } from '../middleware/passportAuth.js';
import { requirePermission, requireAllPermissions } from '../middleware/permissions.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Validation middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Import validationResult
import { validationResult } from 'express-validator';

/**
 * @route   POST /api/admin/roles
 * @desc    Create a new role
 * @access  Super Admin only
 */
router.post(
  '/',
  authenticate,
  requirePermission('roles.create'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Role name is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Role name must be between 3 and 50 characters')
      .matches(/^[a-z_]+$/)
      .withMessage('Role name must contain only lowercase letters and underscores'),
    body('displayName')
      .trim()
      .notEmpty()
      .withMessage('Display name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Display name must be between 3 and 100 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('permissions')
      .isArray({ min: 1 })
      .withMessage('Permissions must be a non-empty array'),
    body('priority')
      .isInt({ min: 1, max: 100 })
      .withMessage('Priority must be between 1 and 100')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const role = await roleService.createRole(req.body, req.user._id);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });
    } catch (error) {
      logger.error('Error creating role', {
        error: error.message,
        userId: req.user._id
      });

      res.status(400).json({
        success: false,
        code: 'ROLE_CREATION_FAILED',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/admin/roles
 * @desc    Get all roles
 * @access  Admin, Super Admin
 */
router.get(
  '/',
  authenticate,
  requirePermission('roles.view'),
  [
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('isSystemRole').optional().isBoolean().withMessage('isSystemRole must be a boolean')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const filters = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        isSystemRole: req.query.isSystemRole !== undefined ? req.query.isSystemRole === 'true' : undefined
      };

      const roles = await roleService.getRoles(filters);

      res.json({
        success: true,
        count: roles.length,
        data: roles
      });
    } catch (error) {
      logger.error('Error fetching roles', {
        error: error.message,
        userId: req.user._id
      });

      res.status(500).json({
        success: false,
        code: 'FETCH_ROLES_FAILED',
        message: 'Failed to fetch roles'
      });
    }
  }
);

/**
 * @route   GET /api/admin/roles/:id
 * @desc    Get role by ID
 * @access  Admin, Super Admin
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('roles.view'),
  [
    param('id').isMongoId().withMessage('Invalid role ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const role = await roleService.getRoleById(req.params.id);

      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      logger.error('Error fetching role', {
        error: error.message,
        roleId: req.params.id,
        userId: req.user._id
      });

      res.status(404).json({
        success: false,
        code: 'ROLE_NOT_FOUND',
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/admin/roles/:id
 * @desc    Update role
 * @access  Super Admin only
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('roles.update'),
  [
    param('id').isMongoId().withMessage('Invalid role ID'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Display name must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('permissions')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Permissions must be a non-empty array'),
    body('priority')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Priority must be between 1 and 100'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const role = await roleService.updateRole(req.params.id, req.body, req.user._id);

      // Invalidate permission caches for users with this role
      permissionService.invalidateAllCaches();

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role
      });
    } catch (error) {
      logger.error('Error updating role', {
        error: error.message,
        roleId: req.params.id,
        userId: req.user._id
      });

      res.status(400).json({
        success: false,
        code: 'ROLE_UPDATE_FAILED',
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/roles/:id
 * @desc    Delete role
 * @access  Super Admin only
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('roles.delete'),
  [
    param('id').isMongoId().withMessage('Invalid role ID')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const result = await roleService.deleteRole(req.params.id, req.user._id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Error deleting role', {
        error: error.message,
        roleId: req.params.id,
        userId: req.user._id
      });

      res.status(400).json({
        success: false,
        code: 'ROLE_DELETION_FAILED',
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/admin/users/:userId/role
 * @desc    Assign role to user
 * @access  Admin, Super Admin
 */
router.post(
  '/users/:userId/assign',
  authenticate,
  requirePermission('users.assign_role'),
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('roleName')
      .trim()
      .notEmpty()
      .withMessage('Role name is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { roleName, reason } = req.body;

      const user = await roleService.assignRoleToUser(
        req.params.userId,
        roleName,
        req.user._id,
        reason
      );

      // Invalidate permission cache for this user
      permissionService.invalidateUserCache(req.params.userId);

      res.json({
        success: true,
        message: 'Role assigned successfully',
        data: {
          userId: user._id,
          role: user.role,
          permissions: user.permissions
        }
      });
    } catch (error) {
      logger.error('Error assigning role', {
        error: error.message,
        userId: req.params.userId,
        performedBy: req.user._id
      });

      res.status(400).json({
        success: false,
        code: 'ROLE_ASSIGNMENT_FAILED',
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/admin/roles/:roleName/users
 * @desc    Get users by role
 * @access  Admin, Super Admin
 */
router.get(
  '/:roleName/users',
  authenticate,
  requirePermission('users.view'),
  [
    param('roleName').trim().notEmpty().withMessage('Role name is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await roleService.getUsersByRole(req.params.roleName, options);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error fetching users by role', {
        error: error.message,
        roleName: req.params.roleName,
        userId: req.user._id
      });

      res.status(500).json({
        success: false,
        code: 'FETCH_USERS_FAILED',
        message: 'Failed to fetch users'
      });
    }
  }
);

/**
 * @route   GET /api/admin/audit/roles
 * @desc    Get role audit logs
 * @access  Admin, Super Admin
 */
router.get(
  '/audit/logs',
  authenticate,
  requirePermission('audit.view'),
  [
    query('action').optional().trim(),
    query('roleId').optional().isMongoId().withMessage('Invalid role ID'),
    query('performedBy').optional().isMongoId().withMessage('Invalid user ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const filters = {
        action: req.query.action,
        targetRole: req.query.roleId,
        performedBy: req.query.performedBy,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100
      };

      const logs = await auditService.getAuditLogs(filters);

      res.json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      logger.error('Error fetching audit logs', {
        error: error.message,
        userId: req.user._id
      });

      res.status(500).json({
        success: false,
        code: 'FETCH_AUDIT_LOGS_FAILED',
        message: 'Failed to fetch audit logs'
      });
    }
  }
);

/**
 * @route   GET /api/admin/audit/export
 * @desc    Export audit logs to CSV
 * @access  Admin, Super Admin
 */
router.get(
  '/audit/export',
  authenticate,
  requirePermission('audit.export'),
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const csvData = await auditService.exportAuditLogsToCSV(filters);

      // Convert array to CSV string
      const csvString = csvData.map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(csvString);
    } catch (error) {
      logger.error('Error exporting audit logs', {
        error: error.message,
        userId: req.user._id
      });

      res.status(500).json({
        success: false,
        code: 'EXPORT_AUDIT_LOGS_FAILED',
        message: 'Failed to export audit logs'
      });
    }
  }
);

/**
 * @route   GET /api/admin/audit/stats
 * @desc    Get audit statistics
 * @access  Admin, Super Admin
 */
router.get(
  '/audit/stats',
  authenticate,
  requirePermission('audit.view'),
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const stats = await auditService.getAuditStats(
        req.query.startDate,
        req.query.endDate
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching audit stats', {
        error: error.message,
        userId: req.user._id
      });

      res.status(500).json({
        success: false,
        code: 'FETCH_AUDIT_STATS_FAILED',
        message: 'Failed to fetch audit statistics'
      });
    }
  }
);

export default router;
