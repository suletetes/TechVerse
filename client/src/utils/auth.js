/**
 * Frontend Authentication Utilities
 * 
 * This module provides authentication utilities for the TechVerse frontend,
 * including token management, user state, and authentication helpers.
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../api/interceptors/index.js';
import { tokenManager } from './tokenManager.js';

// Authentication state management
class AuthManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
    
    // Initialize from stored token
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored token
   */
  async initializeAuth() {
    const token = tokenManager.getToken();
    const storedUser = localStorage.getItem('techverse_user');
    
    // First, try to restore user from localStorage if available
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        this.setUser(user);
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem('techverse_user');
      }
    }
    
    if (token) {
      try {
        // Verify token by fetching current user profile
        const response = await apiClient.get('/auth/me');
        const data = await response.json();
        
        if (data.success && data.data.user) {
          this.setUser(data.data.user);
          // Update stored user data
          localStorage.setItem('techverse_user', JSON.stringify(data.data.user));
        } else {
          console.warn('Token validation failed - invalid response');
          this.clearAuth();
        }
      } catch (error) {
        console.warn('Token validation failed:', error.message);
        
        // If token is expired, try to refresh it
        if (error.message.includes('expired') || error.message.includes('401')) {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            try {
              console.log('Attempting to refresh expired token...');
              const refreshResponse = await apiClient.post('/auth/refresh-token', {
                refreshToken
              });
              
              const refreshData = await refreshResponse.json();
              if (refreshData.success && refreshData.data.tokens) {
                const { accessToken, refreshToken: newRefreshToken, expiresIn } = refreshData.data.tokens;
                tokenManager.setToken(accessToken, expiresIn);
                if (newRefreshToken) {
                  tokenManager.setRefreshToken(newRefreshToken);
                }
                
                // Retry getting user profile
                const retryResponse = await apiClient.get('/auth/me');
                const retryData = await retryResponse.json();
                if (retryData.success && retryData.data.user) {
                  this.setUser(retryData.data.user);
                  localStorage.setItem('techverse_user', JSON.stringify(retryData.data.user));
                  return;
                }
              }
            } catch (refreshError) {
              console.warn('Token refresh failed during initialization:', refreshError.message);
            }
          }
        }
        
        this.clearAuth();
      }
    } else if (!token && storedUser) {
      // Clear stale user data if no token
      localStorage.removeItem('techverse_user');
    }
  }

  /**
   * Login user with email and password
   */
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        // Store tokens with enhanced security
        const { accessToken, refreshToken, expiresIn } = data.data.tokens;
        
        tokenManager.setToken(accessToken, expiresIn);
        tokenManager.setRefreshToken(refreshToken);
        
        // Set user data
        this.setUser(data.data.user);
        
        // Store user data in localStorage for persistence
        localStorage.setItem('techverse_user', JSON.stringify(data.data.user));
        
        // Log successful login
        console.log('Login successful:', {
          userId: data.data.user._id,
          email: data.data.user.email,
          role: data.data.user.role,
          timestamp: new Date().toISOString()
        });
        
        return {
          success: true,
          user: data.data.user,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any partial auth state
      this.clearAuth();
      
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        // Store tokens
        tokenManager.setToken(data.data.tokens.accessToken);
        tokenManager.setRefreshToken(data.data.tokens.refreshToken);
        
        // Set user data
        this.setUser(data.data.user);
        
        return {
          success: true,
          user: data.data.user,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
    } finally {
      // Always clear local auth state
      this.clearAuth();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      const data = await response.json();
      
      if (data.success && data.data.user) {
        this.setUser(data.data.user);
        return data.data.user;
      } else {
        throw new Error(data.message || 'Failed to get profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/me', profileData);
      const data = await response.json();
      
      if (data.success && data.data.user) {
        this.setUser(data.data.user);
        return {
          success: true,
          user: data.data.user,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: error.message || 'Profile update failed'
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: error.message || 'Password change failed'
      };
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: error.message || 'Password reset request failed'
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, password) {
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password
      });
      
      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        // Store new tokens
        tokenManager.setToken(data.data.tokens.accessToken);
        tokenManager.setRefreshToken(data.data.tokens.refreshToken);
        
        // Set user data
        this.setUser(data.data.user);
      }
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: error.message || 'Password reset failed'
      };
    }
  }

  /**
   * Set user data and update authentication state
   */
  setUser(user) {
    this.user = user;
    this.isAuthenticated = true;
    this.notifyListeners();
  }

  /**
   * Clear authentication state
   */
  clearAuth() {
    this.user = null;
    this.isAuthenticated = false;
    tokenManager.clearTokens();
    
    // Clear stored user data
    localStorage.removeItem('techverse_user');
    
    // Clear any other auth-related data
    localStorage.removeItem('techverse_remember_me');
    
    this.notifyListeners();
    
    console.log('Authentication state cleared');
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.user && this.user.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified() {
    return this.user && this.user.isEmailVerified;
  }

  /**
   * Get user's full name
   */
  getFullName() {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`.trim();
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({
          user: this.user,
          isAuthenticated: this.isAuthenticated,
          isAdmin: this.isAdmin(),
          isEmailVerified: this.isEmailVerified()
        });
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  /**
   * Get current authentication state
   */
  getState() {
    return {
      user: this.user,
      isAuthenticated: this.isAuthenticated,
      isAdmin: this.isAdmin(),
      isEmailVerified: this.isEmailVerified()
    };
  }
}

// Create singleton instance
export const authManager = new AuthManager();

// Authentication hooks for React components
export const useAuth = () => {
  const [authState, setAuthState] = useState(authManager.getState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authManager.login.bind(authManager),
    logout: authManager.logout.bind(authManager),
    register: authManager.register.bind(authManager),
    getProfile: authManager.getProfile.bind(authManager),
    updateProfile: authManager.updateProfile.bind(authManager),
    changePassword: authManager.changePassword.bind(authManager),
    forgotPassword: authManager.forgotPassword.bind(authManager),
    resetPassword: authManager.resetPassword.bind(authManager)
  };
};

// Route protection utilities
export const requireAuth = (component) => {
  return (props) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
      return null;
    }
    
    return component(props);
  };
};

export const requireAdmin = (component) => {
  return (props) => {
    const { isAuthenticated, isAdmin } = useAuth();
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }
    
    if (!isAdmin) {
      window.location.href = '/unauthorized';
      return null;
    }
    
    return component(props);
  };
};

// Error handling utilities
export const getAuthErrorMessage = (error) => {
  const errorMessages = {
    'EMAIL_EXISTS': 'An account with this email already exists',
    'INVALID_CREDENTIALS': 'Invalid email or password',
    'ACCOUNT_LOCKED': 'Account is temporarily locked due to too many failed attempts',
    'ACCOUNT_INACTIVE': 'Account is deactivated. Please contact support',
    'EMAIL_NOT_VERIFIED': 'Please verify your email address to continue',
    'TOKEN_EXPIRED': 'Session expired. Please login again',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later'
  };
  
  return errorMessages[error.code] || error.message || 'An error occurred';
};

export default authManager;