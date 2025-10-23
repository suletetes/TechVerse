import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, optimisticUpdates, invalidateQueries } from '../../lib/queryClient.js';
import { useAuthStore, useAuthToken } from '../../stores/authStore.js';
import { useNotifications } from '../../stores/uiStore.js';

/**
 * Authentication Query Hooks
 * Handles user authentication, profile management, and session queries
 */

// Get current user profile
export const useMe = () => {
  const { token, getAuthHeader } = useAuthToken();
  
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      return response.json();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
  });
};

// Get user session info
export const useSession = () => {
  const { token, getAuthHeader } = useAuthToken();
  
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: async () => {
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch session info');
      }
      
      return response.json();
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 minutes
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { setUser, setTokens } = useAuthStore();
  
  return useMutation({
    mutationFn: async (credentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update auth store
      setUser(data.user);
      setTokens(data.tokens);
      
      // Update query cache
      queryClient.setQueryData(queryKeys.auth.me, data);
      
      // Show success message
      showSuccess(`Welcome back, ${data.user.firstName}!`);
      
      // Prefetch user data
      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.profile,
        queryFn: () => fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${data.tokens.accessToken}` }
        }).then(res => res.json()),
      });
    },
    onError: (error) => {
      showError(error.message || 'Login failed');
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { setUser, setTokens } = useAuthStore();
  
  return useMutation({
    mutationFn: async (userData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update auth store
      setUser(data.user);
      setTokens(data.tokens);
      
      // Update query cache
      queryClient.setQueryData(queryKeys.auth.me, data);
      
      // Show success message
      showSuccess(`Welcome to TechVerse, ${data.user.firstName}!`);
    },
    onError: (error) => {
      showError(error.message || 'Registration failed');
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { showSuccess } = useNotifications();
  const { logout } = useAuthStore();
  
  return useMutation({
    mutationFn: async () => {
      const { getAuthHeader } = useAuthToken.getState();
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      // Don't throw on logout errors - we'll clear local state anyway
      return response.ok ? response.json() : null;
    },
    onSuccess: () => {
      // Clear auth store
      logout();
      
      // Clear all query caches
      queryClient.clear();
      
      // Show success message
      showSuccess('Logged out successfully');
    },
    onError: () => {
      // Still logout on error
      logout();
      queryClient.clear();
      showSuccess('Logged out successfully');
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async (profileData) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }
      
      return response.json();
    },
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.me });
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.profile });
      
      // Snapshot previous values
      const previousMe = queryClient.getQueryData(queryKeys.auth.me);
      const previousProfile = queryClient.getQueryData(queryKeys.auth.profile);
      
      // Optimistically update
      optimisticUpdates.updateProfile(newProfile);
      
      return { previousMe, previousProfile };
    },
    onSuccess: (data) => {
      // Update query cache with server response
      queryClient.setQueryData(queryKeys.auth.me, (old) => ({
        ...old,
        user: data.user,
      }));
      
      queryClient.setQueryData(queryKeys.auth.profile, data.user);
      
      // Update auth store
      useAuthStore.getState().setUser(data.user);
      
      showSuccess('Profile updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousMe) {
        queryClient.setQueryData(queryKeys.auth.me, context.previousMe);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(queryKeys.auth.profile, context.previousProfile);
      }
      
      showError(error.message || 'Profile update failed');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async (passwordData) => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password change failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Password changed successfully');
    },
    onError: (error) => {
      showError(error.message || 'Password change failed');
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  const { showSuccess, showError } = useNotifications();
  
  return useMutation({
    mutationFn: async (email) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Password reset email sent. Please check your inbox.');
    },
    onError: (error) => {
      showError(error.message || 'Failed to send reset email');
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  const { showSuccess, showError } = useNotifications();
  
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Password reset successfully. You can now login with your new password.');
    },
    onError: (error) => {
      showError(error.message || 'Password reset failed');
    },
  });
};

// Refresh session mutation
export const useRefreshSession = () => {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/session/refresh', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate session query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
};

// Verify email mutation
export const useVerifyEmail = () => {
  const { showSuccess, showError } = useNotifications();
  
  return useMutation({
    mutationFn: async (token) => {
      const response = await fetch(`/api/auth/verify-email/${token}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Email verification failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Email verified successfully!');
      // Invalidate user data to refetch updated verification status
      invalidateQueries.auth();
    },
    onError: (error) => {
      showError(error.message || 'Email verification failed');
    },
  });
};

// Resend verification email mutation
export const useResendVerification = () => {
  const { showSuccess, showError } = useNotifications();
  
  return useMutation({
    mutationFn: async (email) => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resend verification email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Verification email sent. Please check your inbox.');
    },
    onError: (error) => {
      showError(error.message || 'Failed to resend verification email');
    },
  });
};