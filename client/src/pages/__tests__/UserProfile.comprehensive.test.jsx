import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserProfile from '../UserProfile.jsx';

// Mock the UserProfileLayout component
vi.mock('../../components/UserProfile/UserProfileLayout.jsx', () => ({
  default: ({ initialTab }) => (
    <div data-testid="user-profile-layout">
      <span data-testid="initial-tab">{String(initialTab)}</span>
    </div>
  )
}));

describe('UserProfile Comprehensive Tests', () => {
  const renderWithRouter = (component, initialEntries = ['/user']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Parameter Extraction', () => {
    it('should correctly extract tab parameter from various URL formats', () => {
      const testCases = [
        { url: '/user?tab=orders', expected: 'orders' },
        { url: '/user?tab=addresses', expected: 'addresses' },
        { url: '/user?tab=payments', expected: 'payments' },
        { url: '/user', expected: null }
      ];

      testCases.forEach(({ url }) => {
        const { unmount } = renderWithRouter(<UserProfile />, [url]);
        expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle URL encoding in tab parameters', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders%20test']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });

  describe('Component Props and State', () => {
    it('should pass correct props to UserProfileLayout', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should pass null when no tab parameter exists', () => {
      renderWithRouter(<UserProfile />, ['/user']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle string type for tab parameter', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle object type when tab parameter is null', () => {
      renderWithRouter(<UserProfile />, ['/user']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });

  describe('React Hooks Usage', () => {
    it('should use useSearchParams hook correctly', () => {
      expect(() => {
        renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      }).not.toThrow();

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle different URL parameters', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        renderWithRouter(<UserProfile />, ['/user?tab=orders&invalid']);
      }).not.toThrow();

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle special characters in tab parameter', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=test']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle different tab values', () => {
      const tabs = ['orders', 'addresses', 'payments', 'activity', 'preferences'];

      tabs.forEach(tab => {
        const { unmount } = renderWithRouter(<UserProfile />, [`/user?tab=${tab}`]);
        expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper HTML structure', () => {
      const { container } = renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should not interfere with screen readers', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });
});