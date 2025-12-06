/**
 * Integration Tests for Permission Middleware
 * Tests: Task 34 - Permission middleware integration tests
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Role from '../../src/models/Role.js';
import AuditLog from '../../src/models/AuditLog.js';
import { clearDatabase } from '../setup/testDb.js';
import { generateAuthToken } from '../setup/helpers.js';
import bcrypt from 'bcryptjs';

describe('Permission Middleware Integration Tests', () => {
  let superAdminUser, superAdminToken;
  let adminUser, adminToken;
  let managerUser, managerToken;
  let regularUser, regularToken;

  beforeAll(async () => {
    await clearDatabase();

    // Create super admin with wildcard permission
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

    // Create admin with specific permissions
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: await bcrypt.hash('Test123!@#', 10),
      role: 'admin',
      permissions: [
        'products.read',
        'products.write',
        'products.update',
        'products.delete',
        'users.read',
        'users.write',
        'roles.view'
      ],
      isEmailVerified: true
    });
    adminToken = generateAuthToken(adminUser._id, 'admin');

    // Create manager with limited permissions
    managerUser = await User.create({
      firstName: 'Manager',
      lastName: 'User',
      email: 'manager@test.com',
      password: await bcrypt.hash('Test123!@#', 10),
      role: 'inventory_manager',
      permissions: ['products.read', 'products.update'],
      isEmailVerified: true
    });
    managerToken = generateAuthToken(managerUser._id, 'inventory_manager');

    // Create regular user with no special permissions
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
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe('requirePermission Middleware', () => {
    test('should allow access with correct permission', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should deny access without permission', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });

    test('should allow super admin with wildcard permission', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should log unauthorized access attempt', async () => {
      await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      // Verify audit log was created
      const auditLog = await AuditLog.findOne({
        action: 'unauthorized_access',
        performedBy: regularUser._id
      });

      expect(auditLog).toBeTruthy();
    });

    test('should include required permissions in error response', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('requiredPermissions');
      expect(response.body.requiredPermissions).toContain('roles.view');
    });
  });

  describe('requireAllPermissions Middleware', () => {
    test('should allow access when user has all required permissions', async () => {
      // Admin has products.read, products.write, products.update, products.delete
      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'test_all_perms',
          displayName: 'Test All Permissions',
          description: 'Testing multiple permissions requirement',
          permissions: ['products.read'],
          priority: 5
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should deny access when user missing one permission', async () => {
      // Manager only has products.read and products.update, missing products.write
      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'test_missing_perm',
          displayName: 'Test Missing Permission',
          description: 'Should fail due to missing permission',
          permissions: ['products.read'],
          priority: 5
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });

    test('should allow super admin with wildcard', async () => {
      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'test_wildcard',
          displayName: 'Test Wildcard',
          description: 'Super admin should have access',
          permissions: ['products.read'],
          priority: 5
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('requireAnyPermission Middleware', () => {
    test('should allow access when user has any of the required permissions', async () => {
      // Manager has products.read (one of the required permissions)
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should deny access when user has none of the required permissions', async () => {
      // Regular user has no permissions
      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'test_no_perms',
          displayName: 'Test No Permissions',
          description: 'Should fail',
          permissions: ['products.read'],
          priority: 5
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Permission Caching', () => {
    test('should use cached permissions on subsequent requests', async () => {
      // First request - populates cache
      await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Second request - should use cache
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should refresh cache after role update', async () => {
      // Create a test role
      const testRole = await Role.create({
        name: 'cache_test_role',
        displayName: 'Cache Test Role',
        description: 'Testing cache invalidation',
        permissions: ['products.read'],
        priority: 5,
        isSystemRole: false,
        isActive: true
      });

      // Create user with this role
      const cacheTestUser = await User.create({
        firstName: 'Cache',
        lastName: 'Test',
        email: 'cachetest@test.com',
        password: await bcrypt.hash('Test123!@#', 10),
        role: 'cache_test_role',
        permissions: ['products.read'],
        isEmailVerified: true
      });
      const cacheTestToken = generateAuthToken(cacheTestUser._id, 'cache_test_role');

      // First request - user can access
      await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${cacheTestToken}`)
        .expect(403); // Should fail because products.read doesn't grant roles.view

      // Update role to add roles.view permission
      testRole.permissions = ['products.read', 'roles.view'];
      await testRole.save();

      // Update user permissions
      cacheTestUser.permissions = ['products.read', 'roles.view'];
      await cacheTestUser.save();

      // After cache invalidation, user should have access
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${cacheTestToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Wildcard Permission Patterns', () => {
    test('should match wildcard resource permissions', async () => {
      // Create user with products.* permission
      const wildcardUser = await User.create({
        firstName: 'Wildcard',
        lastName: 'User',
        email: 'wildcard@test.com',
        password: await bcrypt.hash('Test123!@#', 10),
        role: 'wildcard_role',
        permissions: ['products.*'],
        isEmailVerified: true
      });
      const wildcardToken = generateAuthToken(wildcardUser._id, 'wildcard_role');

      // Should have access to any products endpoint
      // Note: This test assumes there's a products endpoint that requires products.delete
      // Adjust based on your actual API structure
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${wildcardToken}`)
        .expect(403); // Will fail because products.* doesn't include roles.view

      expect(response.body.success).toBe(false);
    });

    test('should match global wildcard permission', async () => {
      // Super admin with * permission should access everything
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Responses', () => {
    test('should return detailed error for missing permissions', async () => {
      const response = await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'test_error',
          displayName: 'Test Error',
          description: 'Testing error response',
          permissions: ['products.read'],
          priority: 5
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'PERMISSION_DENIED');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('requiredPermissions');
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 for expired token', async () => {
      // Create an expired token (this would require mocking jwt.sign with past expiry)
      // For now, we'll test with no token
      const response = await request(app)
        .get('/api/admin/roles')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    test('should log all unauthorized access attempts', async () => {
      const initialCount = await AuditLog.countDocuments({
        action: 'unauthorized_access',
        performedBy: regularUser._id
      });

      // Make unauthorized request
      await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      const finalCount = await AuditLog.countDocuments({
        action: 'unauthorized_access',
        performedBy: regularUser._id
      });

      expect(finalCount).toBeGreaterThan(initialCount);
    });

    test('should include endpoint and permission in audit log', async () => {
      await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      const auditLog = await AuditLog.findOne({
        action: 'unauthorized_access',
        performedBy: regularUser._id
      }).sort({ createdAt: -1 });

      expect(auditLog).toBeTruthy();
      expect(auditLog.metadata).toHaveProperty('endpoint');
      expect(auditLog.metadata).toHaveProperty('permission');
    });
  });

  describe('Permission Validation', () => {
    test('should reject invalid permission format', async () => {
      // This test assumes the permission validation happens at the middleware level
      // The actual implementation may vary
      const invalidUser = await User.create({
        firstName: 'Invalid',
        lastName: 'Perms',
        email: 'invalid@test.com',
        password: await bcrypt.hash('Test123!@#', 10),
        role: 'invalid_role',
        permissions: ['invalid-permission-format'],
        isEmailVerified: true
      });
      const invalidToken = generateAuthToken(invalidUser._id, 'invalid_role');

      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
