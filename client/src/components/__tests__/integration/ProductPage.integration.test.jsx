import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OptimizedProduct from '../../pages/OptimizedProduct.jsx';
import { AuthProvider } from '../../context/AuthContext.jsx';
import { NotificationProvider } from '../../context/NotificationContext.jsx';
import { CartProvider } from '../../context/CartContext.jsx';

// Mock API calls
const mockProduct = {
  _id: 'product-123',
  name: 'Test Product',
  slug: 'test-product',
  description: 'This is a test product description',
  price: 999,
  comparePrice: 1199,
  images: [
    {
      url: '/test-image.jpg',
      webp: '/test-image.webp',
      alt: 'Test Product Image'
    }
  ],
  rating: {
    average: 4.5,
    count: 128
  },
  stock: {
    quantity: 50,
    trackQuantity: true
  },
  category: {
    _id: 'category-123',
    name: 'Electronics',
    slug: 'electronics'
  },
  specifications: {
    'Display & Design': [
      { label: 'Display Size', value: '11-inch Liquid Retina', highlight: true },
      { label: 'Resolution', value: '2388 x 1668 pixels at 264 ppi' }
    ]
  }
};

const mockReviews = {
  reviews: [
    {
      _id: 'review-1',
      rating: 5,
      title: 'Great product!',
      comment: 'Really happy with this purchase.',
      user: {
        firstName: 'John',
        lastName: 'Doe'
      },
      createdAt: new Date().toISOString()
    }
  ],
  ratingBreakdown: {
    totalReviews: 128,
    averageRating: 4.5,
    ratings: [
      { rating: 5, count: 80 },
      { rating: 4, count: 30 },
      { rating: 3, count: 15 },
      { rating: 2, count: 2 },
      { rating: 1, count: 1 }
    ]
  },
  pagination: {
    currentPage: 1,
    totalPages: 5,
    totalReviews: 128
  }
};

// Mock fetch
global.fetch = vi.fn();

// Mock intersection observer
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Test wrapper with all providers
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Product Page Integration', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Mock successful API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/products/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { product: mockProduct }
          })
        });
      }
      
      if (url.includes('/reviews')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockReviews
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Product Loading and Display', () => {
    it('should load and display product information', async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Check product details
      expect(screen.getByText('$999.00')).toBeInTheDocument();
      expect(screen.getByText('$1,199.00')).toBeInTheDocument(); // Compare price
      expect(screen.getByText('This is a test product description')).toBeInTheDocument();
      
      // Check rating display
      expect(screen.getByText('(128 reviews)')).toBeInTheDocument();
    });

    it('should handle product loading error', async () => {
      fetch.mockRejectedValueOnce(new Error('Product not found'));

      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Product not found')).toBeInTheDocument();
      });
    });

    it('should display product images with lazy loading', async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        const productImage = screen.getByAltText('Test Product Image');
        expect(productImage).toBeInTheDocument();
        expect(productImage).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  describe('Product Options and Interactions', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should allow color selection', async () => {
      const colorOptions = screen.getAllByRole('button', { name: /color/i });
      
      if (colorOptions.length > 0) {
        await user.click(colorOptions[1]);
        expect(colorOptions[1]).toHaveClass('selected');
      }
    });

    it('should allow storage selection and update price', async () => {
      const storageOptions = screen.getAllByRole('button', { name: /storage/i });
      
      if (storageOptions.length > 0) {
        await user.click(storageOptions[1]); // Select different storage
        
        // Price should update (this would depend on your implementation)
        await waitFor(() => {
          expect(screen.getByText(/\$\d+\.\d+/)).toBeInTheDocument();
        });
      }
    });

    it('should allow quantity adjustment', async () => {
      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i });
      const increaseButton = screen.getByRole('button', { name: '+' });
      const decreaseButton = screen.getByRole('button', { name: '-' });

      // Test increase
      await user.click(increaseButton);
      expect(quantityInput).toHaveValue(2);

      // Test decrease
      await user.click(decreaseButton);
      expect(quantityInput).toHaveValue(1);

      // Test direct input
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');
      expect(quantityInput).toHaveValue(5);
    });

    it('should add product to cart', async () => {
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      
      await user.click(addToCartButton);
      
      // Should show success notification
      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
      });
    });

    it('should handle buy now action', async () => {
      const buyNowButton = screen.getByRole('button', { name: /buy now/i });
      
      await user.click(buyNowButton);
      
      // Should redirect to checkout or show appropriate action
      // This depends on your implementation
    });

    it('should toggle wishlist', async () => {
      const wishlistButton = screen.getByRole('button', { name: /wishlist/i });
      
      await user.click(wishlistButton);
      
      // Should update wishlist state
      expect(wishlistButton).toHaveTextContent(/remove from wishlist/i);
      
      await user.click(wishlistButton);
      expect(wishlistButton).toHaveTextContent(/add to wishlist/i);
    });
  });

  describe('Reviews Section', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should load and display reviews', async () => {
      await waitFor(() => {
        expect(screen.getByText('Great product!')).toBeInTheDocument();
        expect(screen.getByText('Really happy with this purchase.')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display rating breakdown', async () => {
      await waitFor(() => {
        expect(screen.getByText('128 reviews')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
      });

      // Check rating distribution
      const ratingBars = screen.getAllByRole('progressbar');
      expect(ratingBars.length).toBeGreaterThan(0);
    });

    it('should allow writing a review when authenticated', async () => {
      // Mock authenticated user
      const writeReviewButton = screen.getByRole('button', { name: /write review/i });
      
      await user.click(writeReviewButton);
      
      // Should show review form
      expect(screen.getByRole('form', { name: /write review/i })).toBeInTheDocument();
    });

    it('should filter reviews by rating', async () => {
      const ratingFilter = screen.getByRole('combobox', { name: /filter by rating/i });
      
      await user.selectOptions(ratingFilter, '5');
      
      // Should filter reviews (mock API would return filtered results)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('rating=5')
        );
      });
    });
  });

  describe('Specifications Section', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should display product specifications', async () => {
      await waitFor(() => {
        expect(screen.getByText('Display Size')).toBeInTheDocument();
        expect(screen.getByText('11-inch Liquid Retina')).toBeInTheDocument();
        expect(screen.getByText('Resolution')).toBeInTheDocument();
      });
    });

    it('should expand/collapse specification sections', async () => {
      const specSection = screen.getByRole('button', { name: /display & design/i });
      
      await user.click(specSection);
      
      // Should toggle visibility
      const specDetails = screen.getByText('2388 x 1668 pixels at 264 ppi');
      expect(specDetails).toBeVisible();
    });
  });

  describe('Related Products', () => {
    beforeEach(async () => {
      // Mock related products API
      fetch.mockImplementation((url) => {
        if (url.includes('/api/products/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { product: mockProduct }
            })
          });
        }
        
        if (url.includes('/related')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                products: [
                  { ...mockProduct, _id: 'related-1', name: 'Related Product 1' },
                  { ...mockProduct, _id: 'related-2', name: 'Related Product 2' }
                ]
              }
            })
          });
        }
        
        return Promise.reject(new Error('Unknown URL'));
      });

      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should load and display related products', async () => {
      await waitFor(() => {
        expect(screen.getByText('Related Product 1')).toBeInTheDocument();
        expect(screen.getByText('Related Product 2')).toBeInTheDocument();
      });
    });

    it('should navigate to related product on click', async () => {
      await waitFor(() => {
        const relatedProduct = screen.getByText('Related Product 1');
        expect(relatedProduct.closest('a')).toHaveAttribute('href', '/product/test-product');
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should lazy load heavy components', async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      // Initially should show loading for lazy components
      expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
      expect(screen.getByText('Loading specifications...')).toBeInTheDocument();
      expect(screen.getByText('Loading related products...')).toBeInTheDocument();

      // After loading, components should be rendered
      await waitFor(() => {
        expect(screen.queryByText('Loading reviews...')).not.toBeInTheDocument();
      });
    });

    it('should use React Query for caching', async () => {
      const { rerender } = render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const initialFetchCount = fetch.mock.calls.length;

      // Re-render component
      rerender(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      // Should not make additional API calls due to caching
      expect(fetch.mock.calls.length).toBe(initialFetchCount);
    });

    it('should handle concurrent user interactions efficiently', async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Simulate rapid interactions
      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i });
      const increaseButton = screen.getByRole('button', { name: '+' });

      // Rapid clicks should be handled gracefully
      await user.click(increaseButton);
      await user.click(increaseButton);
      await user.click(increaseButton);

      expect(quantityInput).toHaveValue(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid product ID', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          message: 'Product not found'
        })
      });

      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Product not found')).toBeInTheDocument();
      });
    });

    it('should handle out of stock products', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        stock: { quantity: 0, trackQuantity: true }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { product: outOfStockProduct }
        })
      });

      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        const addToCartButton = screen.getByRole('button', { name: /out of stock/i });
        expect(addToCartButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(
        <TestWrapper>
          <OptimizedProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    });

    it('should have proper heading hierarchy', () => {
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Test Product');

      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('should have proper form labels', () => {
      const quantityInput = screen.getByRole('spinbutton', { name: /quantity/i });
      expect(quantityInput).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      
      addToCartButton.focus();
      expect(addToCartButton).toHaveFocus();

      await user.keyboard('{Enter}');
      
      // Should trigger add to cart action
      await waitFor(() => {
        expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes', () => {
      const ratingDisplay = screen.getByRole('img', { name: /rating/i });
      expect(ratingDisplay).toHaveAttribute('aria-label');
    });
  });
});