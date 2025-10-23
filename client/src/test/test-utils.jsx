import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Create a custom render function that includes providers
function render(ui, options = {}) {
  const {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Custom render with authentication context
function renderWithAuth(ui, options = {}) {
  const { user = null, ...otherOptions } = options;

  // Mock auth store
  const mockAuthStore = {
    user,
    token: user ? 'mock-token' : null,
    isAuthenticated: !!user,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  };

  // You would need to provide the auth context here
  // This is a simplified version
  return render(ui, otherOptions);
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  avatar: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: '1',
  name: 'Test Product',
  category: 'Electronics',
  price: 999,
  originalPrice: null,
  stock: 10,
  status: 'Active',
  sales: 0,
  image: '/img/test-product.jpg',
  featured: false,
  sku: 'TEST-001',
  description: 'Test product description',
  specifications: {
    display: 'Test Display',
    processor: 'Test Processor',
  },
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 'TEST-001',
  customer: 'Test Customer',
  email: 'customer@test.com',
  date: '2024-01-01',
  status: 'Processing',
  total: 999.00,
  items: 1,
  paymentMethod: 'Credit Card',
  shippingAddress: '123 Test St, Test City',
  products: [createMockProduct()],
  ...overrides,
});

// Custom matchers and utilities
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

export const expectElementToBeInDocument = (element) => {
  expect(element).toBeInTheDocument();
};

export const expectElementNotToBeInDocument = (element) => {
  expect(element).not.toBeInTheDocument();
};

// Mock API responses
export const mockApiResponse = (data, success = true, status = 200) => ({
  success,
  data,
  status,
});

export const mockApiError = (error = 'Test error', status = 500) => ({
  success: false,
  error,
  status,
});

// Performance testing utilities
export const measureRenderTime = async (renderFn) => {
  const start = performance.now();
  const result = await renderFn();
  const end = performance.now();
  
  return {
    ...result,
    renderTime: end - start,
  };
};

export const expectRenderTimeToBeUnder = (renderTime, maxTime) => {
  expect(renderTime).toBeLessThan(maxTime);
};

// Memory usage testing
export const measureMemoryUsage = (fn) => {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  const result = fn();
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  
  return {
    result,
    memoryDelta: finalMemory - initialMemory,
  };
};

// Accessibility testing utilities
export const expectElementToBeAccessible = async (element) => {
  // This would integrate with @testing-library/jest-dom
  // and axe-core for accessibility testing
  expect(element).toBeInTheDocument();
  // Add actual accessibility checks here
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { render, renderWithAuth };
export { default as userEvent } from '@testing-library/user-event';