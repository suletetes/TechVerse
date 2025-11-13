import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { orderService } from '../api/services/index.js';
import { useAuth } from './AuthContext.jsx';

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  orderTracking: null,
  orderSummary: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  },
  filters: {
    status: null,
    startDate: null,
    endDate: null,
    sort: 'createdAt',
    order: 'desc'
  }
};

// Action types
const ORDER_ACTIONS = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Orders
  LOAD_ORDERS_SUCCESS: 'LOAD_ORDERS_SUCCESS',
  LOAD_MORE_ORDERS_SUCCESS: 'LOAD_MORE_ORDERS_SUCCESS',
  CREATE_ORDER_SUCCESS: 'CREATE_ORDER_SUCCESS',

  // Single order
  LOAD_ORDER_SUCCESS: 'LOAD_ORDER_SUCCESS',
  UPDATE_ORDER_SUCCESS: 'UPDATE_ORDER_SUCCESS',
  CANCEL_ORDER_SUCCESS: 'CANCEL_ORDER_SUCCESS',
  CLEAR_CURRENT_ORDER: 'CLEAR_CURRENT_ORDER',

  // Order tracking
  LOAD_TRACKING_SUCCESS: 'LOAD_TRACKING_SUCCESS',
  CLEAR_TRACKING: 'CLEAR_TRACKING',

  // Order summary
  LOAD_SUMMARY_SUCCESS: 'LOAD_SUMMARY_SUCCESS',

  // Filters
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',

  // Pagination
  SET_PAGINATION: 'SET_PAGINATION'
};

// Reducer
const orderReducer = (state, action) => {
  switch (action.type) {
    case ORDER_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case ORDER_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ORDER_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ORDER_ACTIONS.LOAD_ORDERS_SUCCESS:
      return {
        ...state,
        orders: action.payload.data?.orders || action.payload.data || [],
        pagination: {
          page: action.payload.data?.pagination?.currentPage || action.payload.page || 1,
          limit: action.payload.data?.pagination?.limit || action.payload.limit || 10,
          total: action.payload.data?.pagination?.totalOrders || action.payload.total || 0,
          totalPages: action.payload.data?.pagination?.totalPages || action.payload.totalPages || 0,
          hasMore: action.payload.data?.pagination?.hasNextPage || action.payload.hasMore || false
        },
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.LOAD_MORE_ORDERS_SUCCESS:
      return {
        ...state,
        orders: [...state.orders, ...(action.payload.data?.orders || action.payload.data || [])],
        pagination: {
          page: action.payload.data?.pagination?.currentPage || action.payload.page || state.pagination.page + 1,
          limit: action.payload.data?.pagination?.limit || action.payload.limit || state.pagination.limit,
          total: action.payload.data?.pagination?.totalOrders || action.payload.total || state.pagination.total,
          totalPages: action.payload.data?.pagination?.totalPages || action.payload.totalPages || state.pagination.totalPages,
          hasMore: action.payload.data?.pagination?.hasNextPage || action.payload.hasMore || false
        },
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.CREATE_ORDER_SUCCESS:
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        currentOrder: action.payload,
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.LOAD_ORDER_SUCCESS:
      return {
        ...state,
        currentOrder: action.payload.data || action.payload,
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.UPDATE_ORDER_SUCCESS:
    case ORDER_ACTIONS.CANCEL_ORDER_SUCCESS:
      const updatedOrder = action.payload.data || action.payload;
      return {
        ...state,
        currentOrder: state.currentOrder?._id === updatedOrder._id ? updatedOrder : state.currentOrder,
        orders: state.orders.map(order =>
          order._id === updatedOrder._id ? updatedOrder : order
        ),
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.CLEAR_CURRENT_ORDER:
      return {
        ...state,
        currentOrder: null,
        orderTracking: null
      };

    case ORDER_ACTIONS.LOAD_TRACKING_SUCCESS:
      return {
        ...state,
        orderTracking: action.payload.data || action.payload,
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.CLEAR_TRACKING:
      return {
        ...state,
        orderTracking: null
      };

    case ORDER_ACTIONS.LOAD_SUMMARY_SUCCESS:
      return {
        ...state,
        orderSummary: action.payload.data || action.payload,
        isLoading: false,
        error: null
      };

    case ORDER_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case ORDER_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: { ...initialState.filters }
      };

    case ORDER_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    default:
      return state;
  }
};

// Create context
const OrderContext = createContext();

// Provider component
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);
  const { isAuthenticated } = useAuth();
  
  // Temporary notification function - will be enhanced later
  const showNotification = useCallback((message, type = 'info') => {
    if (import.meta.env.DEV) {
      console.log(`[ORDER ${type.toUpperCase()}] ${message}`);
    }
  }, []);

  // Load user orders
  const loadOrders = useCallback(async (params = {}, loadMore = false) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });

      const queryParams = {
        ...state.filters,
        ...params,
        page: loadMore ? state.pagination.page + 1 : (params.page || 1)
      };

      const response = await orderService.getUserOrders(queryParams);

      const actionType = loadMore
        ? ORDER_ACTIONS.LOAD_MORE_ORDERS_SUCCESS
        : ORDER_ACTIONS.LOAD_ORDERS_SUCCESS;

      dispatch({ type: actionType, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, state.filters, state.pagination.page, showNotification]);

  // Load more orders (pagination)
  const loadMoreOrders = useCallback(async () => {
    if (!state.pagination.hasMore || state.isLoading) return;
    return loadOrders({}, true);
  }, [loadOrders, state.pagination.hasMore, state.isLoading]);

  // Create new order
  const createOrder = useCallback(async (orderData) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.createOrder(orderData);
      dispatch({ type: ORDER_ACTIONS.CREATE_ORDER_SUCCESS, payload: response.data || response });
      showNotification('Order created successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Load single order
  const loadOrder = useCallback(async (orderId) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.getOrderById(orderId);
      dispatch({ type: ORDER_ACTIONS.LOAD_ORDER_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);
  // Cancel order
  const cancelOrder = useCallback(async (orderId, reason = '') => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.cancelOrder(orderId, reason);
      dispatch({ type: ORDER_ACTIONS.CANCEL_ORDER_SUCCESS, payload: response });
      showNotification('Order cancelled successfully', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Load order tracking
  const loadOrderTracking = useCallback(async (orderId) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.getOrderTracking(orderId);
      dispatch({ type: ORDER_ACTIONS.LOAD_TRACKING_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Process payment
  const processPayment = useCallback(async (orderId, paymentData) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.processPayment(orderId, paymentData);
      dispatch({ type: ORDER_ACTIONS.UPDATE_ORDER_SUCCESS, payload: response });
      showNotification('Payment processed successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Load order summary
  const loadOrderSummary = useCallback(async (params = {}) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.getOrderSummary(params);
      dispatch({ type: ORDER_ACTIONS.LOAD_SUMMARY_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Reorder
  const reorder = useCallback(async (orderId) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.reorder(orderId);
      dispatch({ type: ORDER_ACTIONS.CREATE_ORDER_SUCCESS, payload: response.data || response });
      showNotification('Order placed successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Request refund
  const requestRefund = useCallback(async (orderId, refundData) => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.requestRefund(orderId, refundData);
      dispatch({ type: ORDER_ACTIONS.UPDATE_ORDER_SUCCESS, payload: response });
      showNotification('Refund request submitted successfully', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Get order invoice
  const getOrderInvoice = useCallback(async (orderId, format = 'pdf') => {
    if (!isAuthenticated) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'User not authenticated' });
      return;
    }

    if (!orderId) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: 'Order ID is required' });
      return;
    }

    try {
      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: true });
      const response = await orderService.getOrderInvoice(orderId, format);

      if (format === 'pdf') {
        // Create download link for PDF
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showNotification('Invoice downloaded successfully', 'success');
      }

      dispatch({ type: ORDER_ACTIONS.SET_LOADING, payload: false });
      return response;
    } catch (error) {
      dispatch({ type: ORDER_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, showNotification]);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: ORDER_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    dispatch({ type: ORDER_ACTIONS.CLEAR_FILTERS });
  }, []);

  // Clear current order
  const clearCurrentOrder = useCallback(() => {
    dispatch({ type: ORDER_ACTIONS.CLEAR_CURRENT_ORDER });
  }, []);

  // Clear tracking
  const clearTracking = useCallback(() => {
    dispatch({ type: ORDER_ACTIONS.CLEAR_TRACKING });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ORDER_ACTIONS.CLEAR_ERROR });
  }, []);

  // Utility functions
  const getOrderById = useCallback((orderId) => {
    return state.orders.find(order => order._id === orderId);
  }, [state.orders]);

  const getOrdersByStatus = useCallback((status) => {
    return state.orders.filter(order => order.status === status);
  }, [state.orders]);

  const getOrdersInDateRange = useCallback((startDate, endDate) => {
    return state.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
  }, [state.orders]);

  const calculateOrderTotal = useCallback((order) => {
    if (!order || !order.items) return 0;
    return orderService.calculateOrderTotal(
      order.items,
      order.shipping || 0,
      order.tax || 0,
      order.discount || 0
    );
  }, []);

  const formatOrderStatus = useCallback((status) => {
    return orderService.formatOrderStatus(status);
  }, []);

  const canCancelOrder = useCallback((order) => {
    if (!order) return false;
    const cancelableStatuses = ['pending', 'confirmed', 'processing'];
    return cancelableStatuses.includes(order.status);
  }, []);

  const canRequestRefund = useCallback((order) => {
    if (!order) return false;
    const refundableStatuses = ['delivered'];
    const orderDate = new Date(order.createdAt);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

    return refundableStatuses.includes(order.status) && daysSinceOrder <= 30; // 30 days return policy
  }, []);

  const getFilteredOrders = useCallback(() => {
    let filteredOrders = [...state.orders];

    if (state.filters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === state.filters.status);
    }

    if (state.filters.startDate) {
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.createdAt) >= new Date(state.filters.startDate)
      );
    }

    if (state.filters.endDate) {
      filteredOrders = filteredOrders.filter(order =>
        new Date(order.createdAt) <= new Date(state.filters.endDate)
      );
    }

    // Sort orders
    filteredOrders.sort((a, b) => {
      const aValue = a[state.filters.sort];
      const bValue = b[state.filters.sort];

      if (state.filters.order === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    return filteredOrders;
  }, [state.orders, state.filters]);

  const value = useMemo(() => ({
    ...state,

    // Data loading methods
    loadOrders,
    loadMoreOrders,
    createOrder,
    loadOrder,
    cancelOrder,
    loadOrderTracking,
    processPayment,
    loadOrderSummary,
    reorder,
    requestRefund,
    getOrderInvoice,

    // State management
    setFilters,
    clearFilters,
    clearCurrentOrder,
    clearTracking,
    clearError,

    // Utility methods
    getOrderById,
    getOrdersByStatus,
    getOrdersInDateRange,
    calculateOrderTotal,
    formatOrderStatus,
    canCancelOrder,
    canRequestRefund,
    getFilteredOrders
  }), [
    state,
    loadOrders,
    loadMoreOrders,
    createOrder,
    loadOrder,
    cancelOrder,
    loadOrderTracking,
    processPayment,
    loadOrderSummary,
    reorder,
    requestRefund,
    getOrderInvoice,
    setFilters,
    clearFilters,
    clearCurrentOrder,
    clearTracking,
    clearError,
    getOrderById,
    getOrdersByStatus,
    getOrdersInDateRange,
    calculateOrderTotal,
    formatOrderStatus,
    canCancelOrder,
    canRequestRefund,
    getFilteredOrders
  ]);

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Hook to use order context
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;