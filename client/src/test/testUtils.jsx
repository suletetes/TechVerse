import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext.jsx';
import { NotificationProvider } from '../context/NotificationContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';

// Create a custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0
        },
        mutations: {
          retry: false
        }
      }
    }),
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
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

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient
  };
};

// Mock user data
export const mockUser = {
  _id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'user',
  isEmailVerified: true,
  preferences: {
    notifications: {
      email: true,
      push: false
    },
    privacy: {
      profileVisibility: 'public'
    }
  }
};

export const mockAdmin = {
  _id: 'admin-123',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: 'admin',
  isEmailVerified: true,
  permissions: ['read:all', 'write:all', 'delete:all']
};

// Mock product data
export const mockProduct = {
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
      alt: 'Test Product Image',
      isPrimary: true
    }
  ],
  rating: {
    average: 4.5,
    count: 128
  },
  stock: {
    quantity: 50,
    trackQuantity: true,
    lowStockThreshold: 10
  },
  category: {
    _id: 'category-123',
    name: 'Electronics',
    slug: 'electronics'
  },
  brand: 'TestBrand',
  status: 'active',
  visibility: 'public',
  featured: false,
  specifications: [
    {
      name: 'Display Size',
      value: '11-inch Liquid Retina',
      category: 'Display & Design'
    },
    {
      name: 'Resolution',
      value: '2388 x 1668 pixels at 264 ppi',
      category: 'Display & Design'
    }
  ],
  features: [
    'High-resolution display',
    'Long battery life',
    'Fast processor'
  ],
  tags: ['electronics', 'tablet', 'portable']
};

// Mock category data
export const mockCategory = {
  _id: 'category-123',
  name: 'Electronics',
  slug: 'electronics',
  description: 'Electronic devices and gadgets',
  image: '/category-electronics.jpg',
  parentCategory: null,
  subcategories: [
    {
      _id: 'subcategory-1',
      name: 'Tablets',
      slug: 'tablets'
    },
    {
      _id: 'subcategory-2',
      name: 'Smartphones',
      slug: 'smartphones'
    }
  ]
};

// Mock order data
export const mockOrder = {
  _id: 'order-123',
  orderNumber: 'ORD-2024-001',
  user: mockUser._id,
  items: [
    {
      product: mockProduct,
      quantity: 2,
      price: mockProduct.price,
      total: mockProduct.price * 2
    }
  ],
  subtotal: mockProduct.price * 2,
  tax: mockProduct.price * 2 * 0.08,
  shipping: 0,
  total: mockProduct.price * 2 * 1.08,
  status: 'pending',
  paymentStatus: 'pending',
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  paymentMethod: 'credit_card',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock review data
export const mockReview = {
  _id: 'review-123',
  user: {
    _id: mockUser._id,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName
  },
  product: mockProduct._id,
  rating: 5,
  title: 'Excellent product!',
  comment: 'Really happy with this purchase. Great quality and fast delivery.',
  pros: ['Great quality', 'Fast delivery', 'Good value'],
  cons: ['Could be cheaper'],
  verified: true,
  helpful: 15,
  status: 'approved',
  createdAt: new Date().toISOString()
};

// Mock API responses
export const mockApiResponse = (data, success = true, message = 'Success') => ({
  success,
  message,
  data
});

export const mockPaginatedResponse = (items, page = 1, limit = 20, total = null) => ({
  success: true,
  message: 'Data retrieved successfully',
  data: {
    [Array.isArray(items) ? 'items' : 'item']: items,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((total || items.length) / limit),
      totalItems: total || items.length,
      hasNextPage: page * limit < (total || items.length),
      hasPrevPage: page > 1,
      limit
    }
  }
});

// Mock fetch responses
export const mockFetch = (responses = {}) => {
  global.fetch = vi.fn().mockImplementation((url, options = {}) => {
    const method = options.method || 'GET';
    const key = `${method} ${url}`;
    
    if (responses[key]) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responses[key])
      });
    }
    
    // Default responses
    if (url.includes('/api/products/')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse(mockProduct))
      });
    }
    
    if (url.includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse({ user: mockUser }))
      });
    }
    
    return Promise.reject(new Error(`No mock response for ${key}`));
  });
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockObserver = vi.fn();
  const mockObserve = vi.fn();
  const mockUnobserve = vi.fn();
  const mockDisconnect = vi.fn();

  mockObserver.mockImplementation((callback) => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    callback
  }));

  global.IntersectionObserver = mockObserver;
  
  return {
    mockObserver,
    mockObserve,
    mockUnobserve,
    mockDisconnect
  };
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockObserver = vi.fn();
  const mockObserve = vi.fn();
  const mockUnobserve = vi.fn();
  const mockDisconnect = vi.fn();

  mockObserver.mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect
  }));

  global.ResizeObserver = mockObserver;
  
  return {
    mockObserver,
    mockObserve,
    mockUnobserve,
    mockDisconnect
  };
};

// Performance testing utilities
export const measureRenderTime = (renderFn) => {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  
  return {
    result,
    renderTime: endTime - startTime
  };
};

export const measureMemoryUsage = (fn) => {
  const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  const result = fn();
  const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  
  return {
    result,
    memoryDelta: finalMemory - initialMemory
  };
};

// Accessibility testing utilities
export const checkAccessibility = async (container) => {
  const { axe } = await import('axe-core');
  const results = await axe.run(container);
  return results;
};

// Custom matchers
export const customMatchers = {
  toBeAccessible: async (received) => {
    const results = await checkAccessibility(received);
    const violations = results.violations;
    
    return {
      pass: violations.length === 0,
      message: () => 
        violations.length === 0
          ? 'Element is accessible'
          : `Element has ${violations.length} accessibility violations: ${violations.map(v => v.description).join(', ')}`
    };
  },
  
  toHavePerformantRender: (received, maxTime = 16) => {
    const { renderTime } = measureRenderTime(() => received);
    
    return {
      pass: renderTime <= maxTime,
      message: () => 
        renderTime <= maxTime
          ? `Render time ${renderTime}ms is within acceptable range`
          : `Render time ${renderTime}ms exceeds maximum of ${maxTime}ms`
    };
  },
  
  toHaveReasonableMemoryUsage: (received, maxMemory = 10 * 1024 * 1024) => {
    const { memoryDelta } = measureMemoryUsage(() => received);
    
    return {
      pass: memoryDelta <= maxMemory,
      message: () => 
        memoryDelta <= maxMemory
          ? `Memory usage ${memoryDelta} bytes is within acceptable range`
          : `Memory usage ${memoryDelta} bytes exceeds maximum of ${maxMemory} bytes`
    };
  }
};

// Test data generators
export const generateProducts = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockProduct,
    _id: `product-${i}`,
    name: `Test Product ${i}`,
    slug: `test-product-${i}`,
    price: 100 + i * 50
  }));
};

export const generateUsers = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockUser,
    _id: `user-${i}`,
    email: `user${i}@example.com`,
    firstName: `User${i}`
  }));
};

export const generateOrders = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockOrder,
    _id: `order-${i}`,
    orderNumber: `ORD-2024-${String(i + 1).padStart(3, '0')}`
  }));
};

// Async testing utilities
export const waitForElement = async (getByTestId, testId, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = getByTestId(testId);
      if (element) return element;
    } catch (error) {
      // Element not found, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Element with testId "${testId}" not found within ${timeout}ms`);
};

export const waitForCondition = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Export all utilities
export * from '@testing-library/react';
export { renderWithProviders as render };