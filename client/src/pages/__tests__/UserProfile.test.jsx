import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import UserProfile from '../UserProfile';

// Mock the UserProfileLayout component
vi.mock('../../components/UserProfile', () => ({
  UserProfileLayout: vi.fn(({ initialTab }) => (
    <div data-testid="user-profile-layout">
      <span data-testid="initial-tab">{initialTab || 'null'}</span>
    </div>
  ))
}));

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('URL Parameter Handling', () => {
    it('should render UserProfileLayout with null initialTab when no tab parameter', () => {
      render(
        <MemoryRouter initialEntries={['/user']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
      expect(screen.getByTestId('initial-tab')).toHaveTextContent('null');
    });

    it('should pass tab parameter to UserProfileLayout when tab=orders', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders');
    });

    it('should pass tab parameter to UserProfileLayout when tab=addresses', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=addresses']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('addresses');
    });

    it('should pass tab parameter to UserProfileLayout when tab=payments', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=payments']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('payments');
    });

    it('should pass tab parameter to UserProfileLayout when tab=activity', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=activity']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('activity');
    });

    it('should pass tab parameter to UserProfileLayout when tab=preferences', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=preferences']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('preferences');
    });
  });

  describe('Multiple URL Parameters', () => {
    it('should handle tab parameter when other parameters are present', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders&other=value']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders');
    });

    it('should handle tab parameter in different positions', () => {
      render(
        <MemoryRouter initialEntries={['/user?other=value&tab=addresses&more=data']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('addresses');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tab parameter', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('');
    });

    it('should handle invalid tab parameter', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=invalid']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('invalid');
    });

    it('should handle URL without query parameters', () => {
      render(
        <MemoryRouter initialEntries={['/user']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('null');
    });
  });

  describe('Component Structure', () => {
    it('should always render UserProfileLayout component', () => {
      render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      expect(() => {
        render(
          <MemoryRouter initialEntries={['/user']}>
            <UserProfile />
          </MemoryRouter>
        );
      }).not.toThrow();
    });
  });

  describe('React Router Integration', () => {
    it('should work with BrowserRouter', () => {
      // Mock window.location for this test
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, search: '?tab=orders' };

      render(
        <BrowserRouter>
          <UserProfile />
        </BrowserRouter>
      );

      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();

      // Restore original location
      window.location = originalLocation;
    });

    it('should handle navigation state changes', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/user?tab=orders']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('orders');

      // Simulate navigation to different tab
      rerender(
        <MemoryRouter initialEntries={['/user?tab=addresses']}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('initial-tab')).toHaveTextContent('addresses');
    });
  });
});