/**
 * Unified Authentication Service
 * 
 * Consolidates authentication utilities from auth.js and authService.js
 * Provides consistent error handling, response formatting, and TypeScript interfaces
 */

import { apiClient, handleApiResponse } from '../api/interceptors/index.js';
import { unifiedTokenManager } from '../utils/unifiedTokenManager.js';
import { API_ENDPOINTS } from '../api/config.js';

// Authentication interfaces and types
export const AuthErrorCodes = {
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  INVALID_MFA_CODE: 'INVALID_MFA_CODE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const AuthEvents = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED'
};

/**
 * Unified Authentication Service Class
 */
class UnifiedAuthService {
  constructor() {
    this.eventListeners = [];
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored token
   */
  async initializeAuth() {
    const token = unifiedTokenManager.getToken();
    const storedUser = localStorage.getItem('techverse_user');
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { user, fromStorage: true });
      } catch (error) {
        console.warn('Failed to parse stored user data:', error);
        localStorage.removeItem('techverse_user');
      }
    }
    
    if (token) {
      try {
        const response = await this.getProfile();
        if (response.success && response.data?.user) {
          localStorage.setItem('techverse_user', JSON.stringify(response.data.user));
          this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { 
            user: response.data.user, 
            fromTokenValidation: true 
          });
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.warn('Token validation failed:', error.message);
        
        if (this.isTokenExpiredError(error)) {
          const refreshToken = unifiedTokenManager.getRefreshToken();
          if (refreshToken) {
            try {
              await unifiedTokenManager.refreshToken();
              const retryResponse = await this.getProfile();
              if (retryResponse.success && retryResponse.data?.user) {
                localStorage.setItem('techverse_user', JSON.stringify(retryResponse.data.user));
                this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { 
                  user: retryResponse.data.user, 
                  fromRefresh: true 
                });
                return;
              }
            } catch (refreshError) {
              console.warn('Token refresh failed during initialization:', refreshError.message);
            }
          }
        }
        
        this.clearAuth();
      }
    }
  }

  /**
   * Login user with enhanced security and error handling
   */
  async login(credentials, options = {}) {
    try {
      const loginData = {
        ...credentials,
        deviceInfo: this.getDeviceInfo(),
        rememberMe: options.rememberMe || false
      };

      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, loginData);
      const data = await handleApiResponse(response);

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Handle MFA requirement
      if (data.mfaRequired) {
        return {
          success: true,
          mfaRequired: true,
          mfaToken: data.mfaToken,
          message: 'MFA verification required'
        };
      }

      // Handle successful login
      if (data.data?.tokens && data.data?.user) {
        const { tokens, user, security } = data.data;

        // Store tokens with enhanced security
        unifiedTokenManager.setToken(
          tokens.accessToken,
          tokens.expiresIn,
          tokens.sessionId
        );

        if (tokens.refreshToken) {
          unifiedTokenManager.setRefreshToken(tokens.refreshToken);
        }

        // Store user data and permissions
        localStorage.setItem('techverse_user', JSON.stringify(user));
        if (user.permissions) {
          localStorage.setItem('techverse_permissions', JSON.stringify(user.permissions));
        }

        // Store security context
        if (security) {
          localStorage.setItem('techverse_security_context', JSON.stringify(security));
        }

        // Store session expiry
        if (tokens.expiresAt) {
          localStorage.setItem('session_expiry', new Date(tokens.expiresAt).getTime().toString());
        }

        this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { user, tokens });

        return {
          success: true,
          user,
          tokens,
          message: data.message || 'Login successful'
        };
      }

      throw new Error('Invalid login response format');

    } catch (error) {
      const authError = this.formatAuthError(error);
      this.emitAuthEvent(AuthEvents.LOGIN_FAILURE, { error: authError });
      
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Register new user with validation
   */
  async register(userData) {
    try {
      const registrationData = {
        ...userData,
        deviceInfo: this.getDeviceInfo()
      };

      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, registrationData);
      const data = await handleApiResponse(response);

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Handle email verification requirement
      if (data.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          email: userData.email,
          message: data.message || 'Please check your email to verify your account'
        };
      }

      // Handle successful registration with immediate login
      if (data.data?.tokens && data.data?.user) {
        const { tokens, user } = data.data;

        unifiedTokenManager.setToken(tokens.accessToken, tokens.expiresIn);
        if (tokens.refreshToken) {
          unifiedTokenManager.setRefreshToken(tokens.refreshToken);
        }

        localStorage.setItem('techverse_user', JSON.stringify(user));
        if (user.permissions) {
          localStorage.setItem('techverse_permissions', JSON.stringify(user.permissions));
        }

        this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { user, tokens, fromRegistration: true });

        return {
          success: true,
          user,
          tokens,
          message: data.message || 'Registration successful'
        };
      }

      return {
        success: true,
        message: data.message || 'Registration successful'
      };

    } catch (error) {
      const authError = this.formatAuthError(error);
      
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Logout user with cleanup
   */
  async logout(reason = 'user_initiated') {
    try {
      const logoutData = {
        reason,
        deviceInfo: this.getDeviceInfo(),
        sessionId: tokenManager.getTokenMetadata()?.sessionId
      };

      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, logoutData);
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
    } finally {
      this.clearAuth();
      this.emitAuthEvent(AuthEvents.LOGOUT, { reason });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
      const data = await handleApiResponse(response);

      if (data.success && data.data?.user) {
        // Update stored user data
        localStorage.setItem('techverse_user', JSON.stringify(data.data.user));
        return data;
      }

      throw new Error(data.message || 'Failed to get profile');
    } catch (error) {
      throw this.formatAuthError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.AUTH.PROFILE, profileData);
      const data = await handleApiResponse(response);

      if (data.success && data.data?.user) {
        // Update stored user data
        localStorage.setItem('techverse_user', JSON.stringify(data.data.user));
        this.emitAuthEvent(AuthEvents.PROFILE_UPDATED, { user: data.data.user });
        
        return {
          success: true,
          user: data.data.user,
          message: data.message || 'Profile updated successfully'
        };
      }

      throw new Error(data.message || 'Profile update failed');
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
      const data = await handleApiResponse(response);

      if (data.success) {
        this.emitAuthEvent(AuthEvents.PASSWORD_CHANGED, { timestamp: new Date().toISOString() });
        return {
          success: true,
          message: data.message || 'Password changed successfully'
        };
      }

      throw new Error(data.message || 'Password change failed');
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      const data = await handleApiResponse(response);

      return {
        success: data.success,
        message: data.message || 'Password reset email sent'
      };
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password
      });
      const data = await handleApiResponse(response);

      if (data.success && data.data?.tokens) {
        const { tokens, user } = data.data;

        unifiedTokenManager.setToken(tokens.accessToken, tokens.expiresIn);
        if (tokens.refreshToken) {
          unifiedTokenManager.setRefreshToken(tokens.refreshToken);
        }

        if (user) {
          localStorage.setItem('techverse_user', JSON.stringify(user));
          this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { user, tokens, fromPasswordReset: true });
        }
      }

      return {
        success: data.success,
        message: data.message || 'Password reset successfully'
      };
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}/${token}`);
      const data = await handleApiResponse(response);

      return {
        success: data.success,
        message: data.message || 'Email verified successfully'
      };
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
      const data = await handleApiResponse(response);

      return {
        success: data.success,
        message: data.message || 'Verification email sent'
      };
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * MFA Methods
   */
  async verifyMFA(code, mfaToken) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_MFA, {
        code,
        mfaToken
      });
      const data = await handleApiResponse(response);

      if (data.success && data.data?.tokens) {
        const { tokens, user } = data.data;

        unifiedTokenManager.setToken(tokens.accessToken, tokens.expiresIn);
        if (tokens.refreshToken) {
          unifiedTokenManager.setRefreshToken(tokens.refreshToken);
        }

        localStorage.setItem('techverse_user', JSON.stringify(user));
        this.emitAuthEvent(AuthEvents.LOGIN_SUCCESS, { user, tokens, fromMFA: true });

        return {
          success: true,
          user,
          tokens,
          message: data.message || 'MFA verification successful'
        };
      }

      throw new Error(data.message || 'MFA verification failed');
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  async setupMFA() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.SETUP_MFA);
      return handleApiResponse(response);
    } catch (error) {
      throw this.formatAuthError(error);
    }
  }

  async disableMFA(password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.DISABLE_MFA, { password });
      const data = await handleApiResponse(response);

      return {
        success: data.success,
        message: data.message || 'MFA disabled successfully'
      };
    } catch (error) {
      const authError = this.formatAuthError(error);
      return {
        success: false,
        error: authError,
        message: authError.message
      };
    }
  }

  /**
   * Session management
   */
  async refreshToken() {
    return unifiedTokenManager.refreshToken();

  }

  /**
   * Utility methods
   */
  isAuthenticated() {
    return unifiedTokenManager.hasValidTokens();
  }

  getCurrentUser() {
    try {
      const storedUser = localStorage.getItem('techverse_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  hasPermission(permission) {
    const user = this.getCurrentUser();
    const permissions = user?.permissions || JSON.parse(localStorage.getItem('techverse_permissions') || '[]');
    return permissions.includes(permission);
  }

  isAdmin() {
    return this.hasRole(UserRoles.ADMIN) || this.hasRole(UserRoles.SUPER_ADMIN);
  }

  isEmailVerified() {
    const user = this.getCurrentUser();
    return user && user.isEmailVerified;
  }

  getFullName() {
    const user = this.getCurrentUser();
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  /**
   * Clear authentication state
   */
  clearAuth() {
    unifiedTokenManager.clearTokens();
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timestamp: new Date().toISOString(),
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth
    };
  }

  /**
   * Format authentication errors consistently
   */
  formatAuthError(error) {
    const errorCode = this.getErrorCode(error);
    const message = this.getErrorMessage(errorCode, error.message);
    
    return {
      code: errorCode,
      message,
      status: error.status || 500,
      timestamp: new Date().toISOString(),
      originalError: error.message
    };
  }

  /**
   * Get error code from error
   */
  getErrorCode(error) {
    if (error.message?.includes('EMAIL_EXISTS') || error.status === 409) {
      return AuthErrorCodes.EMAIL_EXISTS;
    }
    if (error.message?.includes('INVALID_CREDENTIALS') || error.status === 401) {
      return AuthErrorCodes.INVALID_CREDENTIALS;
    }
    if (error.message?.includes('ACCOUNT_LOCKED')) {
      return AuthErrorCodes.ACCOUNT_LOCKED;
    }
    if (error.message?.includes('EMAIL_NOT_VERIFIED')) {
      return AuthErrorCodes.EMAIL_NOT_VERIFIED;
    }
    if (error.message?.includes('expired') || error.message?.includes('TOKEN_EXPIRED')) {
      return AuthErrorCodes.TOKEN_EXPIRED;
    }
    if (error.status === 429) {
      return AuthErrorCodes.RATE_LIMIT_EXCEEDED;
    }
    if (error.message?.includes('MFA_REQUIRED')) {
      return AuthErrorCodes.MFA_REQUIRED;
    }
    if (error.message?.includes('network') || !error.status) {
      return AuthErrorCodes.NETWORK_ERROR;
    }
    if (error.status >= 500) {
      return AuthErrorCodes.SERVER_ERROR;
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(errorCode, originalMessage) {
    const errorMessages = {
      [AuthErrorCodes.EMAIL_EXISTS]: 'An account with this email already exists',
      [AuthErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
      [AuthErrorCodes.ACCOUNT_LOCKED]: 'Account is temporarily locked due to too many failed attempts',
      [AuthErrorCodes.ACCOUNT_INACTIVE]: 'Account is deactivated. Please contact support',
      [AuthErrorCodes.EMAIL_NOT_VERIFIED]: 'Please verify your email address to continue',
      [AuthErrorCodes.TOKEN_EXPIRED]: 'Session expired. Please login again',
      [AuthErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
      [AuthErrorCodes.MFA_REQUIRED]: 'Multi-factor authentication required',
      [AuthErrorCodes.INVALID_MFA_CODE]: 'Invalid MFA code. Please try again',
      [AuthErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection',
      [AuthErrorCodes.SERVER_ERROR]: 'Server error. Please try again later'
    };
    
    return errorMessages[errorCode] || originalMessage || 'An error occurred';
  }

  /**
   * Check if error is token expired
   */
  isTokenExpiredError(error) {
    return error.status === 401 || 
           error.message?.includes('expired') || 
           error.message?.includes('TOKEN_EXPIRED');
  }

  /**
   * Event system for authentication state changes
   */
  addEventListener(listener) {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  emitAuthEvent(type, data = {}) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Auth event listener error:', error);
      }
    });

    // Also dispatch DOM event for cross-component communication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authStateChange', {
        detail: event
      }));
    }
  }
}

// Create and export singleton instance
export const unifiedAuthService = new UnifiedAuthService();

// Export validation utilities
export const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  password: (password) => password.length >= 6 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
  required: (value) => value !== null && value !== undefined && value !== '',
  minLength: (value, min) => value && value.length >= min,
  maxLength: (value, max) => value && value.length <= max
};

export const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
};

export default unifiedAuthService;