import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { userService } from '../api/services/index.js';
import wishlistService from '../api/services/wishlistService.js';
import { useAuth } from './AuthContext.jsx';
import NotificationContext from './NotificationContext.jsx';

// Initial state
const initialState = {
  items: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  }
};

// Action types
const WISHLIST_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_WISHLIST_SUCCESS: 'LOAD_WISHLIST_SUCCESS',
  LOAD_MORE_WISHLIST_SUCCESS: 'LOAD_MORE_WISHLIST_SUCCESS',
  ADD_TO_WISHLIST_SUCCESS: 'ADD_TO_WISHLIST_SUCCESS',
  REMOVE_FROM_WISHLIST_SUCCESS: 'REMOVE_FROM_WISHLIST_SUCCESS',
  CLEAR_WISHLIST: 'CLEAR_WISHLIST',
  SYNC_SUCCESS: 'SYNC_SUCCESS'
};

// Reducer
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case WISHLIST_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case WISHLIST_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case WISHLIST_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case WISHLIST_ACTIONS.LOAD_WISHLIST_SUCCESS:
      return {
        ...state,
        items: action.payload.items || action.payload.data || [],
        pagination: {
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
          hasMore: action.payload.hasMore || false
        },
        isLoading: false,
        error: null
      };

    case WISHLIST_ACTIONS.LOAD_MORE_WISHLIST_SUCCESS:
      return {
        ...state,
        items: [...state.items, ...(action.payload.items || action.payload.data || [])],
        pagination: {
          page: action.payload.page || state.pagination.page + 1,
          limit: action.payload.limit || state.pagination.limit,
          total: action.payload.total || state.pagination.total,
          totalPages: action.payload.totalPages || state.pagination.totalPages,
          hasMore: action.payload.hasMore || false
        },
        isLoading: false,
        error: null
      };

    case WISHLIST_ACTIONS.ADD_TO_WISHLIST_SUCCESS:
      return {
        ...state,
        items: [action.payload, ...state.items],
        isLoading: false,
        error: null
      };

    case WISHLIST_ACTIONS.REMOVE_FROM_WISHLIST_SUCCESS:
      return {
        ...state,
        items: state.items.filter(item =>
          item.product._id !== action.payload &&
          item.product !== action.payload &&
          item._id !== action.payload
        ),
        isLoading: false,
        error: null
      };

    case WISHLIST_ACTIONS.CLEAR_WISHLIST:
      return {
        ...state,
        items: [],
        pagination: { ...initialState.pagination },
        isLoading: false,
        error: null
      };

    case WISHLIST_ACTIONS.SYNC_SUCCESS:
      return {
        ...state,
        lastSyncTime: new Date().toISOString(),
        isLoading: false,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const WishlistContext = createContext();

// Provider component
export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Safely access notification context without throwing error
  const notificationContext = useContext(NotificationContext);
  const showNotification = notificationContext?.showNotification || (() => { });

  // Load wishlist from backend or localStorage
  const loadWishlist = useCallback(async (params = {}, loadMore = false) => {
    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });

      if (isAuthenticated) {
        // Load from backend for authenticated users
        const response = await wishlistService.getWishlist();
        const wishlistItems = response.data?.wishlist?.items || [];

        // Transform backend response to match expected format
        const transformedResponse = {
          items: wishlistItems,
          data: wishlistItems,
          page: params.page || 1,
          limit: params.limit || 20,
          total: wishlistItems.length,
          totalPages: Math.ceil(wishlistItems.length / (params.limit || 20)),
          hasMore: false // Backend doesn't paginate wishlist currently
        };

        const actionType = loadMore
          ? WISHLIST_ACTIONS.LOAD_MORE_WISHLIST_SUCCESS
          : WISHLIST_ACTIONS.LOAD_WISHLIST_SUCCESS;

        dispatch({ type: actionType, payload: transformedResponse });
        return transformedResponse;
      } else {
        // Load from localStorage for guest users
        const savedWishlist = localStorage.getItem('guestWishlist');
        const wishlistItems = savedWishlist ? JSON.parse(savedWishlist) : [];

        const response = {
          items: wishlistItems,
          data: wishlistItems,
          page: 1,
          limit: 20,
          total: wishlistItems.length,
          totalPages: 1,
          hasMore: false
        };

        dispatch({ type: WISHLIST_ACTIONS.LOAD_WISHLIST_SUCCESS, payload: response });
        return response;
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');

      // Fallback to localStorage if backend fails
      if (isAuthenticated) {
        const savedWishlist = localStorage.getItem('guestWishlist');
        const wishlistItems = savedWishlist ? JSON.parse(savedWishlist) : [];
        dispatch({ type: WISHLIST_ACTIONS.LOAD_WISHLIST_SUCCESS, payload: { items: wishlistItems } });
      }
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Load more wishlist items
  const loadMoreWishlist = useCallback(async () => {
    if (!state.pagination.hasMore || state.isLoading) return;
    return loadWishlist({}, true);
  }, [loadWishlist, state.pagination.hasMore, state.isLoading]);

  // Add to wishlist
  const addToWishlist = useCallback(async (productId, product = null) => {
    if (!productId) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    // Check if item is already in wishlist
    const isAlreadyInWishlist = wishlistService.isInWishlist(productId, state.items);
    if (isAlreadyInWishlist) {
      showNotification('Item is already in your wishlist', 'info');
      return;
    }

    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });

      if (isAuthenticated) {
        // Use backend API for authenticated users
        const updatedWishlist = await wishlistService.addToWishlist(productId);

        // Reload wishlist to get updated data with product details
        await loadWishlist();
        showNotification('Added to wishlist!', 'success');
      } else {
        // Handle guest wishlist locally
        const guestWishlistItem = {
          _id: `guest_${productId}_${Date.now()}`,
          product: product || { _id: productId },
          addedAt: new Date().toISOString()
        };

        const savedWishlist = localStorage.getItem('guestWishlist');
        const currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
        const updatedWishlist = [guestWishlistItem, ...currentWishlist];

        localStorage.setItem('guestWishlist', JSON.stringify(updatedWishlist));
        dispatch({ type: WISHLIST_ACTIONS.ADD_TO_WISHLIST_SUCCESS, payload: guestWishlistItem });
        showNotification('Added to wishlist! Sign in to sync across devices.', 'success');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message || 'Failed to add to wishlist', 'error');
      throw error;
    }
  }, [isAuthenticated, state.items, showNotification, loadWishlist]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    if (!productId) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });

      if (isAuthenticated) {
        // Use backend API for authenticated users
        await wishlistService.removeFromWishlist(productId);
        dispatch({ type: WISHLIST_ACTIONS.REMOVE_FROM_WISHLIST_SUCCESS, payload: productId });
        showNotification('Removed from wishlist', 'success');
      } else {
        // Handle guest wishlist locally
        const savedWishlist = localStorage.getItem('guestWishlist');
        const currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
        const updatedWishlist = currentWishlist.filter(item => {
          const itemProductId = typeof item.product === 'string' ? item.product : item.product._id;
          return itemProductId !== productId;
        });

        localStorage.setItem('guestWishlist', JSON.stringify(updatedWishlist));
        dispatch({ type: WISHLIST_ACTIONS.REMOVE_FROM_WISHLIST_SUCCESS, payload: productId });
        showNotification('Removed from wishlist', 'success');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message || 'Failed to remove from wishlist', 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Sync local wishlist with backend (for guest to user conversion)
  const syncWishlistWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const localWishlist = localStorage.getItem('guestWishlist');
      if (localWishlist) {
        const localWishlistData = JSON.parse(localWishlist);
        if (localWishlistData.length > 0) {
          const productIds = localWishlistData.map(item =>
            typeof item.product === 'string' ? item.product : item.product._id
          );

          await wishlistService.syncWishlist(productIds);
          localStorage.removeItem('guestWishlist');
          await loadWishlist(); // Reload to get synced data
          showNotification('Wishlist synced successfully', 'success');
        }
      }
      dispatch({ type: WISHLIST_ACTIONS.SYNC_SUCCESS, payload: {} });
    } catch (error) {
      console.error('Error syncing wishlist:', error);
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification('Failed to sync wishlist', 'error');
    }
  }, [isAuthenticated, loadWishlist, showNotification]);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (productId, product = null) => {
    const isCurrentlyInWishlist = wishlistService.isInWishlist(productId, state.items);

    if (isCurrentlyInWishlist) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId, product);
    }
  }, [state.items, addToWishlist, removeFromWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    if (!productId) return false;
    return wishlistService.isInWishlist(productId, state.items);
  }, [state.items]);

  // Get wishlist item count
  const getWishlistCount = useCallback(() => {
    return wishlistService.getWishlistCount(state.items);
  }, [state.items]);

  // Clear wishlist (local state only)
  const clearWishlist = useCallback(() => {
    dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: WISHLIST_ACTIONS.CLEAR_ERROR });
  }, []);

  // Get wishlist items by category
  const getWishlistByCategory = useCallback((categoryId) => {
    return state.items.filter(item =>
      item.product.category === categoryId || item.product.category._id === categoryId
    );
  }, [state.items]);

  // Get recently added items
  const getRecentlyAdded = useCallback((limit = 5) => {
    return [...state.items]
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, limit);
  }, [state.items]);

  // Load wishlist on mount and authentication changes
  useEffect(() => {
    loadWishlist();
  }, [isAuthenticated, user?.id]);

  // Auto-sync wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      syncWishlistWithBackend();
    }
  }, [isAuthenticated, user?.id]);

  // Auto-sync wishlist periodically for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const syncInterval = setInterval(() => {
        loadWishlist(); // Refresh wishlist data
      }, 10 * 60 * 1000); // Sync every 10 minutes

      return () => clearInterval(syncInterval);
    }
  }, [isAuthenticated]);

  const value = useMemo(() => ({
    ...state,

    // Data loading methods
    loadWishlist,
    loadMoreWishlist,

    // Wishlist operations
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    syncWishlistWithBackend,

    // Utility methods
    isInWishlist,
    getWishlistCount,
    getWishlistByCategory,
    getRecentlyAdded,

    // State management
    clearWishlist,
    clearError
  }), [
    state,
    loadWishlist,
    loadMoreWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    syncWishlistWithBackend,
    isInWishlist,
    getWishlistCount,
    getWishlistByCategory,
    getRecentlyAdded,
    clearWishlist,
    clearError
  ]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// Hook to use wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;