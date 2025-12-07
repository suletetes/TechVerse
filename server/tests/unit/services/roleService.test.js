/**
 * Unit Tests for Role Service
 * Tests: Task 31 - Role Service unit tests
 */

import roleService from '../../../src/services/roleService.js';
import Role from '../../../src/models/Role.js';
import User from '../../../src/models/User.js';
import AuditLog from '../../../src/models/AuditLog.js';
import { validatePermissions } from '../../../src/config/permissions.js';

// Mock dependencies
jest.mock('../../../src/models/Role.js');
jest.mock('../../../src/models/User.js');
jest.mock('../../../src/models/AuditLog.js');
jest.mock('../../../src/config/permissions.js');
jest.mock('../../../src/utils/logger.js');

describe('RoleService', () => {
  let mockPerformedBy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformedBy = 'user123';
  });

  describe('createRole', () => {
    const validRoleData = {
      name: 'test_role',
      displayName: 'Test Role',
      description: 'A test role',
      permissions: ['products.read', 'products.write'],
      priority: 5
    };

    test('should create role with valid data', async () => {
      // Mock implementations
      Role.findOne.mockResolvedValue(null);
      validatePermissions.mockReturnValue({ valid: true, invalidPermissions: [] });
      
      const mockRole = {
        _id: 'role123',
        ...validRoleData,
        name: validRoleData.name.toLowerCase(),
        isSystemRole: false,
        isActive: true
      };
      
      Role.create.mockResolvedValue(mockRole);
      AuditLog.logRoleCreation = jest.fn().mockResolvedValue({});

      // Execute
      const result = await roleService.createRole(validRoleData, mockPerformedBy);

      // Assert
      expect(Role.findOne).toHaveBeenCalledWith({ name: 'test_role' });
      expect(validatePermissions).toHaveBeenCalledWith(validRoleData.permissions);
      expect(Role.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test_role',
        displayName: validRoleData.displayName,
        permissions: validRoleData.permissions,
        isSystemRole: false
      }));
      expect(AuditLog.logRoleCreation).toHaveBeenCalled();
      expect(result).toEqual(mockRole);
    });

    test('should throw error if required fields are missing', async () => {
      const invalidData = { name: 'test' };

      await expect(
        roleService.createRole(invalidData, mockPerformedBy)
      ).rejects.toThrow('Missing required fields');
    });

    test('should throw error if role already exists', async () => {
      Role.findOne.mockResolvedValue({ name: 'test_role' });

      await expect(
        roleService.createRole(validRoleData, mockPerformedBy)
      ).rejects.toThrow('Role with name \'test_role\' already exists');
    });

    test('should throw error if permissions are invalid', async () => {
      Role.findOne.mockResolvedValue(null);
      validatePermissions.mockReturnValue({
        valid: false,
        invalidPermissions: ['invalid.permission']
      });

      await expect(
        roleService.createRole(validRoleData, mockPerformedBy)
      ).rejects.toThrow('Invalid permissions');
    });
  });

  describe('updateRole', () => {
    const roleId = 'role123';
    const mockRole = {
      _id: roleId,
      name: 'test_role',
      displayName: 'Test Role',
      description: 'Test description',
      permissions: ['products.read'],
      priority: 5,
      isActive: true,
      isSystemRole: false,
      save: jest.fn()
    };

    test('should update role with valid data', async () => {
      Role.findById.mockResolvedValue(mockRole);
      validatePermissions.mockReturnValue({ valid: true, invalidPermissions: [] });
      User.updateMany.mockResolvedValue({ modifiedCount: 5 });
      AuditLog.logRoleUpdate = jest.fn().mockResolvedValue({});
      mockRole.save.mockResolvedValue(mockRole);

      const updateData = {
        displayName: 'Updated Role',
        permissions: ['products.read', 'products.write']
      };

      const result = await roleService.updateRole(roleId, updateData, mockPerformedBy);

      expect(Role.findById).toHaveBeenCalledWith(roleId);
      expect(validatePermissions).toHaveBeenCalledWith(updateData.permissions);
      expect(mockRole.save).toHaveBeenCalled();
      expect(AuditLog.logRoleUpdate).toHaveBeenCalled();
    });

    test('should throw error if role not found', async () => {
      Role.findById.mockResolvedValue(null);

      await expect(
        roleService.updateRole(roleId, {}, mockPerformedBy)
      ).rejects.toThrow('Role not found');
    });

    test('should prevent modification of system roles except isActive', async () => {
      const systemRole = { ...mockRole, isSystemRole: true };
      Role.findById.mockResolvedValue(systemRole);

      const updateData = { displayName: 'New Name', permissions: [] };

      await expect(
        roleService.updateRole(roleId, updateData, mockPerformedBy)
      ).rejects.toThrow('Cannot modify system role');
    });

    test('should allow updating isActive for system roles', async () => {
      const systemRole = { ...mockRole, isSystemRole: true, save: jest.fn() };
      Role.findById.mockResolvedValue(systemRole);
      AuditLog.logRoleUpdate = jest.fn().mockResolvedValue({});
      systemRole.save.mockResolvedValue(systemRole);

      const updateData = { isActive: false };

      await roleService.updateRole(roleId, updateData, mockPerformedBy);

      expect(systemRole.save).toHaveBeenCalled();
      expect(systemRole.isActive).toBe(false);
    });
  });

  describe('deleteRole', () => {
    const roleId = 'role123';
    const mockRole = {
      _id: roleId,
      name: 'test_role',
      isSystemRole: false,
      deleteOne: jest.fn()
    };

    test('should delete role successfully', async () => {
      Role.findById.mockResolvedValue(mockRole);
      User.countDocuments.mockResolvedValue(0);
      AuditLog.logRoleDeletion = jest.fn().mockResolvedValue({});
      mockRole.deleteOne.mockResolvedValue({});

      const result = await roleService.deleteRole(roleId, mockPerformedBy);

      expect(Role.findById).toHaveBeenCalledWith(roleId);
      expect(User.countDocuments).toHaveBeenCalledWith({ role: mockRole.name });
      expect(mockRole.deleteOne).toHaveBeenCalled();
      expect(AuditLog.logRoleDeletion).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('should throw error if role not found', async () => {
      Role.findById.mockResolvedValue(null);

      await expect(
        roleService.deleteRole(roleId, mockPerformedBy)
      ).rejects.toThrow('Role not found');
    });

    test('should prevent deletion of system roles', async () => {
      const systemRole = { ...mockRole, isSystemRole: true };
      Role.findById.mockResolvedValue(systemRole);

      await expect(
        roleService.deleteRole(roleId, mockPerformedBy)
      ).rejects.toThrow('System roles cannot be deleted');
    });

    test('should prevent deletion if users are assigned', async () => {
      Role.findById.mockResolvedValue(mockRole);
      User.countDocuments.mockResolvedValue(5);

      await expect(
        roleService.deleteRole(roleId, mockPerformedBy)
      ).rejects.toThrow('Cannot delete role. 5 user(s) are assigned to this role');
    });
  });

  describe('assignRoleToUser', () => {
    const userId = 'user123';
    const roleName = 'test_role';
    
    const mockUser = {
      _id: userId,
      role: 'user',
      permissions: [],
      roleHistory: [],
      save: jest.fn()
    };

    const mockRole = {
      _id: 'role123',
      name: roleName,
      permissions: ['products.read', 'products.write'],
      isActive: true,
      metadata: {},
      save: jest.fn()
    };

    test('should assign role to user successfully', async () => {
      User.findById.mockResolvedValue(mockUser);
      Role.findOne.mockResolvedValue(mockRole);
      AuditLog.logRoleAssignment = jest.fn().mockResolvedValue({});
      mockUser.save.mockResolvedValue(mockUser);
      mockRole.save.mockResolvedValue(mockRole);

      const result = await roleService.assignRoleToUser(
        userId,
        roleName,
        mockPerformedBy,
        'Test assignment'
      );

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(Role.findOne).toHaveBeenCalledWith({ name: roleName.toLowerCase() });
      expect(mockUser.role).toBe(roleName);
      expect(mockUser.permissions).toEqual(mockRole.permissions);
      expect(mockUser.roleHistory.length).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
      expect(AuditLog.logRoleAssignment).toHaveBeenCalled();
    });

    test('should throw error if user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        roleService.assignRoleToUser(userId, roleName, mockPerformedBy)
      ).rejects.toThrow('User not found');
    });

    test('should throw error if role not found', async () => {
      User.findById.mockResolvedValue(mockUser);
      Role.findOne.mockResolvedValue(null);

      await expect(
        roleService.assignRoleToUser(userId, roleName, mockPerformedBy)
      ).rejects.toThrow(`Role '${roleName}' not found`);
    });

    test('should throw error if role is not active', async () => {
      User.findById.mockResolvedValue(mockUser);
      Role.findOne.mockResolvedValue({ ...mockRole, isActive: false });

      await expect(
        roleService.assignRoleToUser(userId, roleName, mockPerformedBy)
      ).rejects.toThrow(`Role '${roleName}' is not active`);
    });
  });

  describe('getRoles', () => {
    test('should return all roles with user counts', async () => {
      const mockRoles = [
        {
          _id: 'role1',
          name: 'admin',
          priority: 10,
          toObject: () => ({ _id: 'role1', name: 'admin', metadata: {} })
        },
        {
          _id: 'role2',
          name: 'user',
          priority: 1,
          toObject: () => ({ _id: 'role2', name: 'user', metadata: {} })
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockRoles)
      };

      Role.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValueOnce(5).mockResolvedValueOnce(100);

      const result = await roleService.getRoles();

      expect(Role.find).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].metadata.userCount).toBe(5);
      expect(result[1].metadata.userCount).toBe(100);
    });

    test('should filter roles by isActive', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      Role.find.mockReturnValue(mockQuery);

      await roleService.getRoles({ isActive: true });

      expect(Role.find).toHaveBeenCalledWith({ isActive: true });
    });
  });
});
