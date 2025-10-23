import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, prefetchQueries } from '../../lib/queryClient.js';
import { useAuthToken } from '../../stores/authStore.js';
import { useNotifications } from '../../stores/uiStore.js';

/**
 * Product Query Hooks
 * Handles product fetching, search, categories, and product management
 */

// Get all products with filters and pagination
export const useProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      // Add filters to search params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
          } else {
            searchParams.append(key, value);
          }
        }
      });
      
      const response = await fetch(`/api/products?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

// Infinite query for products (for infinite scrolling)
export const useInfiniteProducts = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams({
        page: pageParam.toString(),
        limit: '12',
        ...filters,
      });
      
      const response = await fetch(`/api/products?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.pagination?.hasMore;
      return hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get single product by ID
export const useProduct = (productId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error('Failed to fetch product');
      }
      
      const data = await response.json();
      
      // Prefetch related products in background
      if (data.product) {
        prefetchQueries.relatedProducts(productId);
      }
      
      return data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
};

// Search products
export const useProductSearch = (query, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { products: [], total: 0 };
      }
      
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      return response.json();
    },
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
};

// Get product categories
export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.categories,
    queryFn: async () => {
      const response = await fetch('/api/products/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (categories don't change often)
    ...options,
  });
};

// Get featured products
export const useFeaturedProducts = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.featured,
    queryFn: async () => {
      const response = await fetch('/api/products/featured');
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    ...options,
  });
};

// Get product recommendations
export const useProductRecommendations = (productId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.recommendations(productId),
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/recommendations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      return response.json();
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 20, // 20 minutes
    ...options,
  });
};

// Create product (admin only)
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async (productData) => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Add new product to cache
      queryClient.setQueryData(
        queryKeys.products.detail(data.product._id),
        data
      );
      
      showSuccess('Product created successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to create product');
    },
  });
};

// Update product (admin only)
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async ({ productId, productData }) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }
      
      return response.json();
    },
    onMutate: async ({ productId, productData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.products.detail(productId) 
      });
      
      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(
        queryKeys.products.detail(productId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.products.detail(productId),
        (old) => ({
          ...old,
          product: { ...old?.product, ...productData },
        })
      );
      
      return { previousProduct, productId };
    },
    onSuccess: (data, { productId }) => {
      // Update cache with server response
      queryClient.setQueryData(
        queryKeys.products.detail(productId),
        data
      );
      
      // Invalidate products list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      
      showSuccess('Product updated successfully');
    },
    onError: (error, { productId }, context) => {
      // Rollback optimistic update
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(productId),
          context.previousProduct
        );
      }
      
      showError(error.message || 'Failed to update product');
    },
    onSettled: (data, error, { productId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.detail(productId) 
      });
    },
  });
};

// Delete product (admin only)
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async (productId) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: (data, productId) => {
      // Remove from cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.products.detail(productId) 
      });
      
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      showSuccess('Product deleted successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete product');
    },
  });
};

// Upload product images
export const useUploadProductImages = () => {
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async ({ productId, images }) => {
      const formData = new FormData();
      
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload images');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Images uploaded successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to upload images');
    },
  });
};

// Product review mutations
export const useAddProductReview = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  
  return useMutation({
    mutationFn: async ({ productId, review }) => {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(review),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add review');
      }
      
      return response.json();
    },
    onSuccess: (data, { productId }) => {
      // Invalidate product to refetch with new review
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.detail(productId) 
      });
      
      showSuccess('Review added successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to add review');
    },
  });
};

// Prefetch product on hover (for better UX)
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();
  
  return (productId) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(productId),
      queryFn: () => fetch(`/api/products/${productId}`).then(res => res.json()),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };
};