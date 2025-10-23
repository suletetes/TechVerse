import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useAuthStore } from '../stores/authStore.js';
import { useNotifications } from '../stores/uiStore.js';

/**
 * Enhanced TanStack Query Client Configuration
 * Includes persistence, error handling, and optimistic updates
 */

// Create persister for query cache
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'TECHVERSE_QUERY_CACHE',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});

// Global error handler
const handleQueryError = (error, query) => {
  console.error('Query error:', error, query);
  
  // Get notification function
  const showError = useNotifications.getState().showError;
  
  // Handle different error types
  if (error?.status === 401) {
    // Unauthorized - logout user
    useAuthStore.getState().logout();
    showError('Session expired. Please login again.');
  } else if (error?.status === 403) {
    showError('Access denied. You don\'t have permission for this action.');
  } else if (error?.status === 404) {
    showError('The requested resource was not found.');
  } else if (error?.status >= 500) {
    showError('Server error. Please try again later.');
  } else if (error?.message) {
    showError(error.message);
  } else {
    showError('An unexpected error occurred.');
  }
};

// Create query client with enhanced configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Cache time - how long data stays in cache after component unmounts
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetching
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Error handling
      onError: handleQueryError,
      
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Error handling for mutations
      onError: (error, variables, context) => {
        console.error('Mutation error:', error, variables, context);
        handleQueryError(error);
      },
      
      // Network mode
      networkMode: 'online',
    },
  },
});

// Persist query client
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  hydrateOptions: {
    // Only hydrate successful queries
    shouldDehydrateQuery: (query) => {
      return query.state.status === 'success';
    },
  },
});

// Query key factory for consistent key generation
export const queryKeys = {
  // Auth queries
  auth: {
    me: ['auth', 'me'],
    profile: ['auth', 'profile'],
    session: ['auth', 'session'],
  },
  
  // Product queries
  products: {
    all: ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    search: (query) => ['products', 'search', query],
    categories: ['products', 'categories'],
    featured: ['products', 'featured'],
    recommendations: (productId) => ['products', 'recommendations', productId],
  },
  
  // Cart queries
  cart: {
    items: ['cart', 'items'],
    count: ['cart', 'count'],
  },
  
  // Order queries
  orders: {
    all: ['orders'],
    list: (filters) => ['orders', 'list', filters],
    detail: (id) => ['orders', 'detail', id],
    history: (userId) => ['orders', 'history', userId],
  },
  
  // User queries
  users: {
    profile: (id) => ['users', 'profile', id],
    addresses: (id) => ['users', 'addresses', id],
    preferences: (id) => ['users', 'preferences', id],
  },
  
  // Admin queries
  admin: {
    dashboard: ['admin', 'dashboard'],
    users: (filters) => ['admin', 'users', filters],
    orders: (filters) => ['admin', 'orders', filters],
    analytics: (period) => ['admin', 'analytics', period],
    security: ['admin', 'security'],
  },
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Add item to cart optimistically
  addToCart: (product, quantity = 1) => {
    queryClient.setQueryData(queryKeys.cart.items, (oldData) => {
      if (!oldData) return { items: [{ product, quantity }] };
      
      const existingItemIndex = oldData.items.findIndex(
        item => item.product._id === product._id
      );
      
      if (existingItemIndex >= 0) {
        const newItems = [...oldData.items];
        newItems[existingItemIndex].quantity += quantity;
        return { ...oldData, items: newItems };
      } else {
        return {
          ...oldData,
          items: [...oldData.items, { product, quantity }]
        };
      }
    });
    
    // Update cart count
    queryClient.setQueryData(queryKeys.cart.count, (oldCount) => 
      (oldCount || 0) + quantity
    );
  },
  
  // Remove item from cart optimistically
  removeFromCart: (productId) => {
    queryClient.setQueryData(queryKeys.cart.items, (oldData) => {
      if (!oldData) return oldData;
      
      const removedItem = oldData.items.find(item => item.product._id === productId);
      const newItems = oldData.items.filter(item => item.product._id !== productId);
      
      // Update cart count
      if (removedItem) {
        queryClient.setQueryData(queryKeys.cart.count, (oldCount) => 
          Math.max(0, (oldCount || 0) - removedItem.quantity)
        );
      }
      
      return { ...oldData, items: newItems };
    });
  },
  
  // Update user profile optimistically
  updateProfile: (updates) => {
    queryClient.setQueryData(queryKeys.auth.profile, (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, ...updates };
    });
    
    queryClient.setQueryData(queryKeys.auth.me, (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, user: { ...oldData.user, ...updates } };
    });
  },
};

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all auth-related queries
  auth: () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  },
  
  // Invalidate all product-related queries
  products: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
  
  // Invalidate all cart-related queries
  cart: () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  },
  
  // Invalidate all order-related queries
  orders: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
  
  // Invalidate specific product
  product: (id) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
  },
  
  // Invalidate user data
  user: (id) => {
    queryClient.invalidateQueries({ queryKey: ['users', 'profile', id] });
  },
};

// Background refetch helpers
export const backgroundRefetch = {
  // Refetch critical data in background
  critical: () => {
    queryClient.refetchQueries({ queryKey: ['auth'] });
    queryClient.refetchQueries({ queryKey: ['cart'] });
  },
  
  // Refetch product data
  products: () => {
    queryClient.refetchQueries({ queryKey: ['products'] });
  },
  
  // Refetch user data
  user: () => {
    queryClient.refetchQueries({ queryKey: ['auth'] });
    queryClient.refetchQueries({ queryKey: ['users'] });
  },
};

// Prefetch helpers
export const prefetchQueries = {
  // Prefetch product details
  productDetails: async (productId) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(productId),
      queryFn: () => fetch(`/api/products/${productId}`).then(res => res.json()),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  },
  
  // Prefetch user profile
  userProfile: async (userId) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.profile(userId),
      queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
      staleTime: 1000 * 60 * 15, // 15 minutes
    });
  },
  
  // Prefetch related products
  relatedProducts: async (productId) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.products.recommendations(productId),
      queryFn: () => fetch(`/api/products/${productId}/recommendations`).then(res => res.json()),
      staleTime: 1000 * 60 * 30, // 30 minutes
    });
  },
};

// Query client utilities
export const queryUtils = {
  // Clear all caches
  clearAll: () => {
    queryClient.clear();
  },
  
  // Remove specific queries
  removeQueries: (queryKey) => {
    queryClient.removeQueries({ queryKey });
  },
  
  // Get cached data
  getCachedData: (queryKey) => {
    return queryClient.getQueryData(queryKey);
  },
  
  // Set cached data
  setCachedData: (queryKey, data) => {
    queryClient.setQueryData(queryKey, data);
  },
  
  // Check if query is loading
  isLoading: (queryKey) => {
    const query = queryClient.getQueryState(queryKey);
    return query?.status === 'pending';
  },
  
  // Check if query has error
  hasError: (queryKey) => {
    const query = queryClient.getQueryState(queryKey);
    return query?.status === 'error';
  },
  
  // Get query error
  getError: (queryKey) => {
    const query = queryClient.getQueryState(queryKey);
    return query?.error;
  },
};

export default queryClient;