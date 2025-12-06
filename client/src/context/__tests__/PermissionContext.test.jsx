/**
 * Frontend Tests for Permission Hooks
 * Tests: Task 35 - Permission hooks and context tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { PermissionProvider, usePermissions } from '../PermissionContext';
import { AuthContext } from '../AuthContext';
import api from '../../api/config';

// Mock API
vi.mock('../../api/config', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('PermissionContext and usePermissions Hook', () => {
  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    role: 'admin',
    firstName: 'Test',
    lastName: 'User'
  };

  const createWrapper = (authValue) => {
    return ({ children }) => (
      <AuthContext.Provider value={authValue}>
        <PermissionProvider>{children}</PermissionProvider>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePermissions Hook', () => {
    test('should throw error when used outside PermissionProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePermissions());
      }).toThrow('usePermissions must be used within a PermissionProvider');

      consoleSpy.mockRestore();
    });

    test('should load permissions on mount', async () => {
      const mockPermissions = ['products.read', 'products.write', 'orders.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            permissions: mockPermissions
          }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      // Initially loading
      expect(result.current.loading).toBe(true);

      // Wait for permissions to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);
      expect(result.current.error).toBeNull();
      expect(api.get).toHaveBeenCalledWith('/api/auth/permissions');
    });

    test('should return empty permissions when not authenticated', async () => {
      const authValue = {
        user: null,
        isAuthenticated: false
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(api.get).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      api.get.mockRejectedValue(mockError);

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe('API Error');

      consoleSpy.mockRestore();
    });
  });

  describe('hasPermission Function', () => {
    test('should return true for exact permission match', async () => {
      const mockPermissions = ['products.read', 'products.write'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('products.read')).toBe(true);
      expect(result.current.hasPermission('products.write')).toBe(true);
    });

    test('should return false for missing permission', async () => {
      const mockPermissions = ['products.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('products.delete')).toBe(false);
      expect(result.current.hasPermission('orders.read')).toBe(false);
    });

    test('should return true for wildcard permission', async () => {
      const mockPermissions = ['*'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('products.read')).toBe(true);
      expect(result.current.hasPermission('orders.delete')).toBe(true);
      expect(result.current.hasPermission('users.create')).toBe(true);
    });

    test('should match resource wildcard patterns', async () => {
      const mockPermissions = ['products.*'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('products.read')).toBe(true);
      expect(result.current.hasPermission('products.write')).toBe(true);
      expect(result.current.hasPermission('products.delete')).toBe(true);
      expect(result.current.hasPermission('orders.read')).toBe(false);
    });

    test('should return false when not authenticated', async () => {
      const authValue = {
        user: null,
        isAuthenticated: false
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('products.read')).toBe(false);
    });

    test('should return false for null or undefined permission', async () => {
      const mockPermissions = ['products.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(null)).toBe(false);
      expect(result.current.hasPermission(undefined)).toBe(false);
      expect(result.current.hasPermission('')).toBe(false);
    });
  });

  describe('hasAllPermissions Function', () => {
    test('should return true when user has all required permissions', async () => {
      const mockPermissions = ['products.read', 'products.write', 'orders.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions(['products.read', 'products.write'])).toBe(true);
      expect(result.current.hasAllPermissions(['products.read', 'orders.read'])).toBe(true);
    });

    test('should return false when user missing one permission', async () => {
      const mockPermissions = ['products.read', 'products.write'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions(['products.read', 'orders.read'])).toBe(false);
      expect(result.current.hasAllPermissions(['products.read', 'products.delete'])).toBe(false);
    });

    test('should return true for empty permissions array', async () => {
      const mockPermissions = ['products.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions([])).toBe(true);
    });

    test('should return false for non-array input', async () => {
      const mockPermissions = ['products.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions('products.read')).toBe(false);
      expect(result.current.hasAllPermissions(null)).toBe(false);
    });
  });

  describe('hasAnyPermission Function', () => {
    test('should return true when user has any of the required permissions', async () => {
      const mockPermissions = ['products.read', 'products.write'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission(['products.read', 'orders.read'])).toBe(true);
      expect(result.current.hasAnyPermission(['products.write', 'orders.write'])).toBe(true);
    });

    test('should return false when user has none of the required permissions', async () => {
      const mockPermissions = ['products.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission(['orders.read', 'users.read'])).toBe(false);
      expect(result.current.hasAnyPermission(['products.delete', 'orders.delete'])).toBe(false);
    });

    test('should return true for empty permissions array', async () => {
      const mockPermissions = ['products.read'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission([])).toBe(true);
    });
  });

  describe('getPermissionsByResource Function', () => {
    test('should group permissions by resource', async () => {
      const mockPermissions = ['products.read', 'products.write', 'orders.read', 'users.create'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const grouped = result.current.getPermissionsByResource();

      expect(grouped).toEqual({
        products: ['read', 'write'],
        orders: ['read'],
        users: ['create']
      });
    });

    test('should handle wildcard permission', async () => {
      const mockPermissions = ['*'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const grouped = result.current.getPermissionsByResource();

      expect(grouped).toEqual({
        all: ['*']
      });
    });

    test('should return empty object for no permissions', async () => {
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: [] }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const grouped = result.current.getPermissionsByResource();

      expect(grouped).toEqual({});
    });
  });

  describe('refreshPermissions Function', () => {
    test('should reload permissions when called', async () => {
      const initialPermissions = ['products.read'];
      const updatedPermissions = ['products.read', 'products.write', 'orders.read'];
      
      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { permissions: initialPermissions }
        }
      });

      const authValue = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual(initialPermissions);

      // Mock updated permissions
      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { permissions: updatedPermissions }
        }
      });

      // Refresh permissions
      await act(async () => {
        await result.current.refreshPermissions();
      });

      await waitFor(() => {
        expect(result.current.permissions).toEqual(updatedPermissions);
      });

      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Permission Context Updates', () => {
    test('should reload permissions when user changes', async () => {
      const mockPermissions1 = ['products.read'];
      const mockPermissions2 = ['orders.read', 'orders.write'];
      
      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { permissions: mockPermissions1 }
        }
      });

      const authValue1 = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result, rerender } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue1)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions1);

      // Change user
      const newUser = { ...mockUser, _id: 'user456' };
      const authValue2 = {
        user: newUser,
        isAuthenticated: true
      };

      api.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: { permissions: mockPermissions2 }
        }
      });

      rerender({ wrapper: createWrapper(authValue2) });

      await waitFor(() => {
        expect(result.current.permissions).toEqual(mockPermissions2);
      });
    });

    test('should clear permissions when user logs out', async () => {
      const mockPermissions = ['products.read', 'products.write'];
      
      api.get.mockResolvedValue({
        data: {
          success: true,
          data: { permissions: mockPermissions }
        }
      });

      const authValue1 = {
        user: mockUser,
        isAuthenticated: true
      };

      const { result, rerender } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(authValue1)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);

      // User logs out
      const authValue2 = {
        user: null,
        isAuthenticated: false
      };

      rerender({ wrapper: createWrapper(authValue2) });

      await waitFor(() => {
        expect(result.current.permissions).toEqual([]);
      });
    });
  });
});
