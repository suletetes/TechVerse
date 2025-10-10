import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../api/services/authService.js';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
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
  CLEAR_ERROR: 'CLEAR_ERROR'
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
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
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
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
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
  
  // Load user on app start
  useEffect(() => {
    loadUser();
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
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: userData.user });
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: error.message });
    }
  };
  
  // Login
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await authService.login(credentials);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      return response;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };
  
  // Register
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await authService.register(userData);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      return response;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };
  
  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: response.user });
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  // Change password
  const changePassword = async (passwordData) => {
    try {
      return await authService.changePassword(passwordData);
    } catch (error) {
      throw error;
    }
  };
  
  // Forgot password
  const forgotPassword = async (email) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };
  
  // Reset password
  const resetPassword = async (token, password) => {
    try {
      return await authService.resetPassword(token, password);
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
  
  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin');
  };
  
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    hasRole,
    isAdmin,
    loadUser
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