/**
 * Route Guard Component
 * 
 * Provides role-based and permission-based route protection
 * with proper fallback handling and redirect logic
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null
  });

  // Subscribe to auth state changes
  useEffect(() => {
    const updateAuthState = async () => {
      try {
        const isAuthenticated = unifiedAuthService.isAuthenticated();
        let user = unifiedAuthService.getCurrentUser();
        
        // If we have a token but no user data, try to fetch it from backend
        if (isAuthenticated && !user) {
          try {
            const profileResponse = await unifiedAuthService.getProfile();
            if (profileResponse.success && profileResponse.data?.user) {
              user = profileResponse.data.user;
              // Update stored user data
              localStorage.setItem('techverse_user', JSON.stringify(user));
            }
          } catch (error) {
            console.warn('Failed to fetch user profile:', error);
            // If profile fetch fails with 401, the user is not actually authenticated
            if (error.status === 401) {
              setAuthState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                error: 'Session expired'
              });
              return;
            }
          }
        }

        setAuthState({
          isLoading: false,
          isAuthenticated,
          user,
          error: null
        });
      } catch (error) {
        console.error('Error updating auth state:', error);
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: error.message
        });
      }
    };

    // Initial state check
    updateAuthState();

    // Listen for auth state changes
    const unsubscribe = unifiedAuthService.addEventListener((event) => {
      updateAuthState();
    });

    // Listen for DOM events as well
    const handleAuthStateChange = () => {
      updateAuthState();
    };

    // Listen for authentication errors from API interceptors
    const handleAuthError = (event) => {
      const { type, reason } = event.detail;
      if (type === 'AUTHENTICATION_FAILED' || type === 'AUTHORIZATION_FAILED') {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          error: reason || 'Authentication failed'
        }));
      }
    };

    window.addEventListener('authStateChange', handleAuthStateChange);
    window.addEventListener('authError', handleAuthError);

    return () => {
      unsubscribe();
      window.removeEventListener('authStateChange', handleAuthStateChange);
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  // Show loading state
  if (authState.isLoading) {
    return CustomFallback ? <CustomFallback /> : <RouteLoadingFallback />;
  }

  // Check authentication requirement
  if (requireAuth && !authState.isAuthenticated) {
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

  const { user } = authState;

  // Check email verification requirement
  if (requireEmailVerified && !unifiedAuthService.isEmailVerified()) {
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
    const hasRequiredRole = requireRole.some(role => unifiedAuthService.hasRole(role));

    if (!hasRequiredRole) {
      const accessDeniedReason = `Access denied. Required role: ${requireRole.join(' or ')}. Your role: ${user?.role || 'none'}`;

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
      ? requirePermission.every(permission => unifiedAuthService.hasPermission(permission))
      : requirePermission.some(permission => unifiedAuthService.hasPermission(permission));

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
  const [access, setAccess] = useState({
    canAccess: false,
    reason: null,
    isLoading: true
  });

  useEffect(() => {
    const checkAccess = () => {
      const {
        requireAuth = false,
        requireRole = [],
        requirePermission = [],
        requireAllPermissions = true,
        requireEmailVerified = false
      } = requirements;

      // Check authentication
      if (requireAuth && !unifiedAuthService.isAuthenticated()) {
        setAccess({
          canAccess: false,
          reason: 'authentication_required',
          isLoading: false
        });
        return;
      }

      // Check email verification
      if (requireEmailVerified && !unifiedAuthService.isEmailVerified()) {
        setAccess({
          canAccess: false,
          reason: 'email_verification_required',
          isLoading: false
        });
        return;
      }

      // Check roles
      if (requireRole.length > 0) {
        const hasRequiredRole = requireRole.some(role => unifiedAuthService.hasRole(role));
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
          ? requirePermission.every(permission => unifiedAuthService.hasPermission(permission))
          : requirePermission.some(permission => unifiedAuthService.hasPermission(permission));

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

    // Listen for auth state changes
    const unsubscribe = unifiedAuthService.addEventListener(() => {
      checkAccess();
    });

    return unsubscribe;
  }, [requirements]);

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