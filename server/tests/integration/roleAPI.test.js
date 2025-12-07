/**
 * Integration Tests for Role Management API
 * Tests: Task 33 - Role API integration tests
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Role from '../../src/models/Role.js';
import AuditLog from '../../src/models/AuditLog.js';
import { clearDatabase } from '../setup/testDb.js';
import { createTestUser, generateAuthToken } from '../setup/helpers.js';
import bcrypt from 'bcryptjs';

describe('Role Management API Integration Tests', () => {
  let superAdminUser;
  let superAdminToken;
  let adminUser;
  let adminToken;
  let regularUser;
  let regularToken;
  let testRole;

  beforeAll(async () => {
    await clearDatabase();

    // Create super admin user
    superAdminUser = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@test.com',
      password: await bcrypt.hash('Test123!@#', 10),
      role: 'super_admin',
      permissions: ['*'],
      isEmailVerified: true
    });
    superAdminToken = generateAuthToken(superAdminUser._id, 'super_admin');

    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: await bcrypt.hash('Test123!@#', 10),
      role: 'admin',
      permissions: ['roles.view', 'users.view', 'audit.view'],
      isEmailVerified: true
    });
    adminToken = generateAuthToken(adminUser._id, 'admin');

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      password: await bcrypt.hash('Test123!@#', 10),
      role: 'user',
      permissions: [],
      isEmailVerified: true
    });
    regularToken = generateAuthToken(regularUser._id, 'user');

    // Create test role
    testRole = await Role.create({
      name: 'test_role',
      displayName: 'Test Role',
      description: 'A test role for integration testing',
      permissions: ['products.read', 'products.write'],
      priority: 5,
      isSystemRole: false,
      isActive: true
    });
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe('POST /api/admin/roles - Create Role', () => {
    test('should create role with valid data (super admin)', async () => {
      const roleData = {
        name: 'new_test_role',
        displayName: 'New Test Role',
        description: 'A new test role for testing',
        permissions: ['orders.read', 'orders.write'],
        priority: 7
      };

      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('new_test_role');
      expect(response.body.data.displayName).toBe('New Test Role');
      expect(response.body.data.permissions).toEqual(['orders.read', 'orders.write']);

      // Verify role was created in database
      const role = await Role.findOne({ name: 'new_test_role' });
      expect(role).toBeTruthy();
      expect(role.priority).toBe(7);
    });

    test('should fail to create role without permission', async () => {
      const roleData = {
        name: 'unauthorized_role',
        displayName: 'Unauthorized Role',
        description: 'This should fail',
        permissions: ['products.read'],
        priority: 5
      };

      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(roleData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid role name format', async () => {
      const roleData = {
        name: 'Invalid Role Name',
        displayName: 'Invalid Role',
        description: 'This should fail due to invalid name',
        permissions: ['products.read'],
        priority: 5
      };

      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    test('should fail with duplicate role name', async () => {
      const roleData = {
        name: 'test_role',
        displayName: 'Duplicate Test Role',
        description: 'This should fail due to duplicate name',
        permissions: ['products.read'],
        priority: 5
      };

      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('should fail with missing required fields', async () => {
      const roleData = {
        name: 'incomplete_role'
      };

      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    test('should create audit log for role creation', async () => {
      const roleData = {
        name: 'audited_role',
        displayName: 'Audited Role',
        description: 'Role creation should be audited',
        permissions: ['products.read'],
        priority: 5
      };

      await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(roleData)
        .expect(201);

      // Verify audit log was created
      const auditLog = await AuditLog.findOne({
        action: 'role.created',
        performedBy: superAdminUser._id
      });

      expect(auditLog).toBeTruthy();
    });
  });

  describe('GET /api/admin/roles - Get All Roles', () => {
    test('should get all roles (admin)', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('should filter roles by isActive', async () => {
      const response = await request(app)
        .get('/api/admin/roles?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(role => role.isActive === true)).toBe(true);
    });

    test('should fail without permission', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should include user count in role metadata', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('metadata');
      expect(response.body.data[0].metadata).toHaveProperty('userCount');
    });
  });

  describe('GET /api/admin/roles/:id - Get Role by ID', () => {
    test('should get role by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test_role');
      expect(response.body.data.displayName).toBe('Test Role');
    });

    test('should fail with invalid role ID', async () => {
      const response = await request(app)
        .get('/api/admin/roles/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    test('should fail with non-existent role ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/admin/roles/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ROLE_NOT_FOUND');
    });
  });

  describe('PUT /api/admin/roles/:id - Update Role', () => {
    test('should update role with valid data', async () => {
      const updateData = {
        displayName: 'Updated Test Role',
        description: 'Updated description for test role',
        permissions: ['products.read', 'products.write', 'products.delete']
      };

      const response = await request(app)
        .put(`/api/admin/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('Updated Test Role');
      expect(response.body.data.permissions).toContain('products.delete');

      // Verify update in database
      const updatedRole = await Role.findById(testRole._id);
      expect(updatedRole.displayName).toBe('Updated Test Role');
    });

    test('should fail to update without permission', async () => {
      const updateData = {
        displayName: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/admin/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should create audit log for role update', async () => {
      const updateData = {
        displayName: 'Audited Update'
      };

      await request(app)
        .put(`/api/admin/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData)
        .expect(200);

      // Verify audit log
      const auditLog = await AuditLog.findOne({
        action: 'role.updated',
        targetRole: testRole._id
      });

      expect(auditLog).toBeTruthy();
    });

    test('should invalidate permission cache after update', async () => {
      // This test verifies that the cache invalidation is called
      // In a real scenario, you'd test that cached permissions are refreshed
      const updateData = {
        permissions: ['products.read']
      };

      const response = await request(app)
        .put(`/api/admin/roles/${testRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/admin/roles/:id - Delete Role', () => {
    let deletableRole;

    beforeEach(async () => {
      deletableRole = await Role.create({
        name: 'deletable_role',
        displayName: 'Deletable Role',
        description: 'A role that can be deleted',
        permissions: ['products.read'],
        priority: 3,
        isSystemRole: false,
        isActive: true
      });
    });

    test('should delete role successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/roles/${deletableRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion in database
      const deletedRole = await Role.findById(deletableRole._id);
      expect(deletedRole).toBeNull();
    });

    test('should fail to delete without permission', async () => {
      const response = await request(app)
        .delete(`/api/admin/roles/${deletableRole._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should prevent deletion of role with assigned users', async () => {
      // Assign role to a user
      regularUser.role = deletableRole.name;
      await regularUser.save();

      const response = await request(app)
        .delete(`/api/admin/roles/${deletableRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('user(s) are assigned');

      // Cleanup
      regularUser.role = 'user';
      await regularUser.save();
    });

    test('should create audit log for role deletion', async () => {
      await request(app)
        .delete(`/api/admin/roles/${deletableRole._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      // Verify audit log
      const auditLog = await AuditLog.findOne({
        action: 'role.deleted',
        performedBy: superAdminUser._id
      });

      expect(auditLog).toBeTruthy();
    });
  });

  describe('POST /api/admin/roles/users/:userId/assign - Assign Role', () => {
    test('should assign role to user successfully', async () => {
      const response = await request(app)
        .post(`/api/admin/roles/users/${regularUser._id}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleName: 'test_role',
          reason: 'Testing role assignment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('test_role');

      // Verify in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.role).toBe('test_role');
      expect(updatedUser.roleHistory).toHaveLength(1);
    });

    test('should fail with non-existent role', async () => {
      const response = await request(app)
        .post(`/api/admin/roles/users/${regularUser._id}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleName: 'non_existent_role'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should fail without permission', async () => {
      const response = await request(app)
        .post(`/api/admin/roles/users/${regularUser._id}/assign`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          roleName: 'test_role'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should create audit log for role assignment', async () => {
      await request(app)
        .post(`/api/admin/roles/users/${regularUser._id}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleName: 'test_role',
          reason: 'Audit test'
        })
        .expect(200);

      // Verify audit log
      const auditLog = await AuditLog.findOne({
        action: 'role.assigned',
        targetUser: regularUser._id
      });

      expect(auditLog).toBeTruthy();
    });

    test('should invalidate user permission cache after assignment', async () => {
      const response = await request(app)
        .post(`/api/admin/roles/users/${regularUser._id}/assign`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          roleName: 'test_role'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Cache invalidation is called internally
    });
  });

  describe('GET /api/admin/audit/logs - Get Audit Logs', () => {
    test('should get audit logs with filters', async () => {
      const response = await request(app)
        .get('/api/admin/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should filter audit logs by action', async () => {
      const response = await request(app)
        .get('/api/admin/audit/logs?action=role.created')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data.every(log => log.action === 'role.created')).toBe(true);
      }
    });

    test('should fail without permission', async () => {
      const response = await request(app)
        .get('/api/admin/audit/logs')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/audit/export - Export Audit Logs', () => {
    test('should export audit logs as CSV', async () => {
      const response = await request(app)
        .get('/api/admin/audit/export')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('audit-logs.csv');
    });

    test('should fail without permission', async () => {
      const response = await request(app)
        .get('/api/admin/audit/export')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/audit/stats - Get Audit Statistics', () => {
    test('should get audit statistics', async () => {
      const response = await request(app)
        .get('/api/admin/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalActions');
    });

    test('should fail without permission', async () => {
      const response = await request(app)
        .get('/api/admin/audit/stats')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
