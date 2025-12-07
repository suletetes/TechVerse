import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/config';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user permissions
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/auth/permissions');
      
      if (response.data.success) {
        setPermissions(response.data.data.permissions || []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setError(err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load permissions when user changes
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!isAuthenticated || !user) return false;
    if (!permission) return false;

    // Super admin has all permissions
    if (permissions.includes('*')) return true;

    // Check for exact permission match
    if (permissions.includes(permission)) return true;

    // Check for pattern matches (e.g., 'products.*')
    const [resource] = permission.split('.');
    if (permissions.includes(`${resource}.*`)) return true;

    return false;
  }, [isAuthenticated, user, permissions]);

  // Check if user has all of multiple permissions
  const hasAllPermissions = useCallback((requiredPermissions) => {
    if (!Array.isArray(requiredPermissions)) return false;
    if (requiredPermissions.length === 0) return true;

    return requiredPermissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Check if user has any of multiple permissions
  const hasAnyPermission = useCallback((requiredPermissions) => {
    if (!Array.isArray(requiredPermissions)) return false;
    if (requiredPermissions.length === 0) return true;

    return requiredPermissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Get permissions grouped by resource
  const getPermissionsByResource = useCallback(() => {
    const grouped = {};

    permissions.forEach(permission => {
      if (permission === '*') {
        grouped['all'] = ['*'];
        return;
      }

      const [resource, action] = permission.split('.');
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(action);
    });

    return grouped;
  }, [permissions]);

  // Refresh permissions
  const refreshPermissions = useCallback(() => {
    return loadPermissions();
  }, [loadPermissions]);

  const value = {
    permissions,
    loading,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getPermissionsByResource,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Custom hook to use permission context
export const usePermissions = () => {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  
  return context;
};

export default PermissionContext;
