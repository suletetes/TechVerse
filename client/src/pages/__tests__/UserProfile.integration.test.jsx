import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import UserProfile from '../UserProfile';

// Mock the UserProfileLayout with more realistic behavior
vi.mock('../../components/UserProfile/UserProfileLayout', () => ({
  default: ({ initialTab }) => {
    const activeTab = initialTab || 'profile';
    return (
      <div data-testid="profile-layout">
        <div data-testid="active-tab">{activeTab}</div>
        <div data-testid="tab-content">
          {activeTab === 'orders' && <div data-testid="orders-content">Orders Content</div>}
          {activeTab === 'addresses' && <div data-testid="addresses-content">Addresses Content</div>}
          {activeTab === 'payments' && <div data-testid="payments-content">Payments Content</div>}
          {activeTab === 'activity' && <div data-testid="activity-content">Activity Content</div>}
          {activeTab === 'preferences' && <div data-testid="preferences-content">Preferences Content</div>}
          {activeTab === 'profile' && <div data-testid="profile-content">Profile Content</div>}
        </div>
      </div>
    );
  }
}));

// Mock the UserProfileLayout export from the index file
vi.mock('../../components/UserProfile', () => ({
  UserProfileLayout: ({ initialTab }) => {
    const activeTab = initialTab || 'profile';
    return (
      <div data-testid="profile-layout">
        <div data-testid="active-tab">{activeTab}</div>
        <div data-testid="tab-content">
          {activeTab === 'orders' && <div data-testid="orders-content">Orders Content</div>}
          {activeTab === 'addresses' && <div data-testid="addresses-content">Addresses Content</div>}
          {activeTab === 'payments' && <div data-testid="payments-content">Payments Content</div>}
          {activeTab === 'activity' && <div data-testid="activity-content">Activity Content</div>}
          {activeTab === 'preferences' && <div data-testid="preferences-content">Preferences Content</div>}
          {activeTab === 'profile' && <div data-testid="profile-content">Profile Content</div>}
        </div>
      </div>
    );
  }
}));

describe('UserProfile Integration Tests', () => {
  it('should integrate properly with React Router for orders tab', () => {
    render(
      <MemoryRouter initialEntries={['/user?tab=orders']}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-layout')).toBeInTheDocument();
    expect(screen.getByTestId('active-tab')).toHaveTextContent('orders');
    expect(screen.getByTestId('orders-content')).toBeInTheDocument();
    expect(screen.getByText('Orders Content')).toBeInTheDocument();
  });

  it('should integrate properly with React Router for addresses tab', () => {
    render(
      <MemoryRouter initialEntries={['/user?tab=addresses']}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-layout')).toBeInTheDocument();
    expect(screen.getByTestId('active-tab')).toHaveTextContent('addresses');
    expect(screen.getByTestId('addresses-content')).toBeInTheDocument();
    expect(screen.getByText('Addresses Content')).toBeInTheDocument();
  });

  it('should integrate properly with React Router for payments tab', () => {
    render(
      <MemoryRouter initialEntries={['/user?tab=payments']}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-layout')).toBeInTheDocument();
    expect(screen.getByTestId('active-tab')).toHaveTextContent('payments');
    expect(screen.getByTestId('payments-content')).toBeInTheDocument();
    expect(screen.getByText('Payments Content')).toBeInTheDocument();
  });

  it('should default to profile tab when no tab parameter is provided', () => {
    render(
      <MemoryRouter initialEntries={['/user']}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(screen.getByTestId('profile-layout')).toBeInTheDocument();
    expect(screen.getByTestId('active-tab')).toHaveTextContent('profile');
    expect(screen.getByTestId('profile-content')).toBeInTheDocument();
    expect(screen.getByText('Profile Content')).toBeInTheDocument();
  });

  it('should handle navigation between different tabs', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/user?tab=orders']}>
        <UserProfile />
      </MemoryRouter>
    );

    // Initially shows orders content
    expect(screen.getByTestId('orders-content')).toBeInTheDocument();
    expect(screen.getByText('Orders Content')).toBeInTheDocument();
    unmount();

    // Navigate to addresses tab
    render(
      <MemoryRouter initialEntries={['/user?tab=addresses']}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(screen.getByTestId('addresses-content')).toBeInTheDocument();
    expect(screen.getByText('Addresses Content')).toBeInTheDocument();
  });

  it('should handle all valid tab parameters', () => {
    const validTabs = ['profile', 'orders', 'addresses', 'payments', 'activity', 'preferences'];

    validTabs.forEach(tab => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/user?tab=${tab}`]}>
          <UserProfile />
        </MemoryRouter>
      );

      expect(screen.getByTestId('profile-layout')).toBeInTheDocument();
      expect(screen.getByTestId('active-tab')).toHaveTextContent(tab);
      expect(screen.getByTestId(`${tab}-content`)).toBeInTheDocument();

      unmount();
    });
  });

  it('should handle complex URL scenarios', () => {
    // Test with hash and multiple parameters
    render(
      <MemoryRouter initialEntries={['/user?tab=orders&sort=date&filter=delivered#section']}>
        <UserProfile />
      </MemoryRouter>
    );

    expect(screen.getByTestId('active-tab')).toHaveTextContent('orders');
    expect(screen.getByTestId('orders-content')).toBeInTheDocument();
  });
});