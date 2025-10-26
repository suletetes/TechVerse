import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { userService } from '../api/services/index.js';
import cartService from '../api/services/cartService.js';
import { useAuth } from './AuthContext.jsx';
import { useDataSync } from '../hooks/useDataSync.js';

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null
};

// Action types
const CART_ACTIONS = {
  LOAD_CART_START: 'LOAD_CART_START',
  LOAD_CART_SUCCESS: 'LOAD_CART_SUCCESS',
  LOAD_CART_FAILURE: 'LOAD_CART_FAILURE',
  ADD_ITEM_START: 'ADD_ITEM_START',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  ADD_ITEM_FAILURE: 'ADD_ITEM_FAILURE',
  UPDATE_ITEM_START: 'UPDATE_ITEM_START',
  UPDATE_ITEM_SUCCESS: 'UPDATE_ITEM_SUCCESS',
  UPDATE_ITEM_FAILURE: 'UPDATE_ITEM_FAILURE',
  REMOVE_ITEM_START: 'REMOVE_ITEM_START',
  REMOVE_ITEM_SUCCESS: 'REMOVE_ITEM_SUCCESS',
  REMOVE_ITEM_FAILURE: 'REMOVE_ITEM_FAILURE',
  CLEAR_CART_START: 'CLEAR_CART_START',
  CLEAR_CART_SUCCESS: 'CLEAR_CART_SUCCESS',
  CLEAR_CART_FAILURE: 'CLEAR_CART_FAILURE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.LOAD_CART_START:
    case CART_ACTIONS.ADD_ITEM_START:
    case CART_ACTIONS.UPDATE_ITEM_START:
    case CART_ACTIONS.REMOVE_ITEM_START:
    case CART_ACTIONS.CLEAR_CART_START:
      return { ...state, isLoading: true, error: null };
    
    case CART_ACTIONS.LOAD_CART_SUCCESS:
      return {
        ...state,
        items: action.payload.cart || [],
        total: action.payload.summary?.subtotal || 0,
        itemCount: action.payload.summary?.totalQuantity || 0,
        isLoading: false,
        error: null
      };
    
    case CART_ACTIONS.ADD_ITEM_SUCCESS:
    case CART_ACTIONS.UPDATE_ITEM_SUCCESS:
    case CART_ACTIONS.REMOVE_ITEM_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null
      };
    
    case CART_ACTIONS.CLEAR_CART_SUCCESS:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        isLoading: false,
        error: null
      };
    
    case CART_ACTIONS.LOAD_CART_FAILURE:
    case CART_ACTIONS.ADD_ITEM_FAILURE:
    case CART_ACTIONS.UPDATE_ITEM_FAILURE:
    case CART_ACTIONS.REMOVE_ITEM_FAILURE:
    case CART_ACTIONS.CLEAR_CART_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    
    case CART_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case CART_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();
  const loadingRef = useRef(false);

  // Data synchronization for cart
  const { optimisticUpdate, forceRefresh, getCachedData } = useDataSync('cart', {
    conflictResolver: (operation, error) => {
      // For cart operations, merge quantities when possible
      if (error.data && operation.optimisticData) {
        const serverItems = error.data.cart || [];
        const localItems = operation.optimisticData.items || [];
        
        // Merge cart items by product ID
        const mergedItems = [...serverItems];
        localItems.forEach(localItem => {
          const existingIndex = mergedItems.findIndex(item => 
            item.product._id === localItem.product._id
          );
          if (existingIndex >= 0) {
            // Use higher quantity
            mergedItems[existingIndex].quantity = Math.max(
              mergedItems[existingIndex].quantity,
              localItem.quantity
            );
          } else {
            mergedItems.push(localItem);
          }
        });

        return {
          strategy: 'merge',
          data: { ...error.data, cart: mergedItems }
        };
      }
      return { strategy: 'server_wins', data: error.data };
    }
  });

  // Load cart from API
  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.LOAD_CART_FAILURE, payload: 'User not authenticated' });
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      dispatch({ type: CART_ACTIONS.LOAD_CART_START });
      const response = await cartService.getCart();
      dispatch({ type: CART_ACTIONS.LOAD_CART_SUCCESS, payload: response.data });
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: CART_ACTIONS.LOAD_CART_FAILURE, payload: error.message });
    } finally {
      loadingRef.current = false;
    }
  }, [isAuthenticated]);

  // Add item to cart with optimistic updates
  const addToCart = useCallback(async (productId, quantity = 1, variants = []) => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Please login to add items to cart' });
      return;
    }

    const optimisticItem = {
      product: { _id: productId },
      quantity,
      variants,
      _id: `temp_${Date.now()}`,
      _optimistic: true
    };

    try {
      dispatch({ type: CART_ACTIONS.ADD_ITEM_START });

      const result = await optimisticUpdate(
        { items: [...state.items, optimisticItem] },
        // Server operation
        async () => {
          const response = await cartService.addToCart(productId, quantity);
          return response.data;
        },
        // Rollback function
        () => {
          dispatch({ type: CART_ACTIONS.ADD_ITEM_FAILURE, payload: 'Failed to add item to cart' });
        }
      );

      if (!result.queued) {
        dispatch({ type: CART_ACTIONS.ADD_ITEM_SUCCESS });
        await loadCart(); // Reload to get accurate data
      } else {
        // Update state optimistically
        dispatch({ 
          type: CART_ACTIONS.LOAD_CART_SUCCESS, 
          payload: { cart: [...state.items, optimisticItem] }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: CART_ACTIONS.ADD_ITEM_FAILURE, payload: error.message });
      throw error;
    }
  }, [isAuthenticated, state.items, optimisticUpdate, loadCart]);

  // Update cart item quantity
  const updateCartItem = useCallback(async (itemId, updateData) => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_START });
      await cartService.updateCartItem(itemId, updateData.quantity);
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_SUCCESS });
      
      // Reload cart to get updated data
      await loadCart();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating cart item:', error);
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_FAILURE, payload: error.message });
      throw error;
    }
  }, [isAuthenticated, loadCart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId) => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_START });
      await cartService.removeFromCart(itemId);
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_SUCCESS });
      
      // Reload cart to get updated data
      await loadCart();
      
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_FAILURE, payload: error.message });
      throw error;
    }
  }, [isAuthenticated, loadCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.CLEAR_CART_START });
      await cartService.clearCart();
      dispatch({ type: CART_ACTIONS.CLEAR_CART_SUCCESS });
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: CART_ACTIONS.CLEAR_CART_FAILURE, payload: error.message });
      throw error;
    }
  }, [isAuthenticated]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
  }, []);

  // Load cart on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      // Clear cart when user logs out
      dispatch({ type: CART_ACTIONS.CLEAR_CART_SUCCESS });
    }
  }, [isAuthenticated, loadCart]);

  const value = useMemo(() => ({
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
    clearError
  }), [
    state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    loadCart,
    clearError
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;