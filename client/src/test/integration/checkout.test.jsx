/**
 * Checkout Flow Integration Test
 * Tests complete checkout flow from browsing to payment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';

// Mock API calls
vi.mock('../../api/services/productService', () => ({
  default: {
    getAllProducts: vi.fn().mockResolvedValue({
      data: {
        products: [
          {
            _id: '1',
            name: 'Test Product',
            slug: 'test-product',
            price: 999.99,
            images: [{ url: '/test-image.jpg', isPrimary: true }],
            stock: { quantity: 10 }
          }
        ]
      }
    }),
    getProductBySlug: vi.fn().mockResolvedValue({
      data: {
        _id: '1',
        name: 'Test Product',
        slug: 'test-product',
        price: 999.99,
        images: [{ url: '/test-image.jpg', isPrimary: true }],
        stock: { quantity: 10 }
      }
    })
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderApp = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Checkout Flow Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should complete browse → add to cart → checkout flow', async () => {
    renderApp();

    // Step 1: Browse products
    await waitFor(() => {
      expect(screen.getByText(/products|shop/i)).toBeInTheDocument();
    });

    // Step 2: View product details
    const productLink = screen.getByText('Test Product');
    fireEvent.click(productLink);

    await waitFor(() => {
      expect(screen.getByText(/add to cart/i)).toBeInTheDocument();
    });

    // Step 3: Add to cart
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
    });

    // Step 4: Go to cart
    const cartLink = screen.getByRole('link', { name: /cart/i });
    fireEvent.click(cartLink);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Step 5: Proceed to checkout
    const checkoutButton = screen.getByRole('button', { name: /checkout|proceed/i });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      // Should redirect to login or checkout page
      expect(
        screen.getByText(/login|checkout|shipping/i)
      ).toBeInTheDocument();
    });
  });

  it('should update cart quantity', async () => {
    renderApp();

    // Add product to cart
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const productLink = screen.getByText('Test Product');
    fireEvent.click(productLink);

    const addToCartButton = await screen.findByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    // Go to cart
    const cartLink = screen.getByRole('link', { name: /cart/i });
    fireEvent.click(cartLink);

    // Increase quantity
    const increaseButton = await screen.findByRole('button', { name: /increase|plus|\+/i });
    fireEvent.click(increaseButton);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should remove item from cart', async () => {
    renderApp();

    // Add product to cart
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const productLink = screen.getByText('Test Product');
    fireEvent.click(productLink);

    const addToCartButton = await screen.findByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    // Go to cart
    const cartLink = screen.getByRole('link', { name: /cart/i });
    fireEvent.click(cartLink);

    // Remove item
    const removeButton = await screen.findByRole('button', { name: /remove|delete/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/empty|no items/i)).toBeInTheDocument();
    });
  });
});
