import { createContext, useContext, useMemo } from 'react';
import { useShallowMemo } from './ContextSelector.jsx';

// Create separate contexts for state and actions
const AuthStateContext = createContext();
const AuthActionsContext = createContext();

/**
 * Provider for auth state only - optimized for components that only need to read state
 */
export const AuthStateProvider = ({ children, authState }) => {
  // Use shallow memoization to prevent unnecessary re-renders
  const memoizedState = useShallowMemo({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    isEmailVerified: authState.isEmailVerified,
    sessionExpiry: authState.sessionExpiry,
    lastActivity: authState.lastActivity,
    loginAttempts: authState.loginAttempts,
    isLocked: authState.isLocked,
    lockoutExpiry: authState.lockoutExpiry,
    mfaRequired: authState.mfaRequired,
    mfaToken: authState.mfaToken,
    rememberMe: authState.rememberMe,
    deviceInfo: authState.deviceInfo,
    permissions: authState.permissions,
    preferences: authState.preferences
  });

  return (
    <AuthStateContext.Provider value={memoizedState}>
      {children}
    </AuthStateContext.Provider>
  );
};

/**
 * Provider for auth actions only - optimized for components that only need actions
 */
export const AuthActionsProvider = ({ children, authActions }) => {
  const memoizedActions = useMemo(() => ({
    // Authentication methods
    login: authActions.login,
    register: authActions.register,
    logout: authActions.logout,
    verifyMFA: authActions.verifyMFA,
    setupMFA: authActions.setupMFA,
    disableMFA: authActions.disableMFA,

    // Profile management
    updateProfile: authActions.updateProfile,
    changePassword: authActions.changePassword,
    updatePreferences: authActions.updatePreferences,

    // Password recovery
    forgotPassword: authActions.forgotPassword,
    resetPassword: authActions.resetPassword,

    // Email verification
    verifyEmail: authActions.verifyEmail,
    resendVerification: authActions.resendVerification,

    // Session management
    refreshSession: authActions.refreshSession,
    getUserSessions: authActions.getUserSessions,
    revokeSession: authActions.revokeSession,

    // Utility methods
    clearError: authActions.clearError,
    loadUser: authActions.loadUser
  }), [authActions]);

  return (
    <AuthActionsContext.Provider value={memoizedActions}>
      {children}
    </AuthActionsContext.Provider>
  );
};

/**
 * Hook to access auth state only
 */
export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthStateProvider');
  }
  return context;
};

/**
 * Hook to access auth actions only
 */
export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error('useAuthActions must be used within an AuthActionsProvider');
  }
  return context;
};

/**
 * Selective hooks for specific auth state properties
 */
export const useAuthUser = () => {
  const { user } = useAuthState();
  return user;
};

export const useAuthStatus = () => {
  const { isAuthenticated, isLoading } = useAuthState();
  return { isAuthenticated, isLoading };
};

export const useAuthError = () => {
  const { error } = useAuthState();
  return error;
};

export const useAuthPermissions = () => {
  const { permissions } = useAuthState();
  return permissions;
};

export const useAuthSession = () => {
  const { sessionExpiry, lastActivity, isLocked, lockoutExpiry } = useAuthState();
  return { sessionExpiry, lastActivity, isLocked, lockoutExpiry };
};

export const useAuthMFA = () => {
  const { mfaRequired, mfaToken } = useAuthState();
  return { mfaRequired, mfaToken };
};