import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';

describe('API Integration Tests', () => {
  describe('Authentication API', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@techverse.com',
          password: 'password'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('admin@techverse.com');
      expect(data.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });

    it('should register new user', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('newuser@test.com');
      expect(data.data.user.name).toBe('New User');
    });

    it('should prevent duplicate user registration', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@techverse.com', // Existing user
          password: 'password123',
          name: 'Duplicate User'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User already exists');
    });

    it('should refresh authentication token', async () => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'mock-refresh-token-admin'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();
    });
  });

  describe('Products API', () => {
    it('should fetch products with pagination', async () => {
      const response = await fetch('/api/products?page=1&limit=2');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(2);
      expect(data.data.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
    });

    it('should filter products by category', async () => {
      const response = await fetch('/api/products?category=Tablets');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.items[0].category).toBe('Tablets');
    });

    it('should search products by name', async () => {
      const response = await fetch('/api/products?search=Phone');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.items[0].name).toContain('Phone');
    });

    it('should fetch single product by ID', async () => {
      const response = await fetch('/api/products/1');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('1');
      expect(data.data.name).toBe('Tablet Air');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await fetch('/api/products/999');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product not found');
    });

    it('should create new product', async () => {
      const newProduct = {
        name: 'Test Product',
        category: 'Electronics',
        price: 599,
        stock: 10,
        status: 'Active',
        sku: 'TEST-001',
        description: 'Test product description'
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Test Product');
      expect(data.data.id).toBeDefined();
    });

    it('should update existing product', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 1299
      };

      const response = await fetch('/api/products/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Product Name');
      expect(data.data.price).toBe(1299);
    });

    it('should delete product', async () => {
      const response = await fetch('/api/products/1', {
        method: 'DELETE'
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product deleted successfully');
    });
  });

  describe('Orders API', () => {
    it('should fetch orders with pagination', async () => {
      const response = await fetch('/api/orders?page=1&limit=1');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.pagination.total).toBe(2);
    });

    it('should filter orders by status', async () => {
      const response = await fetch('/api/orders?status=Processing');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.items[0].status).toBe('Processing');
    });

    it('should fetch single order by ID', async () => {
      const response = await fetch('/api/orders/TV-2024-001234');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('TV-2024-001234');
      expect(data.data.customer).toBe('John Smith');
    });

    it('should update order status', async () => {
      const response = await fetch('/api/orders/TV-2024-001234/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Shipped' })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('Shipped');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors', async () => {
      const response = await fetch('/api/test/error');
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Simulated server error');
    });

    it('should handle 404 for unmatched routes', async () => {
      const response = await fetch('/api/nonexistent');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unhandled request');
    });
  });

  describe('Authentication Protected Endpoints', () => {
    it('should require authentication for protected routes', async () => {
      const response = await fetch('/api/users/profile');
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow access with valid token', async () => {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-admin'
        }
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('admin@techverse.com');
    });

    it('should reject invalid tokens', async () => {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid token');
    });
  });

  describe('Admin Endpoints', () => {
    it('should fetch admin statistics', async () => {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        totalProducts: expect.any(Number),
        totalOrders: expect.any(Number),
        totalUsers: expect.any(Number),
        revenue: expect.any(Number)
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        fetch('/api/products').then(res => res.json())
      );

      const responses = await Promise.all(requests);

      responses.forEach(data => {
        expect(data.success).toBe(true);
        expect(data.data.items).toBeDefined();
      });
    });

    it('should simulate network delays', async () => {
      const startTime = Date.now();
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@techverse.com',
          password: 'password'
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeGreaterThan(400); // Should have simulated delay
    });
  });
});