import BaseApiService from '../core/BaseApiService.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { API_ENDPOINTS } from '../config.js';

class AuthService extends BaseApiService {
  constructor() {
    super({
      serviceName: 'AuthService',
      endpoints: API_ENDPOINTS.AUTH,
      cacheEnabled: false, // Auth operations shouldn't be cached
      retryEnabled: true
    });
  }
  // Register new user
  async register(userData) {
    const result = await this.create(this.endpoints.REGISTER, userData);

    if (result.success && result.data?.token) {
      tokenManager.setToken(result.data.token);
      if (result.data.refreshToken) {
        tokenManager.setRefreshToken(result.data.refreshToken);
      }
    }

    return result;
  }

  // Login user with enhanced security
  async login(credentials) {
    const result = await this.create(this.endpoints.LOGIN, credentials);

    if (result.success && result.data?.tokens && !result.data.mfaRequired) {
      const { tokens, user, security } = result.data;

      // Store tokens with enhanced security
      tokenManager.setToken(
        tokens.accessToken,
        tokens.expiresIn,
        tokens.sessionId
      );

      if (tokens.refreshToken) {
        tokenManager.setRefreshToken(tokens.refreshToken);
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

      console.log('Login successful', {
        userId: user._id,
        role: user.role,
        sessionId: tokens.sessionId?.substring(0, 8) + '...',
        expiresAt: tokens.expiresAt
      });
    }

    return result;
  }

  // Logout user with session cleanup
  async logout(logoutData = {}) {
    try {
      await this.create(this.endpoints.LOGOUT, logoutData);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error.message);
    } finally {
      tokenManager.clearTokens();
      localStorage.removeItem('session_expiry');
      localStorage.removeItem('user_preferences');
    }
  }

  // Get user profile
  async getProfile() {
    return this.read(this.endpoints.PROFILE);
  }

  // Update user profile
  async updateProfile(profileData) {
    return this.update(this.endpoints.PROFILE, profileData);
  }

  // Change password
  async changePassword(passwordData) {
    return this.create(this.endpoints.CHANGE_PASSWORD, passwordData);
  }

  // Forgot password
  async forgotPassword(email) {
    return this.create(this.endpoints.FORGOT_PASSWORD, { email });
  }

  // Reset password
  async resetPassword(token, password) {
    return this.create(this.endpoints.RESET_PASSWORD, { token, password });
  }

  // Verify email
  async verifyEmail(token) {
    return this.read(`${this.endpoints.VERIFY_EMAIL}/${token}`);
  }

  // Resend verification email
  async resendVerification(email) {
    return this.create(this.endpoints.RESEND_VERIFICATION, { email });
  }

  // MFA Methods
  async verifyMFA(code, mfaToken) {
    const result = await this.create(this.endpoints.VERIFY_MFA, {
      code,
      mfaToken
    });

    if (result.success && result.data?.token) {
      tokenManager.setToken(result.data.token);
      if (result.data.refreshToken) {
        tokenManager.setRefreshToken(result.data.refreshToken);
      }
    }

    return result;
  }

  async setupMFA() {
    return this.create(this.endpoints.SETUP_MFA);
  }

  async disableMFA(password) {
    return this.create(this.endpoints.DISABLE_MFA, { password });
  }

  async resendMFA() {
    return this.create(this.endpoints.RESEND_MFA);
  }

  // User preferences
  async updatePreferences(preferences) {
    const result = await this.update(this.endpoints.PREFERENCES, preferences);

    // Cache preferences locally on success
    if (result.success) {
      localStorage.setItem('user_preferences', JSON.stringify(preferences));
    }

    return result;
  }

  async getPreferences() {
    try {
      return await this.read(this.endpoints.PREFERENCES);
    } catch (error) {
      // Fallback to cached preferences
      const cached = localStorage.getItem('user_preferences');
      return {
        success: true,
        data: cached ? JSON.parse(cached) : {}
      };
    }
  }

  // Session management
  async getUserSessions() {
    return this.read(this.endpoints.SESSIONS);
  }

  async revokeSession(sessionId) {
    return this.delete(`${this.endpoints.SESSIONS}/${sessionId}`);
  }

  async refreshToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const result = await this.create(this.endpoints.REFRESH, {
      refreshToken
    });

    if (result.success && result.data?.tokens) {
      const { tokens, user } = result.data;

      // Update tokens with enhanced security
      tokenManager.setToken(
        tokens.accessToken,
        tokens.expiresIn,
        tokens.sessionId
      );

      if (tokens.refreshToken) {
        tokenManager.setRefreshToken(tokens.refreshToken);
      }

      // Update user data and permissions
      if (user) {
        localStorage.setItem('techverse_user', JSON.stringify(user));
        if (user.permissions) {
          localStorage.setItem('techverse_permissions', JSON.stringify(user.permissions));
        }
      }

      // Update session expiry
      if (tokens.expiresAt) {
        localStorage.setItem('session_expiry', new Date(tokens.expiresAt).getTime().toString());
      }

      console.log('Token refreshed successfully', {
        sessionId: tokens.sessionId?.substring(0, 8) + '...',
        expiresAt: tokens.expiresAt
      });
    }

    return result;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = tokenManager.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }

  // Get current user from token (basic decode - for UI purposes only)
  getCurrentUser() {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || []
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // Get session expiry
  getSessionExpiry() {
    const expiry = localStorage.getItem('session_expiry');
    return expiry ? parseInt(expiry) : null;
  }

  // Check if session is valid
  isSessionValid() {
    const expiry = this.getSessionExpiry();
    return expiry ? expiry > Date.now() : false;
  }
}

export default new AuthService();