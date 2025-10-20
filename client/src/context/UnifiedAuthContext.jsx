/**
 * Unified Authentication Context
 * 
 * Consolidates authentication state management using the unified auth service
 * and token manager for consistent authentication across the application
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { unifiedAuthService, UserRoles, AuthEvents } from '../services/authService.js';
import { unifiedTokenManager } from '../utils/unifiedTokenManager.js';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isEmailVerified: false,
  sessionExpiry: null,
  lastActivity: null,
  loginAttempts: 0,
  isLocked: false,
  lockoutExpiry: null,
  mfaRequired: false,
  mfaToken: null,
  rememberMe: false,
  deviceInfo: null,
  permissions: [],
  preferences: {},
  role: null,
  securityStatus: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_EMAIL_VERIFIED: 'SET_EMAIL_VERIFIED',
  SET_SESSION_EXPIRY: 'SET_SESSION_EXPIRY',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY',
  INCREMENT_LOGIN_ATTEMPTS: 'INCREMENT_LOGIN_ATTEMPTS',
  RESET_LOGIN_ATTEMPTS: 'RESET_LOGIN_ATTEMPTS',
  SET_ACCOUNT_LOCKED: 'SET_ACCOUNT_LOCKED',
  SET_MFA_REQUIRED: 'SET_MFA_REQUIRED',
  CLEAR_MFA: 'CLEAR_MFA',
  SET_REMEMBER_ME: 'SET_REMEMBER_ME',
  SET_DEVICE_INFO: 'SET_DEVICE_INFO',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SET_SECURITY_STATUS: 'SET_SECURITY_STATUS',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLocked: false,
        lockoutExpiry: null,
        sessionExpiry: action.payload.sessionExpiry,
        lastActivity: Date.now(),
        permissions: action.payload.user?.permissions || [],
        preferences: action.payload.user?.preferences || {},
        role: action.payload.user?.role || null,
        isEmailVerified: action.payload.user?.isEmailVerified || false
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        role: null,
        permissions: [],
        preferences: {}
      };

    case AUTH_ACTIONS.LOGOUT:
    case AUTH_ACTIONS.SESSION_EXPIRED:
      return {
        ...initialState,
        isLoading: false
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        permissions: action.payload.permissions || state.permissions,
        preferences: action.payload.preferences || state.preferences,
        isEmailVerified: action.payload.isEmailVerified ?? state.isEmailVerified
      };

    case AUTH_ACTIONS.SET_EMAIL_VERIFIED:
      return {
        ...state,
        user: state.user ? { ...state.user, isEmailVerified: true } : null,
        isEmailVerified: true
      };

    case AUTH_ACTIONS.SET_SESSION_EXPIRY:
      return {
        ...state,
        sessionExpiry: action.payload
      };

    case AUTH_ACTIONS.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: Date.now()
      };

    case AUTH_ACTIONS.INCREMENT_LOGIN_ATTEMPTS:
      return {
        ...state,
        loginAttempts: state.loginAttempts + 1
      };

    case AUTH_ACTIONS.RESET_LOGIN_ATTEMPTS:
      return {
        ...state,
        loginAttempts: 0,
        isLocked: false,
        lockoutExpiry: null
      };

    case AUTH_ACTIONS.SET_ACCOUNT_LOCKED:
      return {
        ...state,
        isLocked: true,
        lockoutExpiry: action.payload
      };

    case AUTH_ACTIONS.SET_MFA_REQUIRED:
      return {
        ...state,
        mfaRequired: true,
        mfaToken: action.payload
      };

    case AUTH_ACTIONS.CLEAR_MFA:
      return {
        ...state,
        mfaRequired: false,
        mfaToken: null
      };

    case AUTH_ACTIONS.SET_REMEMBER_ME:
      return {
        ...state,
        rememberMe: action.payload
      };

    case AUTH_ACTIONS.SET_DEVICE_INFO:
      return {
        ...state,
        deviceInfo: action.payload
      };

    case AUTH_ACTIONS.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload
      };

    case AUTH_ACTIONS.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };

    case AUTH_ACTIONS.SET_SECURITY_STATUS:
      return {
        ...state,
        securityStatus: action.payload
      };

    case AUTH_ACTIONS.TOKEN_REFRESHED:
      return {
        ...state,
        sessionExpiry: action.payload.sessionExpiry,
        lastActivity: Date.now()
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const UnifiedAuthContext = createContext();

// Provider component
export const UnifiedAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
  const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      try {
        // Check if user is already authenticated
        if (unifiedAuthService.isAuthenticated()) {
          const user = unifiedAuthService.getCurrentUser();
          if (user) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user, fromStorage: true }
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: error.message
        });
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Listen to auth service events
  useEffect(() => {
    const unsubscribeAuth = unifiedAuthService.addEventListener((event) => {
      switch (event.type) {
        case AuthEvents.LOGIN_SUCCESS:
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: event.data
          });
          break;
        
        case AuthEvents.LOGIN_FAILURE:
          dispatch({
            type: AUTH_ACTIONS.LOGIN_FAILURE,
            payload: event.data.error
          });
          break;
        
        case AuthEvents.LOGOUT:
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          break;
        
        case AuthEvents.TOKEN_REFRESH:
          dispatch({
            type: AUTH_ACTIONS.TOKEN_REFRESHED,
            payload: event.data
          });
          break;
        
        case AuthEvents.PROFILE_UPDATED:
          dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: event.data.user
          });
          break;
        
        case AuthEvents.SESSION_EXPIRED:
          dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
          break;
      }
    });

    return unsubscribeAuth;
  }, []);

  // Listen to token manager events
  useEffect(() => {
    const unsubscribeToken = unifiedTokenManager.addEventListener((event) => {
      switch (event.type) {
        case 'TOKEN_REFRESHED':
          dispatch({
            type: AUTH_ACTIONS.TOKEN_REFRESHED,
            payload: event.data
          });
          break;
        
        case 'TOKENS_CLEARED':
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          break;
      }
    });

    const unsubscribeSecurity = unifiedTokenManager.addSecurityEventListener((event) => {
      const securityStatus = unifiedTokenManager.getStatus();
      dispatch({
        type: AUTH_ACTIONS.SET_SECURITY_STATUS,
        payload: securityStatus
      });
    });

    return () => {
      unsubscribeToken();
      unsubscribeSecurity();
    };
  }, []);

  // Activity tracking
  useEffect(() => {
    if (state.isAuthenticated) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      const handleActivity = () => {
        dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [state.isAuthenticated]);

  // Authentication methods
  const login = useCallback(async (credentials, options = {}) => {
    // Check if account is locked
    if (state.isLocked && state.lockoutExpiry > Date.now()) {
      const remainingTime = Math.ceil((state.lockoutExpiry - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const result = await unifiedAuthService.login(credentials, options);

      if (result.success) {
        // Handle MFA requirement
        if (result.mfaRequired) {
          dispatch({ type: AUTH_ACTIONS.SET_MFA_REQUIRED, payload: result.mfaToken });
          return { mfaRequired: true, mfaToken: result.mfaToken };
        }

        // Set remember me preference
        if (options.rememberMe) {
          dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: true });
        }

        // Reset login attempts on successful login
        dispatch({ type: AUTH_ACTIONS.RESET_LOGIN_ATTEMPTS });
        
        return result;
      } else {
        // Increment login attempts
        dispatch({ type: AUTH_ACTIONS.INCREMENT_LOGIN_ATTEMPTS });

        // Lock account after max attempts
        if (state.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
          const lockoutExpiry = Date.now() + LOCKOUT_DURATION;
          dispatch({ type: AUTH_ACTIONS.SET_ACCOUNT_LOCKED, payload: lockoutExpiry });
        }

        throw new Error(result.message);
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      throw error;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [state.isLocked, state.lockoutExpiry, state.loginAttempts]);

  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const result = await unifiedAuthService.register(userData);
      
      if (result.success && !result.requiresVerification) {
        // Auto-login after successful registration
        return result;
      }
      
      return result;
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      throw error;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  const logout = useCallback(async (reason = 'user_initiated') => {
    try {
      await unifiedAuthService.logout(reason);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  const verifyMFA = useCallback(async (code, mfaToken = state.mfaToken) => {
    try {
      const result = await unifiedAuthService.verifyMFA(code, mfaToken);
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.CLEAR_MFA });
        return result;
      }
      
      throw new Error(result.message);
    } catch (error) {
      throw error;
    }
  }, [state.mfaToken]);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const result = await unifiedAuthService.updateProfile(profileData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: result.user
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (passwordData) => {
    return unifiedAuthService.changePassword(passwordData);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return unifiedAuthService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    return unifiedAuthService.resetPassword(token, password);
  }, []);

  const verifyEmail = useCallback(async (token) => {
    const result = await unifiedAuthService.verifyEmail(token);
    
    if (result.success) {
      dispatch({ type: AUTH_ACTIONS.SET_EMAIL_VERIFIED });
    }
    
    return result;
  }, []);

  const resendVerification = useCallback(async (email) => {
    return unifiedAuthService.resendVerification(email);
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Permission and role checks
  const hasRole = useCallback((role) => {
    return state.user?.role === role;
  }, [state.user]);

  const hasPermission = useCallback((permission) => {
    return state.permissions.includes(permission) || state.user?.permissions?.includes(permission);
  }, [state.permissions, state.user]);

  const hasAllPermissions = useCallback((permissions) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const isAdmin = useCallback(() => {
    return hasRole(UserRoles.ADMIN) || hasRole(UserRoles.SUPER_ADMIN);
  }, [hasRole]);

  const isFullyAuthenticated = useCallback(() => {
    return state.isAuthenticated &&
      (state.user?.isEmailVerified || state.isEmailVerified) &&
      !state.mfaRequired;
  }, [state.isAuthenticated, state.user, state.isEmailVerified, state.mfaRequired]);

  // Session status checks
  const isSessionExpiringSoon = useCallback(() => {
    if (!state.sessionExpiry) return false;
    return (state.sessionExpiry - Date.now()) <= SESSION_WARNING_TIME;
  }, [state.sessionExpiry]);

  const getTimeUntilExpiry = useCallback(() => {
    if (!state.sessionExpiry) return null;
    return Math.max(0, state.sessionExpiry - Date.now());
  }, [state.sessionExpiry]);

  const isUserActive = useCallback(() => {
    if (!state.lastActivity) return true;
    return (Date.now() - state.lastActivity) < ACTIVITY_TIMEOUT;
  }, [state.lastActivity]);

  // Memoized context value
  const value = useMemo(() => ({
    ...state,
    
    // Authentication methods
    login,
    register,
    logout,
    verifyMFA,
    
    // Profile management
    updateProfile,
    changePassword,
    
    // Password recovery
    forgotPassword,
    resetPassword,
    
    // Email verification
    verifyEmail,
    resendVerification,
    
    // Utility methods
    clearError,
    
    // Permission checks
    hasRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin,
    isFullyAuthenticated,
    
    // Session status
    isSessionExpiringSoon,
    getTimeUntilExpiry,
    isUserActive,
    
    // Constants
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_DURATION,
    
    // Token manager status
    tokenStatus: unifiedTokenManager.getStatus()
  }), [
    state,
    login,
    register,
    logout,
    verifyMFA,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    clearError,
    hasRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin,
    isFullyAuthenticated,
    isSessionExpiringSoon,
    getTimeUntilExpiry,
    isUserActive
  ]);

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Hook to use unified auth context
export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

// Export for backward compatibility
export const useAuth = useUnifiedAuth;

export default UnifiedAuthContext;