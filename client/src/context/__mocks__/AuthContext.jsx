import { vi } from 'vitest';

export const useAuth = vi.fn(() => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  mfaRequired: false,
  login: vi.fn().mockResolvedValue({}),
  logout: vi.fn().mockResolvedValue({}),
  hasRole: vi.fn().mockReturnValue(false),
  hasPermission: vi.fn().mockReturnValue(false),
  hasAllPermissions: vi.fn().mockReturnValue(false),
  hasAnyPermission: vi.fn().mockReturnValue(false)
}));

export const AuthProvider = ({ children }) => children;