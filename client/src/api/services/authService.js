import { apiClient, handleApiResponse, tokenManager } from '../interceptors/index.js';
import { API_ENDPOINTS } from '../config.js';

class AuthService {
  // Register new user
  async register(userData) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    const data = await handleApiResponse(response);
    
    if (data.token) {
      tokenManager.setToken(data.token);
      if (data.refreshToken) {
        tokenManager.setRefreshToken(data.refreshToken);
      }
    }
    
    return data;
  }
  
  // Login user with enhanced security
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const data = await handleApiResponse(response);
    
    if (data.success && data.data?.tokens && !data.mfaRequired) {
      const { tokens, user, security } = data.data;
      
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
    
    return data;
  }
  
  // Logout user with session cleanup
  async logout(logoutData = {}) {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, logoutData);
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
    const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
    return handleApiResponse(response);
  }
  
  // Update user profile
  async updateProfile(profileData) {
    const response = await apiClient.put(API_ENDPOINTS.AUTH.PROFILE, profileData);
    return handleApiResponse(response);
  }
  
  // Change password
  async changePassword(passwordData) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
    return handleApiResponse(response);
  }
  
  // Forgot password
  async forgotPassword(email) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    return handleApiResponse(response);
  }
  
  // Reset password
  async resetPassword(token, password) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
    return handleApiResponse(response);
  }
  
  // Verify email
  async verifyEmail(token) {
    const response = await apiClient.get(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}/${token}`);
    return handleApiResponse(response);
  }
  
  // Resend verification email
  async resendVerification(email) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
    return handleApiResponse(response);
  }

  // MFA Methods
  async verifyMFA(code, mfaToken) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_MFA, { 
      code, 
      mfaToken 
    });
    const data = await handleApiResponse(response);
    
    if (data.token) {
      tokenManager.setToken(data.token);
      if (data.refreshToken) {
        tokenManager.setRefreshToken(data.refreshToken);
      }
    }
    
    return data;
  }

  async setupMFA() {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.SETUP_MFA);
    return handleApiResponse(response);
  }

  async disableMFA(password) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.DISABLE_MFA, { password });
    return handleApiResponse(response);
  }

  async resendMFA() {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_MFA);
    return handleApiResponse(response);
  }

  // User preferences
  async updatePreferences(preferences) {
    const response = await apiClient.put(API_ENDPOINTS.AUTH.PREFERENCES, preferences);
    const data = await handleApiResponse(response);
    
    // Cache preferences locally
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    
    return data;
  }

  async getPreferences() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.PREFERENCES);
      return handleApiResponse(response);
    } catch (error) {
      // Fallback to cached preferences
      const cached = localStorage.getItem('user_preferences');
      return cached ? JSON.parse(cached) : {};
    }
  }

  // Session management
  async getUserSessions() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.SESSIONS);
    return handleApiResponse(response);
  }

  async revokeSession(sessionId) {
    const response = await apiClient.delete(`${API_ENDPOINTS.AUTH.SESSIONS}/${sessionId}`);
    return handleApiResponse(response);
  }

  async refreshToken() {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { 
      refreshToken 
    });
    const data = await handleApiResponse(response);
    
    if (data.success && data.data?.tokens) {
      const { tokens, user } = data.data;
      
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
    
    return data;
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