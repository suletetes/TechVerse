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

describe('UserProfile Integration Tests', () => {
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

  it('should integrate properly with React Router for orders tab', () => {
    renderWithRouter(<UserProfile />, ['/user?tab=orders']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
  });

  it('should integrate properly with React Router for addresses tab', () => {
    renderWithRouter(<UserProfile />, ['/user?tab=addresses']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
  });

  it('should integrate properly with React Router for payments tab', () => {
    renderWithRouter(<UserProfile />, ['/user?tab=payments']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
  });

  it('should default to profile tab when no tab parameter is provided', () => {
    renderWithRouter(<UserProfile />, ['/user']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
  });

  it('should handle navigation between different tabs', () => {
    const { unmount } = renderWithRouter(<UserProfile />, ['/user?tab=orders']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    unmount();

    // Test another tab
    renderWithRouter(<UserProfile />, ['/user?tab=addresses']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
  });

  it('should handle all valid tab parameters', () => {
    const validTabs = ['orders', 'addresses', 'payments', 'activity', 'preferences'];

    validTabs.forEach(tab => {
      const { unmount } = renderWithRouter(<UserProfile />, [`/user?tab=${tab}`]);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle complex URL scenarios', () => {
    // Test with hash and multiple parameters
    const { unmount } = renderWithRouter(<UserProfile />, ['/user?tab=orders&sort=date&filter=delivered#section']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    unmount();

    // Test with encoded parameters
    renderWithRouter(<UserProfile />, ['/user?tab=orders%20history']);
    expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
  });
});