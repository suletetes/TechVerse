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

describe('UserProfile Component', () => {
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

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithRouter(<UserProfile />);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should render UserProfileLayout component', () => {
      renderWithRouter(<UserProfile />);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
      expect(screen.getByTestId('initial-tab')).toBeInTheDocument();
    });

    it('should handle different URL paths', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle URL without query parameters', () => {
      renderWithRouter(<UserProfile />, ['/user']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });

    it('should handle complex URLs', () => {
      renderWithRouter(<UserProfile />, ['/user?tab=orders&other=value']);
      expect(screen.getByTestId('user-profile-layout')).toBeInTheDocument();
    });
  });
});