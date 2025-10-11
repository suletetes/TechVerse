import React from 'react'
import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import authService from '../api/services/authService.js';
import { useNotification } from './NotificationContext.jsx';

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
  preferences: {}
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_EMAIL_VERIFIED: 'SET_EMAIL_VERIFIED',
  SET_SESSION_EXPIRY: 'SET_SESSION_EXPIRY',
  UPDATE_ACTIVITY: 'UPDATE_ACTIVITY',
  INCREMENT_LOGIN_ATTEMPTS: 'INCREMENT_LOGIN_ATTEMPTS',
  RESET_LOGIN_ATTEMPTS: 'RESET_LOGIN_ATTEMPTS',
  SET_ACCOUNT_LOCKED: 'SET_ACCOUNT_LOCKED',
  SET_MFA_REQUIRED: 'SET_MFA_REQUIRED',
  SET_MFA_TOKEN: 'SET_MFA_TOKEN',
  CLEAR_MFA: 'CLEAR_MFA',
  SET_REMEMBER_ME: 'SET_REMEMBER_ME',
  SET_DEVICE_INFO: 'SET_DEVICE_INFO',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SESSION_EXPIRED: 'SESSION_EXPIRED'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user || action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLocked: false,
        lockoutExpiry: null,
        sessionExpiry: action.payload.sessionExpiry,
        lastActivity: Date.now(),
        permissions: action.payload.permissions || [],
        preferences: action.payload.preferences || {}
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
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
        user: { ...state.user, ...action.payload }
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

    case AUTH_ACTIONS.SET_MFA_TOKEN:
      return {
        ...state,
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
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { showNotification } = useNotification();
  const sessionCheckInterval = useRef(null);
  const activityTimeout = useRef(null);

  // Constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
  const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

  // Load user on app start
  useEffect(() => {
    loadUser();
    setupSessionManagement();
    setupActivityTracking();
    
    return () => {
      clearInterval(sessionCheckInterval.current);
      clearTimeout(activityTimeout.current);
    };
  }, []);

  // Setup session management
  const setupSessionManagement = useCallback(() => {
    sessionCheckInterval.current = setInterval(() => {
      if (state.isAuthenticated && state.sessionExpiry) {
        const timeUntilExpiry = state.sessionExpiry - Date.now();
        
        if (timeUntilExpiry <= 0) {
          handleSessionExpired();
        } else if (timeUntilExpiry <= SESSION_WARNING_TIME) {
          showNotification('Session expiring soon. Please save your work.', 'warning');
        }
      }
    }, 60000); // Check every minute
  }, [state.isAuthenticated, state.sessionExpiry]);

  // Setup activity tracking
  const setupActivityTracking = useCallback(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (state.isAuthenticated) {
        dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
        
        // Reset activity timeout
        clearTimeout(activityTimeout.current);
        activityTimeout.current = setTimeout(() => {
          showNotification('You have been inactive. Please refresh to continue.', 'warning');
        }, ACTIVITY_TIMEOUT);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [state.isAuthenticated]);

  // Handle session expiry
  const handleSessionExpired = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
    showNotification('Your session has expired. Please log in again.', 'error');
  }, []);

  // Get device information
  const getDeviceInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: Date.now()
    };
  }, []);

  // Load user from token
  const loadUser = async () => {
    if (!authService.isAuthenticated()) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'No token found' });
      return;
    }

    try {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
      const userData = await authService.getProfile();
      
      // Set device info
      const deviceInfo = getDeviceInfo();
      dispatch({ type: AUTH_ACTIONS.SET_DEVICE_INFO, payload: deviceInfo });
      
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: userData });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: error.message });
      
      // If token is invalid, clear it
      if (error.status === 401) {
        authService.logout();
      }
    }
  };

  // Login with enhanced security
  const login = async (credentials, options = {}) => {
    // Check if account is locked
    if (state.isLocked && state.lockoutExpiry > Date.now()) {
      const remainingTime = Math.ceil((state.lockoutExpiry - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      // Add device info to credentials
      const deviceInfo = getDeviceInfo();
      const loginData = {
        ...credentials,
        deviceInfo,
        rememberMe: options.rememberMe || false
      };
      
      const response = await authService.login(loginData);
      
      // Handle MFA requirement
      if (response.mfaRequired) {
        dispatch({ type: AUTH_ACTIONS.SET_MFA_REQUIRED, payload: response.mfaToken });
        return { mfaRequired: true, mfaToken: response.mfaToken };
      }
      
      // Set remember me preference
      if (options.rememberMe) {
        dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: true });
      }
      
      // Reset login attempts on successful login
      dispatch({ type: AUTH_ACTIONS.RESET_LOGIN_ATTEMPTS });
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
      
      showNotification('Login successful!', 'success');
      return response;
      
    } catch (error) {
      // Increment login attempts
      dispatch({ type: AUTH_ACTIONS.INCREMENT_LOGIN_ATTEMPTS });
      
      // Lock account after max attempts
      if (state.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        const lockoutExpiry = Date.now() + LOCKOUT_DURATION;
        dispatch({ type: AUTH_ACTIONS.SET_ACCOUNT_LOCKED, payload: lockoutExpiry });
        showNotification('Account locked due to multiple failed attempts.', 'error');
      }
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Register with enhanced validation
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      // Add device info
      const deviceInfo = getDeviceInfo();
      const registrationData = {
        ...userData,
        deviceInfo
      };
      
      const response = await authService.register(registrationData);
      
      if (response.requiresVerification) {
        showNotification('Registration successful! Please check your email to verify your account.', 'success');
        return { requiresVerification: true, email: userData.email };
      }
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
      showNotification('Registration successful!', 'success');
      return response;
      
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Logout with cleanup
  const logout = async (reason = 'user_initiated') => {
    try {
      await authService.logout({ reason, deviceInfo: state.deviceInfo });
      showNotification('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear intervals and timeouts
      clearInterval(sessionCheckInterval.current);
      clearTimeout(activityTimeout.current);
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Verify MFA code
  const verifyMFA = async (code, mfaToken = state.mfaToken) => {
    try {
      const response = await authService.verifyMFA(code, mfaToken);
      
      dispatch({ type: AUTH_ACTIONS.CLEAR_MFA });
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
      
      showNotification('MFA verification successful!', 'success');
      return response;
      
    } catch (error) {
      throw error;
    }
  };

  // Setup MFA
  const setupMFA = async () => {
    try {
      return await authService.setupMFA();
    } catch (error) {
      throw error;
    }
  };

  // Disable MFA
  const disableMFA = async (password) => {
    try {
      const response = await authService.disableMFA(password);
      
      // Update user data
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: { mfaEnabled: false } });
      
      showNotification('MFA disabled successfully', 'success');
      return response;
      
    } catch (error) {
      throw error;
    }
  };

  // Update profile with validation
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: response.user });
      showNotification('Profile updated successfully', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Change password with security checks
  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      showNotification('Password changed successfully', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Forgot password with rate limiting
  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      showNotification('Password reset email sent. Please check your inbox.', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      showNotification('Password reset successfully. You can now log in.', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      dispatch({ type: AUTH_ACTIONS.SET_EMAIL_VERIFIED });
      showNotification('Email verified successfully!', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      const response = await authService.resendVerification(email);
      showNotification('Verification email sent. Please check your inbox.', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await authService.updatePreferences(preferences);
      dispatch({ type: AUTH_ACTIONS.UPDATE_PREFERENCES, payload: preferences });
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Get user sessions
  const getUserSessions = async () => {
    try {
      return await authService.getUserSessions();
    } catch (error) {
      throw error;
    }
  };

  // Revoke session
  const revokeSession = async (sessionId) => {
    try {
      const response = await authService.revokeSession(sessionId);
      showNotification('Session revoked successfully', 'success');
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      const response = await authService.refreshToken();
      dispatch({ type: AUTH_ACTIONS.SET_SESSION_EXPIRY, payload: response.sessionExpiry });
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return state.permissions.includes(permission) || state.user?.permissions?.includes(permission);
  };

  // Check multiple permissions (all required)
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Check multiple permissions (any required)
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin') || hasRole('super_admin');
  };

  // Check if user is authenticated and email verified
  const isFullyAuthenticated = () => {
    return state.isAuthenticated && 
           (state.user?.isEmailVerified || state.isEmailVerified) && 
           !state.mfaRequired;
  };

  // Check if session is about to expire
  const isSessionExpiringSoon = () => {
    if (!state.sessionExpiry) return false;
    return (state.sessionExpiry - Date.now()) <= SESSION_WARNING_TIME;
  };

  // Get time until session expires
  const getTimeUntilExpiry = () => {
    if (!state.sessionExpiry) return null;
    return Math.max(0, state.sessionExpiry - Date.now());
  };

  // Check if user is active
  const isUserActive = () => {
    if (!state.lastActivity) return true;
    return (Date.now() - state.lastActivity) < ACTIVITY_TIMEOUT;
  };

  const value = {
    ...state,
    // Authentication methods
    login,
    register,
    logout,
    verifyMFA,
    setupMFA,
    disableMFA,
    
    // Profile management
    updateProfile,
    changePassword,
    updatePreferences,
    
    // Password recovery
    forgotPassword,
    resetPassword,
    
    // Email verification
    verifyEmail,
    resendVerification,
    
    // Session management
    refreshSession,
    getUserSessions,
    revokeSession,
    
    // Utility methods
    clearError,
    loadUser,
    
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
    LOCKOUT_DURATION
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;