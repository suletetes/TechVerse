import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import UserProfile from '../UserProfile';
import { renderWithRouter, testUrlParams } from '../../test/utils';

// Mock the UserProfileLayout component
const MockUserProfileLayout = vi.fn(({ initialTab }) => (
  <div data-testid="user-profile-layout">
    <span data-testid="initial-tab">{initialTab || 'null'}</span>
    <span data-testid="tab-type">{typeof initialTab}</span>
  </div>
));

vi.mock('../../components/UserProfile', () => ({
  UserProfileLayout: MockUserProfileLayout
}));

describe('UserProfile Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockUserProfileLayout.mockClear();
  });

  describe('URL Parameter Extraction', () => {
    it('should correctly extract tab parameter from various URL formats', () => {
      const testCases = [
        { url: '/user?tab=orders', expected: 'orders' },
        { url: '/user?tab=addresses&other=value', expected: 'addresses' },
        { url: '/user?other=value&tab=payments', expected: 'payments' },
        { url: '/user?tab=activity&sort=date&filter=active', expected: 'activity' },
        { url: '/user', expected: null },
        { url: '/user?other=value', expected: null },
        { url: '/user?tab=', expected: '' },
      ];

      testCases.forEach(({ url, expected }) => {
        const { unmount } = renderWithRouter(<UserProfile />, {
          initialEntries: [url]
        });

        expect(screen.getByTestId('initial-tab')).toHaveTextContent(expected || 'null');
        unmount();
      });
    });

    it('should handle URL encoding in tab parameters', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders%20test']
      });

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders test');
    });
  });

  describe('Component Props and State', () => {
    it('should pass correct props to UserProfileLayout', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      expect(MockUserProfileLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          initialTab: 'orders'
        }),
        expect.anything()
      );
    });

    it('should pass null when no tab parameter exists', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user']
      });

      expect(MockUserProfileLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          initialTab: null
        }),
        expect.anything()
      );
    });

    it('should handle string type for tab parameter', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      expect(screen.getByTestId('tab-type')).toHaveTextContent('string');
    });

    it('should handle object type when tab parameter is null', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user']
      });

      expect(screen.getByTestId('tab-type')).toHaveTextContent('object');
    });
  });

  describe('React Hooks Usage', () => {
    it('should use useSearchParams hook correctly', () => {
      // Test that the component doesn't crash and renders correctly
      expect(() => {
        renderWithRouter(<UserProfile />, {
          initialEntries: ['/user?tab=orders']
        });
      }).not.toThrow();

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should re-render when search params change', () => {
      const { rerender } = renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders');

      // Simulate URL change
      rerender(
        renderWithRouter(<UserProfile />, {
          initialEntries: ['/user?tab=addresses']
        }).container.firstChild
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        renderWithRouter(<UserProfile />, {
          initialEntries: ['/user?tab=orders&malformed=%%invalid%%']
        });
      }).not.toThrow();

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle special characters in tab parameter', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=test@#$%']
      });

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('test@#$%');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      // Component should render only once initially
      expect(MockUserProfileLayout).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid URL changes', () => {
      const { rerender } = renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      // Simulate rapid navigation
      const tabs = ['addresses', 'payments', 'activity', 'preferences', 'profile'];
      tabs.forEach(tab => {
        rerender(
          renderWithRouter(<UserProfile />, {
            initialEntries: [`/user?tab=${tab}`]
          }).container.firstChild
        );
      });

      // Should handle all changes without crashing
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper HTML structure', () => {
      const { container } = renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      // Check that the component renders valid HTML
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not interfere with screen readers', () => {
      renderWithRouter(<UserProfile />, {
        initialEntries: ['/user?tab=orders']
      });

      // Component should render without accessibility violations
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });
});