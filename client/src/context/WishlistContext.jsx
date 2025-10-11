import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { userService } from '../api/services/index.js';
import { useAuth } from './AuthContext.jsx';
import { useNotification } from './NotificationContext.jsx';

// Initial state
const initialState = {
  items: [],
  isLoading: false,
  error: null,
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
  CLEAR_WISHLIST: 'CLEAR_WISHLIST'
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
    
    default:
      return state;
  }
};

// Create context
const WishlistContext = createContext();

// Provider component
export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  // Load wishlist
  const loadWishlist = useCallback(async (params = {}, loadMore = false) => {
    if (!isAuthenticated) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      
      const queryParams = {
        ...params,
        page: loadMore ? state.pagination.page + 1 : (params.page || 1)
      };

      const response = await userService.getWishlist(queryParams);
      
      const actionType = loadMore 
        ? WISHLIST_ACTIONS.LOAD_MORE_WISHLIST_SUCCESS 
        : WISHLIST_ACTIONS.LOAD_WISHLIST_SUCCESS;
      
      dispatch({ type: actionType, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, state.pagination.page, showNotification]);

  // Load more wishlist items
  const loadMoreWishlist = useCallback(async () => {
    if (!state.pagination.hasMore || state.isLoading) return;
    return loadWishlist({}, true);
  }, [loadWishlist, state.pagination.hasMore, state.isLoading]);

  // Add to wishlist
  const addToWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'Please login to add items to wishlist' });
      return;
    }

    if (!productId) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    // Check if item is already in wishlist
    const isAlreadyInWishlist = state.items.some(item => 
      item.product._id === productId || item.product === productId
    );

    if (isAlreadyInWishlist) {
      showNotification('Item is already in your wishlist', 'info');
      return;
    }

    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      const response = await userService.addToWishlist(productId);
      
      // If response contains the full item, use it; otherwise create a basic item
      const wishlistItem = response.item || response.data || { 
        product: { _id: productId },
        addedAt: new Date().toISOString()
      };
      
      dispatch({ type: WISHLIST_ACTIONS.ADD_TO_WISHLIST_SUCCESS, payload: wishlistItem });
      showNotification('Added to wishlist!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, state.items, showNotification]);

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId) => {
    if (!isAuthenticated) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!productId) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    try {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
      await userService.removeFromWishlist(productId);
      dispatch({ type: WISHLIST_ACTIONS.REMOVE_FROM_WISHLIST_SUCCESS, payload: productId });
      showNotification('Removed from wishlist', 'success');
    } catch (error) {
      dispatch({ type: WISHLIST_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (productId) => {
    const isInWishlist = state.items.some(item => 
      item.product._id === productId || item.product === productId
    );

    if (isInWishlist) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  }, [state.items, addToWishlist, removeFromWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    if (!productId) return false;
    return state.items.some(item => 
      item.product._id === productId || item.product === productId
    );
  }, [state.items]);

  // Get wishlist item count
  const getWishlistCount = useCallback(() => {
    return state.items.length;
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

  // Load wishlist on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      clearWishlist();
    }
  }, [isAuthenticated, loadWishlist, clearWishlist]);

  const value = {
    ...state,
    
    // Data loading methods
    loadWishlist,
    loadMoreWishlist,
    
    // Wishlist operations
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    
    // Utility methods
    isInWishlist,
    getWishlistCount,
    getWishlistByCategory,
    getRecentlyAdded,
    
    // State management
    clearWishlist,
    clearError
  };

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