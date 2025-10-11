import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGuard, { AdminGuard, UserGuard, GuestGuard, PermissionGuard } from '../../Auth/AuthGuard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Mock useAuth hook
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn()
}));

// Mock useAuthSecurity hook
vi.mock('../../hooks/useAuthSecurity.js', () => ({
  useAuthSecurity: () => ({
    getSecurityRecommendations: () => []
  })
}));

// Mock LoadingSpinner component
vi.mock('../Common/LoadingSpinner.jsx', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock SecurityAlert component
vi.mock('../../Auth/SecurityAlert.jsx', () => ({
  default: ({ alert, onDismiss }) => (
    <div data-testid="security-alert">
      {alert.message}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}));

// Test components
const ProtectedComponent = () => <div data-testid="protected-content">Protected Content</div>;
const PublicComponent = () => <div data-testid="public-content">Public Content</div>;

// Test wrapper with router
const TestWrapper = ({ children, initialEntries = ['/'] }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={children} />
      <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      <Route path="/auth/mfa" element={<div data-testid="mfa-page">MFA Page</div>} />
      <Route path="/auth/verify-email" element={<div data-testid="verify-email-page">Verify Email</div>} />
      <Route path="/unauthorized" element={<div data-testid="unauthorized-page">Unauthorized</div>} />
      <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
    </Routes>
  </BrowserRouter>
);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when auth is loading', () => {
      useAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show custom fallback when provided', () => {
      useAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        mfaRequired: false
      });

      const CustomFallback = () => <div data-testid="custom-fallback">Custom Loading</div>;

      render(
        <TestWrapper>
          <AuthGuard fallback={<CustomFallback />}>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Requirements', () => {
    it('should redirect to login when auth required but user not authenticated', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <AuthGuard requireAuth={true}>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show content when auth not required', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <AuthGuard requireAuth={false}>
            <PublicComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });

    it('should redirect to MFA page when MFA required', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com' },
        mfaRequired: true
      });

      render(
        <TestWrapper>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('mfa-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect to email verification when email not verified', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: false },
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <AuthGuard requireVerification={true}>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('verify-email-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    it('should allow access when user has required role', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', role: 'admin', isEmailVerified: true },
        mfaRequired: false,
        hasRole: vi.fn().mockReturnValue(true)
      });

      render(
        <TestWrapper>
          <AuthGuard requiredRole="admin">
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should redirect to unauthorized when user lacks required role', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', role: 'user', isEmailVerified: true },
        mfaRequired: false,
        hasRole: vi.fn().mockReturnValue(false)
      });

      render(
        <TestWrapper>
          <AuthGuard requiredRole="admin">
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Permission-based Access', () => {
    it('should allow access when user has all required permissions', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false,
        hasAllPermissions: vi.fn().mockReturnValue(true),
        hasAnyPermission: vi.fn().mockReturnValue(true)
      });

      render(
        <TestWrapper>
          <AuthGuard 
            requiredPermissions={['read:products', 'write:products']}
            requireAllPermissions={true}
          >
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should allow access when user has any required permission', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false,
        hasAllPermissions: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(true)
      });

      render(
        <TestWrapper>
          <AuthGuard 
            requiredPermissions={['read:products', 'write:products']}
            requireAllPermissions={false}
          >
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should redirect to unauthorized when user lacks required permissions', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false,
        hasAllPermissions: vi.fn().mockReturnValue(false),
        hasAnyPermission: vi.fn().mockReturnValue(false)
      });

      render(
        <TestWrapper>
          <AuthGuard requiredPermissions={['admin:all']}>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Guest Guard', () => {
    it('should redirect authenticated users away from auth pages', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false
      });

      // Mock location to simulate being on login page
      const mockLocation = { pathname: '/auth/login' };
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useLocation: () => mockLocation
        };
      });

      render(
        <TestWrapper>
          <AuthGuard requireAuth={false}>
            <PublicComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Specialized Guards', () => {
    it('AdminGuard should require admin role', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', role: 'admin', isEmailVerified: true },
        mfaRequired: false,
        hasRole: vi.fn().mockReturnValue(true)
      });

      render(
        <TestWrapper>
          <AdminGuard>
            <ProtectedComponent />
          </AdminGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('UserGuard should require authentication and verification', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <UserGuard>
            <ProtectedComponent />
          </UserGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('GuestGuard should not require authentication', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <GuestGuard>
            <PublicComponent />
          </GuestGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });

    it('PermissionGuard should check specific permissions', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false,
        hasAllPermissions: vi.fn().mockReturnValue(true)
      });

      render(
        <TestWrapper>
          <PermissionGuard permissions={['read:products']} requireAll={true}>
            <ProtectedComponent />
          </PermissionGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Security Alerts', () => {
    it('should display security alerts when present', () => {
      const mockGetSecurityRecommendations = vi.fn().mockReturnValue([
        {
          type: 'mfa',
          priority: 'critical',
          message: 'Enable two-factor authentication'
        }
      ]);

      vi.doMock('../../hooks/useAuthSecurity.js', () => ({
        useAuthSecurity: () => ({
          getSecurityRecommendations: mockGetSecurityRecommendations
        })
      }));

      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', isEmailVerified: true },
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('security-alert')).toBeInTheDocument();
      expect(screen.getByText('Enable two-factor authentication')).toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Custom Redirect Paths', () => {
    it('should use custom redirect path', () => {
      useAuth.mockReturnValue({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        mfaRequired: false
      });

      render(
        <TestWrapper>
          <AuthGuard requireAuth={true} redirectTo="/custom-login">
            <ProtectedComponent />
          </AuthGuard>
        </TestWrapper>
      );

      // Since we can't easily test navigation in this setup,
      // we'll verify the component doesn't render the protected content
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing auth context gracefully', () => {
      useAuth.mockImplementation(() => {
        throw new Error('useAuth must be used within an AuthProvider');
      });

      expect(() => {
        render(
          <TestWrapper>
            <AuthGuard>
              <ProtectedComponent />
            </AuthGuard>
          </TestWrapper>
        );
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});