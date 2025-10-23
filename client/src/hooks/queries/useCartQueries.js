import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, optimisticUpdates } from '../../lib/queryClient.js';
import { useAuthToken } from '../../stores/authStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useNotifications } from '../../stores/uiStore.js';

/**
 * Cart Query Hooks
 * Handles cart operations with optimistic updates and server synchronization
 */

// Get cart items
export const useCart = () => {
  const { token, getAuthHeader } = useAuthToken();
  
  return useQuery({
    queryKey: queryKeys.cart.items,
    queryFn: async () => {
      if (!token) {
        // Return local cart for unauthenticated users
        const localCart = useCartStore.getState();
        return {
          items: localCart.items,
          totalItems: localCart.totalItems,
          totalPrice: localCart.totalPrice,
          subtotal: localCart.subtotal,
          tax: localCart.tax,
          shipping: localCart.shipping,
          grandTotal: localCart.grandTotal,
        };
      }
      
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });
};

// Get cart count (for header badge)
export const useCartCount = () => {
  const { token, getAuthHeader } = useAuthToken();
  
  return useQuery({
    queryKey: queryKeys.cart.count,
    queryFn: async () => {
      if (!token) {
        // Return local cart count for unauthenticated users
        return useCartStore.getState().totalItems;
      }
      
      const response = await fetch('/api/cart/count', {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart count');
      }
      
      const data = await response.json();
      return data.count;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

// Add item to cart
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { token, getAuthHeader } = useAuthToken();
  const { addItem } = useCartStore();
  
  return useMutation({
    mutationFn: async ({ product, quantity = 1 }) => {
      if (!token) {
        // Add to local cart for unauthenticated users
        addItem(product, quantity);
        return { success: true, message: 'Added to cart' };
      }
      
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item to cart');
      }
      
      return response.json();
    },
    onMutate: async ({ product, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items });
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.count });
      
      // Snapshot previous values
      const previousCart = queryClient.getQueryData(queryKeys.cart.items);
      const previousCount = queryClient.getQueryData(queryKeys.cart.count);
      
      // Optimistically update cart
      optimisticUpdates.addToCart(product, quantity);
      
      return { previousCart, previousCount };
    },
    onSuccess: (data, { product, quantity }) => {
      if (token) {
        // Update cache with server response for authenticated users
        queryClient.setQueryData(queryKeys.cart.items, data.cart);
        queryClient.setQueryData(queryKeys.cart.count, data.cart.totalItems);
      }
      
      showSuccess(`${product.name} added to cart`);
    },
    onError: (error, { product }, context) => {
      // Rollback optimistic updates
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items, context.previousCart);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.cart.count, context.previousCount);
      }
      
      showError(error.message || 'Failed to add item to cart');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count });
    },
  });
};

// Update cart item quantity
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { token, getAuthHeader } = useAuthToken();
  const { updateQuantity } = useCartStore();
  
  return useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      if (!token) {
        // Update local cart for unauthenticated users
        updateQuantity(itemId, quantity);
        return { success: true, message: 'Cart updated' };
      }
      
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cart item');
      }
      
      return response.json();
    },
    onMutate: async ({ itemId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items });
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.count });
      
      // Snapshot previous values
      const previousCart = queryClient.getQueryData(queryKeys.cart.items);
      const previousCount = queryClient.getQueryData(queryKeys.cart.count);
      
      // Optimistically update cart
      queryClient.setQueryData(queryKeys.cart.items, (old) => {
        if (!old?.items) return old;
        
        const updatedItems = old.items.map(item => {
          if (item.id === itemId || item.product._id === itemId) {
            return { ...item, quantity };
          }
          return item;
        }).filter(item => item.quantity > 0);
        
        return {
          ...old,
          items: updatedItems,
        };
      });
      
      return { previousCart, previousCount };
    },
    onSuccess: (data) => {
      if (token && data.cart) {
        // Update cache with server response
        queryClient.setQueryData(queryKeys.cart.items, data.cart);
        queryClient.setQueryData(queryKeys.cart.count, data.cart.totalItems);
      }
      
      showSuccess('Cart updated');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items, context.previousCart);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.cart.count, context.previousCount);
      }
      
      showError(error.message || 'Failed to update cart');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count });
    },
  });
};

// Remove item from cart
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { token, getAuthHeader } = useAuthToken();
  const { removeItem } = useCartStore();
  
  return useMutation({
    mutationFn: async (itemId) => {
      if (!token) {
        // Remove from local cart for unauthenticated users
        removeItem(itemId);
        return { success: true, message: 'Item removed from cart' };
      }
      
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove item from cart');
      }
      
      return response.json();
    },
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items });
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.count });
      
      // Snapshot previous values
      const previousCart = queryClient.getQueryData(queryKeys.cart.items);
      const previousCount = queryClient.getQueryData(queryKeys.cart.count);
      
      // Optimistically remove item
      optimisticUpdates.removeFromCart(itemId);
      
      return { previousCart, previousCount };
    },
    onSuccess: (data) => {
      if (token && data.cart) {
        // Update cache with server response
        queryClient.setQueryData(queryKeys.cart.items, data.cart);
        queryClient.setQueryData(queryKeys.cart.count, data.cart.totalItems);
      }
      
      showSuccess('Item removed from cart');
    },
    onError: (error, itemId, context) => {
      // Rollback optimistic updates
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items, context.previousCart);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.cart.count, context.previousCount);
      }
      
      showError(error.message || 'Failed to remove item from cart');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count });
    },
  });
};

// Clear entire cart
export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { token, getAuthHeader } = useAuthToken();
  const { clearCart } = useCartStore();
  
  return useMutation({
    mutationFn: async () => {
      if (!token) {
        // Clear local cart for unauthenticated users
        clearCart();
        return { success: true, message: 'Cart cleared' };
      }
      
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to clear cart');
      }
      
      return response.json();
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.items });
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.count });
      
      // Snapshot previous values
      const previousCart = queryClient.getQueryData(queryKeys.cart.items);
      const previousCount = queryClient.getQueryData(queryKeys.cart.count);
      
      // Optimistically clear cart
      queryClient.setQueryData(queryKeys.cart.items, {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        grandTotal: 0,
      });
      queryClient.setQueryData(queryKeys.cart.count, 0);
      
      return { previousCart, previousCount };
    },
    onSuccess: () => {
      showSuccess('Cart cleared');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.items, context.previousCart);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(queryKeys.cart.count, context.previousCount);
      }
      
      showError(error.message || 'Failed to clear cart');
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.count });
    },
  });
};

// Sync local cart with server (for when user logs in)
export const useSyncCart = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotifications();
  const { getAuthHeader } = useAuthToken();
  const { syncWithServer } = useCartStore();
  
  return useMutation({
    mutationFn: async () => {
      const localCart = useCartStore.getState();
      
      if (localCart.items.length === 0) {
        return { success: true, message: 'No items to sync' };
      }
      
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: localCart.items,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sync cart');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Update cache with merged cart
      if (data.cart) {
        queryClient.setQueryData(queryKeys.cart.items, data.cart);
        queryClient.setQueryData(queryKeys.cart.count, data.cart.totalItems);
        
        // Update local store
        syncWithServer(getAuthHeader());
      }
      
      showSuccess('Cart synced successfully');
    },
    onError: (error) => {
      showError(error.message || 'Failed to sync cart');
    },
  });
};