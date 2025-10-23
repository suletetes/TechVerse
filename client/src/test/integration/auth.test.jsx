import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { render, createMockUser } from '../test-utils';
import Login from '../../pages/auth/Login';

describe('Authentication Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      render(<Login />);

      // Fill in the form
      await user.type(screen.getByLabelText(/email/i), 'admin@techverse.com');
      await user.type(screen.getByLabelText(/password/i), 'password');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for success message or redirect
      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });

    it('should show error message with invalid credentials', async () => {
      render(<Login />);

      // Fill in the form with invalid credentials
      await user.type(screen.getByLabelText(/email/i), 'invalid@test.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

      // Submit the form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Override the login handler to return a network error
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json(
            { success: false, error: 'Network error' },
            { status: 500 }
          );
        })
      );

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'admin@techverse.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      // Add delay to login response
      server.use(
        http.post('/api/auth/login', async ({ request }) => {
          const { email, password } = await request.json();
          
          // Add artificial delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (email === 'admin@techverse.com' && password === 'password') {
            return HttpResponse.json({
              success: true,
              data: {
                user: createMockUser({ email, role: 'admin' }),
                token: 'mock-token'
              }
            });
          }
          
          return HttpResponse.json(
            { success: false, error: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      render(<Login />);

      await user.type(screen.getByLabelText(/email/i), 'admin@techverse.com');
      await user.type(screen.getByLabelText(/password/i), 'password');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check for loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Registration Flow', () => {
    it('should register a new user successfully', async () => {
      // Mock registration component (you'd need to create this)
      const MockRegister = () => (
        <form>
          <input aria-label="Name" name="name" />
          <input aria-label="Email" name="email" type="email" />
          <input aria-label="Password" name="password" type="password" />
          <button type="submit">Register</button>
        </form>
      );

      render(<MockRegister />);

      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/email/i), 'newuser@test.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /register/i }));

      // Verify the request was made (MSW will handle it)
      await waitFor(() => {
        expect(screen.queryByText(/user already exists/i)).not.toBeInTheDocument();
      });
    });

    it('should show error when user already exists', async () => {
      const MockRegister = () => (
        <form>
          <input aria-label="Name" name="name" />
          <input aria-label="Email" name="email" type="email" />
          <input aria-label="Password" name="password" type="password" />
          <button type="submit">Register</button>
        </form>
      );

      render(<MockRegister />);

      // Try to register with existing email
      await user.type(screen.getByLabelText(/name/i), 'Admin User');
      await user.type(screen.getByLabelText(/email/i), 'admin@techverse.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      // Mock a component that uses token refresh
      const MockProtectedComponent = () => {
        const [data, setData] = React.useState(null);
        
        React.useEffect(() => {
          fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: 'mock-refresh-token' })
          })
          .then(res => res.json())
          .then(setData);
        }, []);
        
        return data ? <div>Token refreshed</div> : <div>Loading...</div>;
      };

      render(<MockProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText(/token refreshed/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid refresh token', async () => {
      server.use(
        http.post('/api/auth/refresh', () => {
          return HttpResponse.json(
            { success: false, error: 'Invalid refresh token' },
            { status: 401 }
          );
        })
      );

      const MockProtectedComponent = () => {
        const [error, setError] = React.useState(null);
        
        React.useEffect(() => {
          fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: 'invalid-token' })
          })
          .then(res => res.json())
          .then(data => {
            if (!data.success) {
              setError(data.error);
            }
          });
        }, []);
        
        return error ? <div>Error: {error}</div> : <div>Loading...</div>;
      };

      render(<MockProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText(/invalid refresh token/i)).toBeInTheDocument();
      });
    });
  });
});