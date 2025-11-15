/**
 * Role Management Routes
 */

import express from 'express';
import {
  getAllRoles,
  getRoleDetails,
  assignRole,
  getUsersByRole,
  getRoleStats,
  bulkAssignRoles
} from '../controllers/roleController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all roles (Admin+)
router.get('/', requireAdmin, getAllRoles);

// Get role statistics (Admin+)
router.get('/stats', requireAdmin, getRoleStats);

// Get role details (Admin+)
router.get('/:role', requireAdmin, getRoleDetails);

// Get users by role (Admin+)
router.get('/:role/users', requireAdmin, getUsersByRole);

// Assign role to user (Super Admin only)
router.patch('/users/:userId/role', requireSuperAdmin, assignRole);

// Bulk assign roles (Super Admin only)
router.post('/bulk-assign', requireSuperAdmin, bulkAssignRoles);

export default router;
