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
  
  // Login user
  async login(credentials) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    const data = await handleApiResponse(response);
    
    if (data.token) {
      tokenManager.setToken(data.token);
      if (data.refreshToken) {
        tokenManager.setRefreshToken(data.refreshToken);
      }
    }
    
    return data;
  }
  
  // Logout user
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error.message);
    } finally {
      tokenManager.clearTokens();
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
    const response = await apiClient.post('/auth/resend-verification', { email });
    return handleApiResponse(response);
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!tokenManager.getToken();
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
        role: payload.role
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}

export default new AuthService();