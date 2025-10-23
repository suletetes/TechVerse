import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import authService from '../api/services/authService.js';
import { multiTabSyncManager } from '../utils/multiTabSyncManager.js';

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
      const user = action.payload.user || action.payload;

      // Debug logging for admin role issue
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext reducer LOGIN_SUCCESS:', {
          payload: action.payload,
          extractedUser: user,
          userRole: user?.role,
          userPermissions: user?.permissions,
          payloadPermissions: action.payload.permissions,
          finalPermissions: action.payload.user?.permissions || action.payload.permissions
        });
      }

      return {
        ...state,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLocked: false,
        lockoutExpiry: null,
        sessionExpiry: action.payload.sessionExpiry,
        lastActivity: Date.now(),
        permissions: action.payload.user?.permissions || action.payload.permissions || [],
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

  // Simple notification function for now - we'll enhance this later
  const showNotification = useCallback((message, type = 'info') => {
    // For now, just log to console in development
    if (import.meta.env.DEV) {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
    // TODO: Integrate with notification system once circular dependency is resolved
  }, []);

  const sessionCheckInterval = useRef(null);
  const activityTimeout = useRef(null);
  const syncUnsubscribe = useRef(null);

  // Constants
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
  const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

  // Get device information
  const getDeviceInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }, []);

  // Load user from token
  const loadUser = useCallback(async () => {
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

      dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: userData.data || userData });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: error.message });

      // If token is invalid, clear it
      if (error.status === 401) {
        authService.logout();
      }
    }
  }, [getDeviceInfo]);

  // Load user on app start
  useEffect(() => {
    loadUser();

    // Set up multi-tab synchronization
    syncUnsubscribe.current = multiTabSyncManager.addSyncListener((event) => {
      handleSyncEvent(event);
    });

    return () => {
      if (syncUnsubscribe.current) {
        syncUnsubscribe.current();
      }
    };
  }, []); // Remove loadUser dependency to prevent infinite loops

  // Setup session management when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      // Setup session check interval
      sessionCheckInterval.current = setInterval(() => {
        // Get fresh state from ref to avoid stale closures
        if (state.sessionExpiry) {
          const timeUntilExpiry = state.sessionExpiry - Date.now();

          if (timeUntilExpiry <= 0) {
            dispatch({ type: AUTH_ACTIONS.SESSION_EXPIRED });
          } else if (timeUntilExpiry <= SESSION_WARNING_TIME) {
            // Session expiring soon - could trigger notification here
          }
        }
      }, 60000); // Check every minute

      // Setup activity tracking
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      const handleActivity = () => {
        dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current);
        }
        if (activityTimeout.current) {
          clearTimeout(activityTimeout.current);
        }
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [state.isAuthenticated, state.sessionExpiry]); // Add sessionExpiry to dependencies





  // Handle multi-tab sync events
  const handleSyncEvent = useCallback((event) => {
    switch (event.type) {
      case 'login':
        if (event.data.user) {
          dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: event.data });
          showNotification('Logged in from another tab', 'info');
        }
        break;

      case 'logout':
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        showNotification('Logged out from another tab', 'info');
        break;

      case 'tokenRefresh':
        if (event.data.user) {
          dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: event.data.user });
        }
        break;

      case 'securityBreach':
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        showNotification('Security breach detected. Please log in again.', 'error');
        break;

      case 'sessionStateChange':
        if (event.data) {
          const { isAuthenticated, user } = event.data;
          if (isAuthenticated && user) {
            dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user } });
          } else if (!isAuthenticated) {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        }
        break;
    }
  }, [showNotification]); // Remove state dependencies to prevent stale closures

  // Login with enhanced security
  const login = async (credentials, options = {}) => {
    // Check if account is locked
    if (state.isLocked && state.lockoutExpiry > Date.now()) {
      const remainingTime = Math.ceil((state.lockoutExpiry - Date.now()) / 60000);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    try {
      console.log('AuthContext login called with:', { credentials, options });
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Send only email and password for login - deviceInfo will be added server-side
      const loginData = {
        email: credentials.email,
        password: credentials.password
      };

      console.log('Sending login data to authService:', loginData);
      const response = await authService.login(loginData);

      // Debug logging for admin role issue
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext login response:', {
          response,
          user: response.data?.user,
          userRole: response.data?.user?.role,
          userPermissions: response.data?.user?.permissions,
          hasUser: !!response.data?.user
        });
      }

      // Handle MFA requirement
      if (response.data?.mfaRequired) {
        dispatch({ type: AUTH_ACTIONS.SET_MFA_REQUIRED, payload: response.data.mfaToken });
        return { mfaRequired: true, mfaToken: response.data.mfaToken };
      }

      // Set remember me preference
      if (options.rememberMe) {
        dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: true });
      }

      // Reset login attempts on successful login
      dispatch({ type: AUTH_ACTIONS.RESET_LOGIN_ATTEMPTS });
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data });

      // Sync login across tabs
      multiTabSyncManager.syncLogin(response.data.user, response.data.tokens);

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

      // Send only the required user data - deviceInfo will be added server-side
      const registrationData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        subscribeNewsletter: userData.subscribeNewsletter
      };

      const response = await authService.register(registrationData);

      if (response.data?.requiresVerification) {
        showNotification('Registration successful! Please check your email to verify your account.', 'success');
        return { requiresVerification: true, email: userData.email };
      }

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data });

      // Sync login across tabs
      multiTabSyncManager.syncLogin(response.data.user, response.data.tokens);

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

      // Sync logout across tabs
      multiTabSyncManager.syncLogout(reason);

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Verify MFA code
  const verifyMFA = async (code, mfaToken = state.mfaToken) => {
    try {
      const response = await authService.verifyMFA(code, mfaToken);

      dispatch({ type: AUTH_ACTIONS.CLEAR_MFA });
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data });

      // Sync login across tabs
      multiTabSyncManager.syncLogin(response.data.user, response.data.tokens);

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

  // Refresh user profile and permissions
  const refreshProfile = async () => {
    try {
      const userData = await authService.getProfile();
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: userData.data || userData });
      return userData;
    } catch (error) {
      throw error;
    }
  };

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Check if user has specific role
  const hasRole = (role) => {
    const result = state.user?.role === role;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('hasRole() called:', {
        requestedRole: role,
        userRole: state.user?.role,
        result,
        hasUser: !!state.user
      });
    }
    
    return result;
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    const result = state.permissions.includes(permission) || state.user?.permissions?.includes(permission);
    
    // Debug logging for permission checks
    if (process.env.NODE_ENV === 'development') {
      console.log('hasPermission() called:', {
        requestedPermission: permission,
        statePermissions: state.permissions,
        userPermissions: state.user?.permissions,
        result
      });
    }
    
    return result;
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
    const result = hasRole('admin') || hasRole('super_admin');
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('isAdmin() called:', {
        result,
        hasAdminRole: hasRole('admin'),
        hasSuperAdminRole: hasRole('super_admin'),
        userRole: state.user?.role,
        stateUser: state.user
      });
    }
    
    return result;
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

  const value = useMemo(() => ({
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
    refreshProfile,
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
  }), [
    state,
    login,
    register,
    logout,
    verifyMFA,
    setupMFA,
    disableMFA,
    updateProfile,
    changePassword,
    updatePreferences,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshSession,
    refreshProfile,
    getUserSessions,
    revokeSession,
    clearError,
    loadUser,
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