import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAuthSecurity } from '../../hooks/useAuthSecurity.js';
import LoadingSpinner from '../Common/LoadingSpinner.jsx';
import SecurityAlert from './SecurityAlert.jsx';

const AuthGuard = ({ 
  children, 
  requireAuth = true,
  requireVerification = true,
  requiredRole = null,
  requiredPermissions = [],
  requireAllPermissions = true,
  redirectTo = '/login',
  fallback = null
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    hasRole, 
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isFullyAuthenticated,
    mfaRequired
  } = useAuth();
  
  const { getSecurityRecommendations } = useAuthSecurity();
  const location = useLocation();
  const [securityAlerts, setSecurityAlerts] = useState([]);

  // Check security recommendations
  useEffect(() => {
    if (isAuthenticated) {
      const recommendations = getSecurityRecommendations();
      const criticalAlerts = recommendations.filter(r => r.priority === 'critical');
      setSecurityAlerts(criticalAlerts);
    }
  }, [isAuthenticated, getSecurityRecommendations]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate 
      to={redirectTo} 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // If MFA is required
  if (isAuthenticated && mfaRequired) {
    return <Navigate 
      to="/auth/mfa" 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // If email verification is required
  if (requireVerification && isAuthenticated && !user?.isEmailVerified) {
    return <Navigate 
      to="/auth/verify-email" 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If auth is not required and user is authenticated, redirect away from auth pages
  if (!requireAuth && isAuthenticated && location.pathname.startsWith('/auth/')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {/* Show security alerts */}
      {securityAlerts.map((alert, index) => (
        <SecurityAlert 
          key={index} 
          alert={alert} 
          onDismiss={() => {
            setSecurityAlerts(prev => prev.filter((_, i) => i !== index));
          }}
        />
      ))}
      
      {children}
    </>
  );
};

// Higher-order component for route protection
export const withAuthGuard = (Component, guardOptions = {}) => {
  return (props) => (
    <AuthGuard {...guardOptions}>
      <Component {...props} />
    </AuthGuard>
  );
};

// Specific guard components for common use cases
export const AdminGuard = ({ children, ...props }) => (
  <AuthGuard 
    requiredRole="admin" 
    requireVerification={true}
    {...props}
  >
    {children}
  </AuthGuard>
);

export const UserGuard = ({ children, ...props }) => (
  <AuthGuard 
    requireAuth={true}
    requireVerification={true}
    {...props}
  >
    {children}
  </AuthGuard>
);

export const GuestGuard = ({ children, ...props }) => (
  <AuthGuard 
    requireAuth={false}
    {...props}
  >
    {children}
  </AuthGuard>
);

export const PermissionGuard = ({ permissions, requireAll = true, children, ...props }) => (
  <AuthGuard 
    requiredPermissions={permissions}
    requireAllPermissions={requireAll}
    {...props}
  >
    {children}
  </AuthGuard>
);

export default AuthGuard;