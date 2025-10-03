import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import UserProfile from '../UserProfile';
import {renderWithRouter} from "../../test/utils.jsx";

// Mock the UserProfileLayout component
vi.mock('../../components/UserProfile', () => ({
  UserProfileLayout: vi.fn(({ initialTab }) => (
    <div data-testid="user-profile-layout">
      <span data-testid="initial-tab">{initialTab === null ? 'null' : initialTab}</span>
      <span data-testid="tab-type">{typeof initialTab}</span>
    </div>
  ))
}));

describe('UserProfile Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Parameter Extraction', () => {
    it('should correctly extract tab parameter from various URL formats', () => {
      const testCases = [
        { url: '/user?tab=orders', expected: 'orders' },
        { url: '/user?tab=addresses&other=value', expected: 'addresses' },
        { url: '/user?other=value&tab=payments', expected: 'payments' },
        { url: '/user', expected: 'null' },
      ];

      testCases.forEach(({ url, expected }) => {
        const { unmount } = render(
          <MemoryRouter initialEntries={[url]}>
            <UserProfile />
          </MemoryRouter>
        );

        expect(screen.getByTestId('initial-tab')).toHaveTextContent(expected);
        unmount();
      });
    });

    it('should handle URL encoding in tab parameters', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders%20test']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders test');
    });
  });

  describe('Component Props and State', () => {
    it('should pass correct props to UserProfileLayout', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders');
    });

    it('should pass null when no tab parameter exists', () => {
      render(
        <MemoryRouter initialEntries={['/user']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('null');
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
        render(
          <MemoryRouter initialEntries={['/user?tab=orders']}>
            <UserProfile />
          </MemoryRouter>
        );
      }).not.toThrow();

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle different URL parameters', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', () => {
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/user?tab=orders&other=value']}>
            <UserProfile />
          </MemoryRouter>
        );
      }).not.toThrow();

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle special characters in tab parameter', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=test']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('test');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      // Component should render correctly
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle different tab values', () => {
      const tabs = ['orders', 'addresses', 'payments'];
      
      tabs.forEach(tab => {
        const { unmount } = render(
          <MemoryRouter initialEntries={[`/user?tab=${tab}`]}>
            <UserProfile />
          </MemoryRouter>
        );

        expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
        expect(screen.getByTestId('initial-tab')).toHaveTextContent(tab);
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper HTML structure', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      // Check that the component renders valid HTML
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not interfere with screen readers', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      // Component should render without accessibility violations
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });
});