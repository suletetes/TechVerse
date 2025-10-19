import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { userService } from '../api/services/index.js';
import { useAuth } from './AuthContext.jsx';

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

  // Load cart from API
  const loadCart = async () => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.LOAD_CART_FAILURE, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.LOAD_CART_START });
      const response = await userService.getCart();
      dispatch({ type: CART_ACTIONS.LOAD_CART_SUCCESS, payload: response.data });
    } catch (error) {
      dispatch({ type: CART_ACTIONS.LOAD_CART_FAILURE, payload: error.message });
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1, variants = []) => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'Please login to add items to cart' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.ADD_ITEM_START });
      await userService.addToCart({ productId, quantity, variants });
      dispatch({ type: CART_ACTIONS.ADD_ITEM_SUCCESS });
      
      // Reload cart to get updated data
      await loadCart();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: CART_ACTIONS.ADD_ITEM_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId, quantity) => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_START });
      await userService.updateCartItem(itemId, { quantity });
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_SUCCESS });
      
      // Reload cart to get updated data
      await loadCart();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_START });
      await userService.removeFromCart(itemId);
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_SUCCESS });
      
      // Reload cart to get updated data
      await loadCart();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: CART_ACTIONS.CLEAR_CART_START });
      await userService.clearCart();
      dispatch({ type: CART_ACTIONS.CLEAR_CART_SUCCESS });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: CART_ACTIONS.CLEAR_CART_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
  };

  // Load cart on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    }
  }, [isAuthenticated]);

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