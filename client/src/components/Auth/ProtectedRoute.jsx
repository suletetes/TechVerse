import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';

/**
 * ProtectedRoute - Route wrapper that requires authentication and permissions
 * 
 * @param {React.ReactNode} children - Route content
 * @param {string|string[]} permission - Required permission(s)
 * @param {string} mode - 'all' (default) or 'any' for multiple permissions
 * @param {string} redirectTo - Path to redirect if access denied
 */
const ProtectedRoute = ({ 
  children, 
  permission, 
  mode = 'all',
  redirectTo = '/unauthorized'
}) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading: permLoading } = usePermissions();
  const location = useLocation();

  // Show loading state
  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if specified
  if (permission) {
    let hasAccess = false;

    if (typeof permission === 'string') {
      hasAccess = hasPermission(permission);
    } else if (Array.isArray(permission)) {
      hasAccess = mode === 'any'
        ? hasAnyPermission(permission)
        : hasAllPermissions(permission);
    }

    if (!hasAccess) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
