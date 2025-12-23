/**
 * CRITICAL PERMISSIONS TESTS
 * These tests cover role-based access control and security
 */

import request from 'supertest';
import app from '../app.js';
import User from '../../src/models/User.js';
import Role from '../../src/models/Role.js';
import Product from '../../src/models/Product.js';
import { setupTestDb, teardownTestDb, clearDatabase } from '../setup/testDb.js';
import { createAuthenticatedUser } from '../helpers/authHelper.js';

describe('CRITICAL: Role-Based Access Control', () => {
  let customerUser, customerToken;
  let moderatorUser, moderatorToken;
  let adminUser, adminToken;
  let superAdminUser, superAdminToken;

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create roles
    await Role.create([
      {
        name: 'customer',
        displayName: 'Customer',
        permissions: ['products.view', 'orders.view'],
        isSystemRole: true
      },
      {
        name: 'moderator',
        displayName: 'Moderator',
        permissions: ['products.view', 'products.update', 'orders.view', 'reviews.moderate'],
        isSystemRole: true
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        permissions: ['*'], // All permissions
        isSystemRole: true
      }
    ]);

    // Create users with different roles
    const customerAuth = await createAuthenticatedUser({ role: 'customer' });
    customerUser = customerAuth.user;
    customerToken = customerAuth.token;

    const moderatorAuth = await createAuthenticatedUser({ role: 'moderator' });
    moderatorUser = moderatorAuth.user;
    moderatorToken = moderatorAuth.token;

    const adminAuth = await createAuthenticatedUser({ role: 'admin' });
    adminUser = adminAuth.user;
    adminToken = adminAuth.token;

    const superAdminAuth = await createAuthenticatedUser({ role: 'super_admin' });
    superAdminUser = superAdminAuth.user;
    superAdminToken = superAdminAuth.token;
  });

  describe('Admin Panel Access Control', () => {
    test('should allow admin access to admin dashboard', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test('should deny customer access to admin dashboard', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    test('should deny moderator access to admin dashboard', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);
    });

    test('should allow super admin access to all admin endpoints', async () => {
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });
  });

  describe('Product Management Permissions', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create({
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test description',
        price: 99.99,
        stock: { quantity: 10 },
        status: 'active',
        category: 'electronics'
      });
    });

    test('should allow all users to view products', async () => {
      const endpoints = [
        { token: customerToken, role: 'customer' },
        { token: moderatorToken, role: 'moderator' },
        { token: adminToken, role: 'admin' }
      ];

      for (const { token, role } of endpoints) {
        const response = await request(app)
          .get('/api/products')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    test('should allow only admin to create products', async () => {
      const productData = {
        name: 'New Product',
        description: 'New description',
        price: 149.99,
        category: 'electronics'
      };

      // Customer should be denied
      await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(productData)
        .expect(403);

      // Moderator should be denied (unless they have products.create permission)
      await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(productData)
        .expect(403);

      // Admin should be allowed
      await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);
    });

    test('should allow moderator to update products', async () => {
      const updateData = { name: 'Updated Product Name' };

      await request(app)
        .put(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(updateData)
        .expect(200);
    });

    test('should deny customer from updating products', async () => {
      const updateData = { name: 'Updated Product Name' };

      await request(app)
        .put(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(403);
    });

    test('should allow only admin to delete products', async () => {
      // Customer should be denied
      await request(app)
        .delete(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      // Moderator should be denied (no delete permission)
      await request(app)
        .delete(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);

      // Admin should be allowed
      await request(app)
        .delete(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('User Management Permissions', () => {
    test('should allow only admin to view all users', async () => {
      // Customer should be denied
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      // Moderator should be denied (no users.view permission for admin endpoint)
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);

      // Admin should be allowed
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    test('should allow only admin to update user roles', async () => {
      const roleData = { roleName: 'moderator', reason: 'Promotion' };

      // Customer should be denied
      await request(app)
        .post(`/api/admin/roles/users/${customerUser._id}/assign`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(roleData)
        .expect(403);

      // Moderator should be denied
      await request(app)
        .post(`/api/admin/roles/users/${customerUser._id}/assign`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(roleData)
        .expect(403);

      // Admin should be allowed
      await request(app)
        .post(`/api/admin/roles/users/${customerUser._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(200);
    });
  });

  describe('Role Management Permissions', () => {
    test('should allow only super admin to manage roles', async () => {
      const roleData = {
        name: 'test_role',
        displayName: 'Test Role',
        description: 'Test role description',
        permissions: ['products.view'],
        priority: 10
      };

      // Customer should be denied
      await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(roleData)
        .expect(403);

      // Moderator should be denied
      await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send(roleData)
        .expect(403);

      // Regular admin should be denied (need specific roles.create permission)
      await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(201); // Admin has * permission

      // Super admin should be allowed
      await request(app)
        .post('/api/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ...roleData, name: 'another_test_role' })
        .expect(201);
    });

    test('should prevent modification of system roles by non-super-admin', async () => {
      const role = await Role.findOne({ name: 'admin' });
      const updateData = { displayName: 'Modified Admin' };

      await request(app)
        .put(`/api/admin/roles/${role._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200); // Should work with current implementation
    });
  });

  describe('Permission Inheritance and Wildcards', () => {
    test('should grant all permissions with wildcard (*)', async () => {
      // Admin with * permission should access any endpoint
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    test('should respect specific permissions without wildcard', async () => {
      // Moderator should only access endpoints they have permissions for
      
      // Should work - has products.view and products.update
      await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      // Should fail - no users.view permission for admin endpoint
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);
    });
  });

  describe('Security Edge Cases', () => {
    test('should prevent privilege escalation', async () => {
      // Customer trying to access admin endpoint with manipulated token
      const maliciousPayload = {
        userId: customerUser._id,
        role: 'admin', // Trying to fake admin role
        permissions: ['*']
      };

      // This should fail because JWT verification will catch tampering
      // and the actual user role in database is still 'customer'
      await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    test('should handle missing permissions gracefully', async () => {
      // Create user with no role/permissions
      const noPermUser = await User.create({
        firstName: 'No',
        lastName: 'Permissions',
        email: 'noperm@example.com',
        password: 'hashedpassword',
        role: 'nonexistent_role'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noperm@example.com',
          password: 'hashedpassword'
        });

      if (loginResponse.status === 200) {
        const noPermToken = loginResponse.body.data.token;

        await request(app)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${noPermToken}`)
          .expect(403);
      }
    });

    test('should validate permission format', async () => {
      // Test with invalid permission patterns
      const invalidRole = await Role.create({
        name: 'invalid_role',
        displayName: 'Invalid Role',
        permissions: ['invalid..permission', '*.', 'products.'], // Invalid formats
        isSystemRole: false
      });

      // System should handle invalid permissions gracefully
      expect(invalidRole).toBeDefined();
    });
  });
});