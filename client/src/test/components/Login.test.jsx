/**
 * Login Component Tests
 * Tests for login form validation and submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/auth/Login';
import { AuthProvider } from '../../context/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    renderLogin();

    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
      expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid credentials', async () => {
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login|sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check if form submission was attempted
      expect(submitButton).toBeDisabled();
    });
  });

  it('should show/hide password when toggle is clicked', () => {
    renderLogin();

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /show|hide password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should have link to signup page', () => {
    renderLogin();

    const signupLink = screen.getByRole('link', { name: /sign up|create account/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should have link to forgot password page', () => {
    renderLogin();

    const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });
});
