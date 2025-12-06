import Role from '../models/Role.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { validatePermissions } from '../config/permissions.js';
import logger from '../utils/logger.js';

/**
 * Role Service
 * Handles all role-related business logic
 */

class RoleService {
  /**
   * Create a new role
   */
  async createRole(roleData, performedBy) {
    try {
      const { name, displayName, description, permissions, priority, isActive = true } = roleData;

      // Validate required fields
      if (!name || !displayName || !description || !permissions || !priority) {
        throw new Error('Missing required fields: name, displayName, description, permissions, priority');
      }

      // Check if role already exists
      const existingRole = await Role.findOne({ name: name.toLowerCase() });
      if (existingRole) {
        throw new Error(`Role with name '${name}' already exists`);
      }

      // Validate permissions
      const validation = validatePermissions(permissions);
      if (!validation.valid) {
        throw new Error(`Invalid permissions: ${validation.invalidPermissions.join(', ')}`);
      }

      // Create role
      const role = await Role.create({
        name: name.toLowerCase(),
        displayName,
        description,
        permissions,
        priority,
        isActive,
        isSystemRole: false,
        createdBy: performedBy,
        updatedBy: performedBy
      });

      // Log role creation
      await AuditLog.logRoleCreation(role._id, performedBy, {
        reason: 'Role created via API'
      });

      logger.info('Role created successfully', {
        roleId: role._id,
        roleName: role.name,
        performedBy
      });

      return role;
    } catch (error) {
      logger.error('Error creating role', {
        error: error.message,
        roleData,
        performedBy
      });
      throw error;
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId, updateData, performedBy) {
    try {
      const role = await Role.findById(roleId);

      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent modification of system roles (except isActive)
      if (role.isSystemRole) {
        const allowedFields = ['isActive'];
        const attemptedFields = Object.keys(updateData);
        const disallowedFields = attemptedFields.filter(f => !allowedFields.includes(f));

        if (disallowedFields.length > 0) {
          throw new Error(`Cannot modify system role. Only 'isActive' can be updated for system roles.`);
        }
      }

      // Store old values for audit log
      const oldValues = {
        displayName: role.displayName,
        description: role.description,
        permissions: [...role.permissions],
        priority: role.priority,
        isActive: role.isActive
      };

      // Validate permissions if being updated
      if (updateData.permissions) {
        const validation = validatePermissions(updateData.permissions);
        if (!validation.valid) {
          throw new Error(`Invalid permissions: ${validation.invalidPermissions.join(', ')}`);
        }
        role.permissions = updateData.permissions;
      }

      // Update allowed fields
      if (updateData.displayName !== undefined) role.displayName = updateData.displayName;
      if (updateData.description !== undefined) role.description = updateData.description;
      if (updateData.priority !== undefined) role.priority = updateData.priority;
      if (updateData.isActive !== undefined) role.isActive = updateData.isActive;

      role.updatedBy = performedBy;
      await role.save();

      // Log role update
      await AuditLog.logRoleUpdate(role._id, performedBy, {
        before: oldValues,
        after: {
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
          priority: role.priority,
          isActive: role.isActive
        }
      }, {
        reason: updateData.reason || 'Role updated via API'
      });

      // Update permissions for all users with this role
      if (updateData.permissions) {
        await this.updateUserPermissionsForRole(role.name, role.permissions);
      }

      logger.info('Role updated successfully', {
        roleId: role._id,
        roleName: role.name,
        performedBy
      });

      return role;
    } catch (error) {
      logger.error('Error updating role', {
        error: error.message,
        roleId,
        performedBy
      });
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId, performedBy) {
    try {
      const role = await Role.findById(roleId);

      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent deletion of system roles
      if (role.isSystemRole) {
        throw new Error('System roles cannot be deleted');
      }

      // Check if any users have this role
      const userCount = await User.countDocuments({ role: role.name });
      if (userCount > 0) {
        throw new Error(`Cannot delete role. ${userCount} user(s) are assigned to this role.`);
      }

      // Log role deletion before deleting
      await AuditLog.logRoleDeletion(role._id, performedBy, {
        reason: 'Role deleted via API',
        roleName: role.name
      });

      await role.deleteOne();

      logger.info('Role deleted successfully', {
        roleId: role._id,
        roleName: role.name,
        performedBy
      });

      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      logger.error('Error deleting role', {
        error: error.message,
        roleId,
        performedBy
      });
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getRoles(filters = {}) {
    try {
      const query = {};

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.isSystemRole !== undefined) {
        query.isSystemRole = filters.isSystemRole;
      }

      const roles = await Role.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ priority: -1 });

      // Add user count for each role
      const rolesWithCount = await Promise.all(
        roles.map(async (role) => {
          const userCount = await User.countDocuments({ role: role.name });
          const roleObj = role.toObject();
          roleObj.metadata.userCount = userCount;
          return roleObj;
        })
      );

      return rolesWithCount;
    } catch (error) {
      logger.error('Error fetching roles', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId) {
    try {
      const role = await Role.findById(roleId)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!role) {
        throw new Error('Role not found');
      }

      // Add user count
      const userCount = await User.countDocuments({ role: role.name });
      const roleObj = role.toObject();
      roleObj.metadata.userCount = userCount;

      return roleObj;
    } catch (error) {
      logger.error('Error fetching role by ID', {
        error: error.message,
        roleId
      });
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(roleName) {
    try {
      const role = await Role.findOne({ name: roleName.toLowerCase() })
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      return role;
    } catch (error) {
      logger.error('Error fetching role by name', {
        error: error.message,
        roleName
      });
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId, roleName, performedBy, reason = '') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const role = await Role.findOne({ name: roleName.toLowerCase() });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      if (!role.isActive) {
        throw new Error(`Role '${roleName}' is not active`);
      }

      // Store old role for audit
      const oldRole = user.role;
      const oldPermissions = [...user.permissions];

      // Update user role and permissions
      user.role = role.name;
      user.permissions = role.permissions;

      // Add to role history
      user.roleHistory.push({
        role: role.name,
        assignedBy: performedBy,
        assignedAt: new Date(),
        reason
      });

      await user.save();

      // Update role metadata
      role.metadata.lastAssigned = new Date();
      await role.save();

      // Log role assignment
      await AuditLog.logRoleAssignment(userId, role._id, performedBy, {
        before: { role: oldRole, permissions: oldPermissions },
        after: { role: role.name, permissions: role.permissions }
      }, {
        reason: reason || 'Role assigned via API'
      });

      logger.info('Role assigned to user successfully', {
        userId,
        oldRole,
        newRole: role.name,
        performedBy
      });

      return user;
    } catch (error) {
      logger.error('Error assigning role to user', {
        error: error.message,
        userId,
        roleName,
        performedBy
      });
      throw error;
    }
  }

  /**
   * Update permissions for all users with a specific role
   */
  async updateUserPermissionsForRole(roleName, permissions) {
    try {
      const result = await User.updateMany(
        { role: roleName },
        { $set: { permissions } }
      );

      logger.info('Updated permissions for users with role', {
        roleName,
        usersUpdated: result.modifiedCount
      });

      return result;
    } catch (error) {
      logger.error('Error updating user permissions for role', {
        error: error.message,
        roleName
      });
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleName, options = {}) {
    try {
      const { page = 1, limit = 20, select = 'firstName lastName email isActive' } = options;

      const users = await User.find({ role: roleName.toLowerCase() })
        .select(select)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments({ role: roleName.toLowerCase() });

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching users by role', {
        error: error.message,
        roleName
      });
      throw error;
    }
  }
}

export default new RoleService();
