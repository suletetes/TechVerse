/**
 * Route Guard Component
 * 
 * Provides role-based and permission-based route protection
 * with proper fallback handling and redirect logic
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import unifiedAuthService, { UserRoles } from '../../services/authService.js';

/**
 * RouteGuard Component Props Interface
 */
const RouteGuardPropTypes = {
  children: 'ReactNode',
  requireAuth: 'boolean',
  requireRole: 'string[]',
  requirePermission: 'string[]',
  requireAllPermissions: 'boolean',
  requireEmailVerified: 'boolean',
  fallback: 'ReactComponent',
  redirectTo: 'string',
  onAccessDenied: 'function'
};

/**
 * Loading component for route transitions
 */
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

/**
 * Access denied component
 */
const AccessDeniedFallback = ({ reason, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">{reason}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

/**
 * RouteGuard Component
 */
const RouteGuard = ({
  children,
  requireAuth = false,
  requireRole = [],
  requirePermission = [],
  requireAllPermissions = true,
  requireEmailVerified = false,
  fallback: CustomFallback = null,
  redirectTo = null,
  onAccessDenied = null
}) => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading, hasRole, hasPermission, isAdmin } = useAuth();

  // Debug logging for admin access
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.log('RouteGuard debug:', {
        isAuthenticated,
        user: user,
        userRole: user.role,
        isAdmin: isAdmin(),
        hasAdminRole: hasRole('admin'),
        hasSuperAdminRole: hasRole('super_admin')
      });
    }
  }, [isAuthenticated, user, isAdmin, hasRole]);

  // Show loading state
  if (isLoading) {
    return CustomFallback ? <CustomFallback /> : <RouteLoadingFallback />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    const loginPath = redirectTo || '/login';
    const returnUrl = location.pathname + location.search;

    if (onAccessDenied) {
      onAccessDenied('authentication_required', { returnUrl });
    }

    return <Navigate to={`${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // If not requiring auth, allow access
  if (!requireAuth) {
    return children;
  }

  // Check email verification requirement
  if (requireEmailVerified && !user?.isEmailVerified) {
    const verifyPath = redirectTo || '/verify-email';

    if (onAccessDenied) {
      onAccessDenied('email_verification_required', { user });
    }

    return CustomFallback ?
      <CustomFallback reason="Please verify your email address to continue" /> :
      <Navigate to={verifyPath} replace />;
  }

  // Check role requirements
  if (requireRole.length > 0) {
    const hasRequiredRole = requireRole.some(role => hasRole(role));

    if (!hasRequiredRole) {
      const accessDeniedReason = `Access denied. Required role: ${requireRole.join(' or ')}. Your role: ${user?.role || 'none'}`;

      // Debug logging for role check failure
      if (process.env.NODE_ENV === 'development') {
        console.log('Role check failed:', {
          requiredRoles: requireRole,
          userRole: user?.role,
          hasRequiredRole,
          roleChecks: requireRole.map(role => ({ role, hasRole: hasRole(role) }))
        });
      }

      if (onAccessDenied) {
        onAccessDenied('insufficient_role', {
          requiredRoles: requireRole,
          userRole: user?.role,
          user
        });
      }

      if (CustomFallback) {
        return <CustomFallback reason={accessDeniedReason} />;
      }

      return <AccessDeniedFallback reason={accessDeniedReason} />;
    }
  }

  // Check permission requirements
  if (requirePermission.length > 0) {
    const checkPermissions = requireAllPermissions
      ? requirePermission.every(permission => hasPermission(permission))
      : requirePermission.some(permission => hasPermission(permission));

    if (!checkPermissions) {
      const permissionType = requireAllPermissions ? 'all' : 'any';
      const accessDeniedReason = `Access denied. Required permissions (${permissionType}): ${requirePermission.join(', ')}`;

      if (onAccessDenied) {
        onAccessDenied('insufficient_permissions', {
          requiredPermissions: requirePermission,
          requireAllPermissions,
          userPermissions: user?.permissions || [],
          user
        });
      }

      if (CustomFallback) {
        return <CustomFallback reason={accessDeniedReason} />;
      }

      return <AccessDeniedFallback reason={accessDeniedReason} />;
    }
  }

  // All checks passed, render children
  return children;
};

/**
 * Higher-order component for route protection
 */
export const withRouteGuard = (Component, guardOptions = {}) => {
  return (props) => (
    <RouteGuard {...guardOptions}>
      <Component {...props} />
    </RouteGuard>
  );
};

/**
 * Predefined route guards for common use cases
 */
export const AuthenticatedRoute = ({ children, ...props }) => (
  <RouteGuard requireAuth={true} {...props}>
    {children}
  </RouteGuard>
);

export const AdminRoute = ({ children, requiredPermissions = [], ...props }) => {
  const handleAdminAccessDenied = (reason, context) => {
    console.warn('Admin access denied:', { reason, context });
    
    // Dispatch admin access denied event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('adminAccessDenied', {
        detail: {
          reason,
          context,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  return (
    <RouteGuard
      requireAuth={true}
      requireRole={[UserRoles.ADMIN, UserRoles.SUPER_ADMIN]}
      requirePermission={requiredPermissions}
      requireAllPermissions={true}
      onAccessDenied={handleAdminAccessDenied}
      redirectTo="/unauthorized?type=admin"
      {...props}
    >
      {children}
    </RouteGuard>
  );
};

export const UserRoute = ({ children, allowAdmin = true, ...props }) => {
  const allowedRoles = allowAdmin 
    ? [UserRoles.USER, UserRoles.ADMIN, UserRoles.SUPER_ADMIN]
    : [UserRoles.USER];

  return (
    <RouteGuard
      requireAuth={true}
      requireRole={allowedRoles}
      {...props}
    >
      {children}
    </RouteGuard>
  );
};

export const VerifiedRoute = ({ children, ...props }) => (
  <RouteGuard
    requireAuth={true}
    requireEmailVerified={true}
    {...props}
  >
    {children}
  </RouteGuard>
);

/**
 * Permission-based route guards
 */
export const PermissionRoute = ({ permissions, requireAll = true, children, ...props }) => (
  <RouteGuard
    requireAuth={true}
    requirePermission={permissions}
    requireAllPermissions={requireAll}
    {...props}
  >
    {children}
  </RouteGuard>
);

/**
 * Hook for checking route access programmatically
 */
export const useRouteAccess = (requirements = {}) => {
  const { isAuthenticated, user, isLoading, hasRole, hasPermission } = useAuth();
  const [access, setAccess] = useState({
    canAccess: false,
    reason: null,
    isLoading: true
  });

  useEffect(() => {
    if (isLoading) {
      setAccess(prev => ({ ...prev, isLoading: true }));
      return;
    }

    const checkAccess = () => {
      const {
        requireAuth = false,
        requireRole = [],
        requirePermission = [],
        requireAllPermissions = true,
        requireEmailVerified = false
      } = requirements;

      // Check authentication
      if (requireAuth && !isAuthenticated) {
        setAccess({
          canAccess: false,
          reason: 'authentication_required',
          isLoading: false
        });
        return;
      }

      // Check email verification
      if (requireEmailVerified && !user?.isEmailVerified) {
        setAccess({
          canAccess: false,
          reason: 'email_verification_required',
          isLoading: false
        });
        return;
      }

      // Check roles
      if (requireRole.length > 0) {
        const hasRequiredRole = requireRole.some(role => hasRole(role));
        if (!hasRequiredRole) {
          setAccess({
            canAccess: false,
            reason: 'insufficient_role',
            isLoading: false
          });
          return;
        }
      }

      // Check permissions
      if (requirePermission.length > 0) {
        const checkPermissions = requireAllPermissions
          ? requirePermission.every(permission => hasPermission(permission))
          : requirePermission.some(permission => hasPermission(permission));

        if (!checkPermissions) {
          setAccess({
            canAccess: false,
            reason: 'insufficient_permissions',
            isLoading: false
          });
          return;
        }
      }

      // All checks passed
      setAccess({
        canAccess: true,
        reason: null,
        isLoading: false
      });
    };

    checkAccess();
  }, [isAuthenticated, user, isLoading, hasRole, hasPermission, requirements]);

  return access;
};

/**
 * Utility functions for route configuration
 */
export const createRouteConfig = (path, component, guardOptions = {}) => ({
  path,
  element: (
    <RouteGuard {...guardOptions}>
      {React.createElement(component)}
    </RouteGuard>
  )
});

export const createProtectedRoutes = (routes) => {
  return routes.map(route => ({
    ...route,
    element: route.guard ? (
      <RouteGuard {...route.guard}>
        {route.element}
      </RouteGuard>
    ) : route.element
  }));
};

export default RouteGuard;