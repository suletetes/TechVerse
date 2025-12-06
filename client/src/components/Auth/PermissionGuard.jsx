import React from 'react';
import { usePermissions } from '../../context/PermissionContext';

/**
 * PermissionGuard - Conditionally render children based on permissions
 * 
 * @param {string|string[]} permission - Single permission or array of permissions
 * @param {string} mode - 'all' (default) or 'any' for multiple permissions
 * @param {React.ReactNode} children - Content to render if permission check passes
 * @param {React.ReactNode} fallback - Content to render if permission check fails
 */
const PermissionGuard = ({ 
  permission, 
  mode = 'all', 
  children, 
  fallback = null 
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();

  // Show nothing while loading
  if (loading) {
    return fallback;
  }

  // Handle single permission
  if (typeof permission === 'string') {
    return hasPermission(permission) ? children : fallback;
  }

  // Handle multiple permissions
  if (Array.isArray(permission)) {
    const hasAccess = mode === 'any' 
      ? hasAnyPermission(permission)
      : hasAllPermissions(permission);

    return hasAccess ? children : fallback;
  }

  // Invalid permission prop
  return fallback;
};

export default PermissionGuard;
