import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext.jsx';
import { NotificationProvider } from '../../context/NotificationContext.jsx';
import authService from '../../api/services/authService.js';

// Mock authService
vi.mock('../../api/services/authService.js', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    verifyMFA: vi.fn(),
    setupMFA: vi.fn(),
    disableMFA: vi.fn(),
    updatePreferences: vi.fn(),
    getUserSessions: vi.fn(),
    revokeSession: vi.fn(),
    refreshToken: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    getSessionExpiry: vi.fn(),
    isSessionValid: vi.fn()
  }
}));

// Mock notification context
const mockShowNotification = vi.fn();
vi.mock('../../context/NotificationContext.jsx', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification
  }),
  NotificationProvider: ({ children }) => children
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <NotificationProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </NotificationProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage
    localStorage.clear();
    // Reset timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.mfaRequired).toBe(false);
    });

    it('should load user on mount if authenticated', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        name: 'Test User',
        isEmailVerified: true
      };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Authentication Actions', () => {
    it('should handle successful login', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        user: { _id: '123', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token',
        sessionExpiry: Date.now() + 3600000
      };

      authService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.login(mockCredentials);
      });

      expect(authService.login).toHaveBeenCalledWith({
        email: mockCredentials.email,
        password: mockCredentials.password
      });
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockShowNotification).toHaveBeenCalledWith('Login successful!', 'success');
    });

    it('should handle login with MFA requirement', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password' };
      const mockResponse = {
        mfaRequired: true,
        mfaToken: 'mfa-token-123'
      };

      authService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      const response = await act(async () => {
        return await result.current.login(mockCredentials);
      });

      expect(response).toEqual(mockResponse);
      expect(result.current.mfaRequired).toBe(true);
      expect(result.current.mfaToken).toBe('mfa-token-123');
    });

    it('should handle login failure and increment attempts', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'wrong' };
      const mockError = new Error('Invalid credentials');

      authService.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        try {
          await result.current.login(mockCredentials);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(result.current.loginAttempts).toBe(1);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should lock account after max login attempts', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'wrong' };
      const mockError = new Error('Invalid credentials');

      authService.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          try {
            await result.current.login(mockCredentials);
          } catch (error) {
            // Expected to fail
          }
        });
      }

      expect(result.current.isLocked).toBe(true);
      expect(result.current.lockoutExpiry).toBeGreaterThan(Date.now());
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Account locked due to multiple failed attempts.',
        'error'
      );
    });

    it('should handle successful registration', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User'
      };
      const mockResponse = {
        user: { _id: '123', ...mockUserData },
        token: 'mock-token'
      };

      authService.register.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.register(mockUserData);
      });

      expect(authService.register).toHaveBeenCalledWith({
        firstName: mockUserData.firstName,
        lastName: mockUserData.lastName,
        email: mockUserData.email,
        password: mockUserData.password
      });
      expect(result.current.user).toEqual(mockResponse.user);
      expect(mockShowNotification).toHaveBeenCalledWith('Registration successful!', 'success');
    });

    it('should handle logout', async () => {
      // First login
      const mockUser = { _id: '123', email: 'test@example.com' };
      authService.login.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password' });
      });

      // Then logout
      authService.logout.mockResolvedValue();

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalledWith({
        reason: 'user_initiated',
        deviceInfo: expect.any(Object)
      });
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockShowNotification).toHaveBeenCalledWith('Logged out successfully', 'info');
    });
  });

  describe('MFA Operations', () => {
    it('should verify MFA successfully', async () => {
      const mockCode = '123456';
      const mockToken = 'mfa-token';
      const mockResponse = {
        user: { _id: '123', email: 'test@example.com' },
        token: 'auth-token'
      };

      authService.verifyMFA.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      // Set MFA required state
      act(() => {
        result.current.mfaRequired = true;
        result.current.mfaToken = mockToken;
      });

      await act(async () => {
        await result.current.verifyMFA(mockCode);
      });

      expect(authService.verifyMFA).toHaveBeenCalledWith(mockCode, mockToken);
      expect(result.current.mfaRequired).toBe(false);
      expect(result.current.mfaToken).toBeNull();
      expect(mockShowNotification).toHaveBeenCalledWith('MFA verification successful!', 'success');
    });

    it('should setup MFA', async () => {
      const mockResponse = { qrCode: 'qr-code-data', secret: 'secret-key' };
      authService.setupMFA.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      const response = await act(async () => {
        return await result.current.setupMFA();
      });

      expect(authService.setupMFA).toHaveBeenCalled();
      expect(response).toEqual(mockResponse);
    });

    it('should disable MFA', async () => {
      const mockPassword = 'password';
      const mockResponse = { success: true };
      authService.disableMFA.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.disableMFA(mockPassword);
      });

      expect(authService.disableMFA).toHaveBeenCalledWith(mockPassword);
      expect(mockShowNotification).toHaveBeenCalledWith('MFA disabled successfully', 'success');
    });
  });

  describe('Profile Management', () => {
    it('should update profile successfully', async () => {
      const mockProfileData = { firstName: 'Updated', lastName: 'Name' };
      const mockResponse = {
        user: { _id: '123', email: 'test@example.com', ...mockProfileData }
      };

      authService.updateProfile.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.updateProfile(mockProfileData);
      });

      expect(authService.updateProfile).toHaveBeenCalledWith(mockProfileData);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(mockShowNotification).toHaveBeenCalledWith('Profile updated successfully', 'success');
    });

    it('should change password successfully', async () => {
      const mockPasswordData = {
        currentPassword: 'old-password',
        newPassword: 'new-password'
      };
      const mockResponse = { success: true };

      authService.changePassword.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.changePassword(mockPasswordData);
      });

      expect(authService.changePassword).toHaveBeenCalledWith(mockPasswordData);
      expect(mockShowNotification).toHaveBeenCalledWith('Password changed successfully', 'success');
    });
  });

  describe('Session Management', () => {
    it('should handle session expiry', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      // Set session expiry in the past
      act(() => {
        result.current.sessionExpiry = Date.now() - 1000;
      });

      // Fast-forward time to trigger session check
      act(() => {
        vi.advanceTimersByTime(60000); // 1 minute
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Your session has expired. Please log in again.',
        'error'
      );
    });

    it('should warn about session expiring soon', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      // Set session expiry to 4 minutes from now (within warning threshold)
      act(() => {
        result.current.sessionExpiry = Date.now() + 4 * 60 * 1000;
        result.current.isAuthenticated = true;
      });

      // Fast-forward time to trigger session check
      act(() => {
        vi.advanceTimersByTime(60000); // 1 minute
      });

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          'Session expiring soon. Please save your work.',
          'warning'
        );
      });
    });

    it('should refresh session', async () => {
      const mockResponse = {
        token: 'new-token',
        sessionExpiry: Date.now() + 3600000
      };

      authService.refreshToken.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(result.current.sessionExpiry).toBe(mockResponse.sessionExpiry);
    });
  });

  describe('Permission Checks', () => {
    it('should check user roles correctly', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      act(() => {
        result.current.user = { _id: '123', role: 'admin' };
        result.current.isAuthenticated = true;
      });

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('user')).toBe(false);
      expect(result.current.isAdmin()).toBe(true);
    });

    it('should check permissions correctly', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      act(() => {
        result.current.permissions = ['read:products', 'write:products'];
      });

      expect(result.current.hasPermission('read:products')).toBe(true);
      expect(result.current.hasPermission('delete:products')).toBe(false);
      expect(result.current.hasAllPermissions(['read:products', 'write:products'])).toBe(true);
      expect(result.current.hasAllPermissions(['read:products', 'delete:products'])).toBe(false);
      expect(result.current.hasAnyPermission(['read:products', 'delete:products'])).toBe(true);
    });

    it('should check if user is fully authenticated', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      // Not authenticated
      expect(result.current.isFullyAuthenticated()).toBe(false);

      // Authenticated but email not verified
      act(() => {
        result.current.isAuthenticated = true;
        result.current.user = { _id: '123', isEmailVerified: false };
      });
      expect(result.current.isFullyAuthenticated()).toBe(false);

      // Authenticated and email verified but MFA required
      act(() => {
        result.current.user = { _id: '123', isEmailVerified: true };
        result.current.mfaRequired = true;
      });
      expect(result.current.isFullyAuthenticated()).toBe(false);

      // Fully authenticated
      act(() => {
        result.current.mfaRequired = false;
      });
      expect(result.current.isFullyAuthenticated()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      act(() => {
        result.current.error = 'Some error';
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      authService.login.mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'password' });
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Activity Tracking', () => {
    it('should update activity on user interaction', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      act(() => {
        result.current.isAuthenticated = true;
      });

      const initialActivity = result.current.lastActivity;

      // Simulate user activity
      act(() => {
        const event = new Event('mousedown');
        document.dispatchEvent(event);
      });

      expect(result.current.lastActivity).toBeGreaterThan(initialActivity);
    });

    it('should check if user is active', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

      act(() => {
        result.current.lastActivity = Date.now();
      });

      expect(result.current.isUserActive()).toBe(true);

      act(() => {
        result.current.lastActivity = Date.now() - 31 * 60 * 1000; // 31 minutes ago
      });

      expect(result.current.isUserActive()).toBe(false);
    });
  });
});