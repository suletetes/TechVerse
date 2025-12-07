import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * RoleGuard - Conditionally render children based on user role
 * 
 * @param {string|string[]} role - Single role or array of roles
 * @param {React.ReactNode} children - Content to render if role check passes
 * @param {React.ReactNode} fallback - Content to render if role check fails
 */
const RoleGuard = ({ 
  role, 
  children, 
  fallback = null 
}) => {
  const { user, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return fallback;
  }

  // No user
  if (!user) {
    return fallback;
  }

  // Handle single role
  if (typeof role === 'string') {
    return user.role === role ? children : fallback;
  }

  // Handle multiple roles
  if (Array.isArray(role)) {
    return role.includes(user.role) ? children : fallback;
  }

  // Invalid role prop
  return fallback;
};

export default RoleGuard;
