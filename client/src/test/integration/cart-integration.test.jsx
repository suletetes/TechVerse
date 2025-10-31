import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';
import Cart from '../../pages/Cart';
import ProductCard from '../../components/Product/ProductCard';
import { server } from '../../mocks/server';
import { rest } from 'msw';

// Test wrapper component
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Cart Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock authenticated user
    server.use(
      rest.get('/api/auth/me', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            data: {
              user: {
                _id: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
              }
            }
          })
        );
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Add to Cart Flow', () => {
    it('should add product to cart from product card', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Gaming Laptop',
        price: 1299.99,
        images: [{ url: '/laptop.jpg', isPrimary: true }],
        stock: { quantity: 5, trackQuantity: true },
        status: 'active'
      };

      // Mock API responses
      server.use(
        rest.post('/api/cart/add', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                cart: {
                  items: [{
                    _id: 'item123',
                    product: mockProduct,
                    quantity: 1,
                    price: 1299.99
                  }],
                  subtotal: 1299.99,
                  total: 1299.99,
                  itemCount: 1
                }
              }
            })
          );
        }),
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                cart: {
                  items: [{
                    _id: 'item123',
                    product: mockProduct,
                    quantity: 1,
                    price: 1299.99
                  }],
                  subtotal: 1299.99,
                  total: 1299.99,
                  itemCount: 1
                }
              }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      // Find and click add to cart button
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addToCartButton).toBeInTheDocument();

      await user.click(addToCartButton);

      // Wait for success feedback
      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
      });
    });

    it('should handle out of stock products', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Out of Stock Product',
        price: 99.99,
        images: [{ url: '/product.jpg', isPrimary: true }],
        stock: { quantity: 0, trackQuantity: true },
        status: 'active'
      };

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      // Add to cart button should be disabled
      const addToCartButton = screen.getByRole('button', { name: /out of stock/i });
      expect(addToCartButton).toBeDisabled();
    });

    it('should handle API errors gracefully', async () => {
      const mockProduct = {
        _id: 'product123',
        name: 'Gaming Laptop',
        price: 1299.99,
        images: [{ url: '/laptop.jpg', isPrimary: true }],
        stock: { quantity: 5, trackQuantity: true },
        status: 'active'
      };

      // Mock API error
      server.use(
        rest.post('/api/cart/add', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success: false,
              message: 'Insufficient stock'
            })
          );
        })
      );

      render(
        <TestWrapper>
          <ProductCard product={mockProduct} />
        </TestWrapper>
      );

      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cart Page Functionality', () => {
    it('should display cart items correctly', async () => {
      const mockCartData = {
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'Gaming Laptop',
              price: 1299.99,
              images: [{ url: '/laptop.jpg', isPrimary: true }]
            },
            quantity: 2,
            price: 1299.99
          },
          {
            _id: 'item2',
            product: {
              _id: 'product2',
              name: 'Wireless Mouse',
              price: 49.99,
              images: [{ url: '/mouse.jpg', isPrimary: true }]
            },
            quantity: 1,
            price: 49.99
          }
        ],
        subtotal: 2649.97,
        total: 2649.97,
        itemCount: 3
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart items to load
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
        expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
      });

      // Check quantities
      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();

      // Check total
      expect(screen.getByText('$2,649.97')).toBeInTheDocument();
    });

    it('should update item quantity', async () => {
      const mockCartData = {
        items: [{
          _id: 'item1',
          product: {
            _id: 'product1',
            name: 'Gaming Laptop',
            price: 1299.99,
            images: [{ url: '/laptop.jpg', isPrimary: true }]
          },
          quantity: 1,
          price: 1299.99
        }],
        subtotal: 1299.99,
        total: 1299.99,
        itemCount: 1
      };

      const updatedCartData = {
        ...mockCartData,
        items: [{
          ...mockCartData.items[0],
          quantity: 3
        }],
        subtotal: 3899.97,
        total: 3899.97,
        itemCount: 3
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        }),
        rest.put('/api/cart/update/:itemId', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: updatedCartData }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      });

      // Update quantity
      const quantityInput = screen.getByDisplayValue('1');
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');
      await user.tab(); // Trigger blur event

      // Wait for update
      await waitFor(() => {
        expect(screen.getByText('$3,899.97')).toBeInTheDocument();
      });
    });

    it('should remove item from cart', async () => {
      const mockCartData = {
        items: [{
          _id: 'item1',
          product: {
            _id: 'product1',
            name: 'Gaming Laptop',
            price: 1299.99,
            images: [{ url: '/laptop.jpg', isPrimary: true }]
          },
          quantity: 1,
          price: 1299.99
        }],
        subtotal: 1299.99,
        total: 1299.99,
        itemCount: 1
      };

      const emptyCartData = {
        items: [],
        subtotal: 0,
        total: 0,
        itemCount: 0
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        }),
        rest.delete('/api/cart/remove/:itemId', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: emptyCartData }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart to load
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      // Wait for item to be removed
      await waitFor(() => {
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      });
    });

    it('should clear entire cart', async () => {
      const mockCartData = {
        items: [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'Gaming Laptop',
              price: 1299.99,
              images: [{ url: '/laptop.jpg', isPrimary: true }]
            },
            quantity: 1,
            price: 1299.99
          }
        ],
        subtotal: 1299.99,
        total: 1299.99,
        itemCount: 1
      };

      const emptyCartData = {
        items: [],
        subtotal: 0,
        total: 0,
        itemCount: 0
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        }),
        rest.delete('/api/cart/clear', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              message: 'Cart cleared successfully'
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart to load
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      });

      // Click clear cart button
      const clearButton = screen.getByRole('button', { name: /clear cart/i });
      await user.click(clearButton);

      // Confirm in modal
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Wait for cart to be cleared
      await waitFor(() => {
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cart Validation', () => {
    it('should validate cart before checkout', async () => {
      const mockCartData = {
        items: [{
          _id: 'item1',
          product: {
            _id: 'product1',
            name: 'Gaming Laptop',
            price: 1299.99,
            images: [{ url: '/laptop.jpg', isPrimary: true }]
          },
          quantity: 2,
          price: 1299.99
        }],
        subtotal: 2599.98,
        total: 2599.98,
        itemCount: 2
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        }),
        rest.post('/api/cart/validate', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                valid: true,
                issues: []
              }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart to load
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      });

      // Click checkout button
      const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
      await user.click(checkoutButton);

      // Should proceed to checkout (no validation errors)
      await waitFor(() => {
        expect(window.location.pathname).toBe('/checkout');
      });
    });

    it('should handle validation errors', async () => {
      const mockCartData = {
        items: [{
          _id: 'item1',
          product: {
            _id: 'product1',
            name: 'Gaming Laptop',
            price: 1299.99,
            images: [{ url: '/laptop.jpg', isPrimary: true }]
          },
          quantity: 5,
          price: 1299.99
        }],
        subtotal: 6499.95,
        total: 6499.95,
        itemCount: 5
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        }),
        rest.post('/api/cart/validate', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                valid: false,
                issues: [{
                  type: 'insufficient_stock',
                  itemId: 'item1',
                  productName: 'Gaming Laptop',
                  requested: 5,
                  available: 2,
                  message: 'Insufficient stock for Gaming Laptop. Requested: 5, Available: 2'
                }]
              }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart to load
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      });

      // Click checkout button
      const checkoutButton = screen.getByRole('button', { name: /proceed to checkout/i });
      await user.click(checkoutButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart across page reloads', async () => {
      const mockCartData = {
        items: [{
          _id: 'item1',
          product: {
            _id: 'product1',
            name: 'Gaming Laptop',
            price: 1299.99,
            images: [{ url: '/laptop.jpg', isPrimary: true }]
          },
          quantity: 1,
          price: 1299.99
        }],
        subtotal: 1299.99,
        total: 1299.99,
        itemCount: 1
      };

      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              data: { cart: mockCartData }
            })
          );
        })
      );

      const { rerender } = render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Wait for cart to load
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      });

      // Simulate page reload by re-rendering
      rerender(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Cart should still be loaded
      await waitFor(() => {
        expect(screen.getByText('Gaming Laptop')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while fetching cart', async () => {
      server.use(
        rest.get('/api/cart', (req, res, ctx) => {
          return res(
            ctx.delay(1000), // Simulate slow response
            ctx.status(200),
            ctx.json({
              success: true,
              data: {
                cart: {
                  items: [],
                  subtotal: 0,
                  total: 0,
                  itemCount: 0
                }
              }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <Cart />
        </TestWrapper>
      );

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});