import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { adminService, productService } from '../api/services/index.js';
import { useAuth } from './AuthContext.jsx';

// Initial state
const initialState = {
  // Dashboard data
  dashboardStats: null,
  analytics: null,
  
  // Products management
  adminProducts: [],
  productsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  },
  
  // Orders management
  adminOrders: [],
  ordersPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  },
  
  // Users management
  adminUsers: [],
  usersPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  },
  
  // Categories management
  categories: [],
  
  // Loading states
  isLoading: false,
  isDashboardLoading: false,
  isProductsLoading: false,
  isOrdersLoading: false,
  isUsersLoading: false,
  isCategoriesLoading: false,
  
  // Error states
  error: null,
  dashboardError: null,
  productsError: null,
  ordersError: null,
  usersError: null,
  categoriesError: null,
  
  // Filters
  productFilters: {
    status: null,
    category: null,
    search: '',
    sort: 'createdAt',
    order: 'desc'
  },
  orderFilters: {
    status: null,
    startDate: null,
    endDate: null,
    search: '',
    sort: 'createdAt',
    order: 'desc'
  },
  userFilters: {
    role: null,
    status: null,
    search: '',
    sort: 'createdAt',
    order: 'desc'
  }
};

// Action types
const ADMIN_ACTIONS = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_DASHBOARD_LOADING: 'SET_DASHBOARD_LOADING',
  SET_PRODUCTS_LOADING: 'SET_PRODUCTS_LOADING',
  SET_ORDERS_LOADING: 'SET_ORDERS_LOADING',
  SET_USERS_LOADING: 'SET_USERS_LOADING',
  SET_CATEGORIES_LOADING: 'SET_CATEGORIES_LOADING',
  
  // Error states
  SET_ERROR: 'SET_ERROR',
  SET_DASHBOARD_ERROR: 'SET_DASHBOARD_ERROR',
  SET_PRODUCTS_ERROR: 'SET_PRODUCTS_ERROR',
  SET_ORDERS_ERROR: 'SET_ORDERS_ERROR',
  SET_USERS_ERROR: 'SET_USERS_ERROR',
  SET_CATEGORIES_ERROR: 'SET_CATEGORIES_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Dashboard
  LOAD_DASHBOARD_SUCCESS: 'LOAD_DASHBOARD_SUCCESS',
  LOAD_ANALYTICS_SUCCESS: 'LOAD_ANALYTICS_SUCCESS',
  
  // Products
  LOAD_ADMIN_PRODUCTS_SUCCESS: 'LOAD_ADMIN_PRODUCTS_SUCCESS',
  LOAD_MORE_ADMIN_PRODUCTS_SUCCESS: 'LOAD_MORE_ADMIN_PRODUCTS_SUCCESS',
  CREATE_PRODUCT_SUCCESS: 'CREATE_PRODUCT_SUCCESS',
  UPDATE_PRODUCT_SUCCESS: 'UPDATE_PRODUCT_SUCCESS',
  DELETE_PRODUCT_SUCCESS: 'DELETE_PRODUCT_SUCCESS',
  
  // Orders
  LOAD_ADMIN_ORDERS_SUCCESS: 'LOAD_ADMIN_ORDERS_SUCCESS',
  LOAD_MORE_ADMIN_ORDERS_SUCCESS: 'LOAD_MORE_ADMIN_ORDERS_SUCCESS',
  UPDATE_ORDER_STATUS_SUCCESS: 'UPDATE_ORDER_STATUS_SUCCESS',
  
  // Users
  LOAD_ADMIN_USERS_SUCCESS: 'LOAD_ADMIN_USERS_SUCCESS',
  LOAD_MORE_ADMIN_USERS_SUCCESS: 'LOAD_MORE_ADMIN_USERS_SUCCESS',
  UPDATE_USER_STATUS_SUCCESS: 'UPDATE_USER_STATUS_SUCCESS',
  UPDATE_USER_ROLE_SUCCESS: 'UPDATE_USER_ROLE_SUCCESS',
  
  // Categories
  LOAD_CATEGORIES_SUCCESS: 'LOAD_CATEGORIES_SUCCESS',
  CREATE_CATEGORY_SUCCESS: 'CREATE_CATEGORY_SUCCESS',
  UPDATE_CATEGORY_SUCCESS: 'UPDATE_CATEGORY_SUCCESS',
  DELETE_CATEGORY_SUCCESS: 'DELETE_CATEGORY_SUCCESS',
  
  // Filters
  SET_PRODUCT_FILTERS: 'SET_PRODUCT_FILTERS',
  SET_ORDER_FILTERS: 'SET_ORDER_FILTERS',
  SET_USER_FILTERS: 'SET_USER_FILTERS',
  CLEAR_PRODUCT_FILTERS: 'CLEAR_PRODUCT_FILTERS',
  CLEAR_ORDER_FILTERS: 'CLEAR_ORDER_FILTERS',
  CLEAR_USER_FILTERS: 'CLEAR_USER_FILTERS'
};

// Reducer
const adminReducer = (state, action) => {
  switch (action.type) {
    // Loading states
    case ADMIN_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ADMIN_ACTIONS.SET_DASHBOARD_LOADING:
      return { ...state, isDashboardLoading: action.payload };
    case ADMIN_ACTIONS.SET_PRODUCTS_LOADING:
      return { ...state, isProductsLoading: action.payload };
    case ADMIN_ACTIONS.SET_ORDERS_LOADING:
      return { ...state, isOrdersLoading: action.payload };
    case ADMIN_ACTIONS.SET_USERS_LOADING:
      return { ...state, isUsersLoading: action.payload };
    case ADMIN_ACTIONS.SET_CATEGORIES_LOADING:
      return { ...state, isCategoriesLoading: action.payload };
    
    // Error states
    case ADMIN_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ADMIN_ACTIONS.SET_DASHBOARD_ERROR:
      return { ...state, dashboardError: action.payload, isDashboardLoading: false };
    case ADMIN_ACTIONS.SET_PRODUCTS_ERROR:
      return { ...state, productsError: action.payload, isProductsLoading: false };
    case ADMIN_ACTIONS.SET_ORDERS_ERROR:
      return { ...state, ordersError: action.payload, isOrdersLoading: false };
    case ADMIN_ACTIONS.SET_USERS_ERROR:
      return { ...state, usersError: action.payload, isUsersLoading: false };
    case ADMIN_ACTIONS.SET_CATEGORIES_ERROR:
      return { ...state, categoriesError: action.payload, isCategoriesLoading: false };
    case ADMIN_ACTIONS.CLEAR_ERROR:
      return { 
        ...state, 
        error: null, 
        dashboardError: null, 
        productsError: null, 
        ordersError: null, 
        usersError: null, 
        categoriesError: null 
      };
    
    // Dashboard
    case ADMIN_ACTIONS.LOAD_DASHBOARD_SUCCESS:
      return {
        ...state,
        dashboardStats: action.payload.data || action.payload,
        isDashboardLoading: false,
        dashboardError: null
      };
    
    case ADMIN_ACTIONS.LOAD_ANALYTICS_SUCCESS:
      return {
        ...state,
        analytics: action.payload.data || action.payload,
        isLoading: false,
        error: null
      };
    
    // Products
    case ADMIN_ACTIONS.LOAD_ADMIN_PRODUCTS_SUCCESS:
      return {
        ...state,
        adminProducts: action.payload.data?.products || [],
        productsPagination: {
          page: action.payload.data?.pagination?.currentPage || 1,
          limit: action.payload.data?.pagination?.limit || 20,
          total: action.payload.data?.pagination?.totalProducts || 0,
          totalPages: action.payload.data?.pagination?.totalPages || 0,
          hasMore: action.payload.data?.pagination?.hasNext || false
        },
        isProductsLoading: false,
        productsError: null
      };
    
    case ADMIN_ACTIONS.LOAD_MORE_ADMIN_PRODUCTS_SUCCESS:
      return {
        ...state,
        adminProducts: [...(Array.isArray(state.adminProducts) ? state.adminProducts : []), ...(action.payload.data?.products || [])],
        productsPagination: {
          page: action.payload.data?.pagination?.currentPage || state.productsPagination.page + 1,
          limit: action.payload.data?.pagination?.limit || state.productsPagination.limit,
          total: action.payload.data?.pagination?.totalProducts || state.productsPagination.total,
          totalPages: action.payload.data?.pagination?.totalPages || state.productsPagination.totalPages,
          hasMore: action.payload.data?.pagination?.hasNext || false
        },
        isProductsLoading: false,
        productsError: null
      };
    
    case ADMIN_ACTIONS.CREATE_PRODUCT_SUCCESS:
      return {
        ...state,
        adminProducts: [action.payload, ...(Array.isArray(state.adminProducts) ? state.adminProducts : [])],
        isProductsLoading: false,
        productsError: null
      };
    
    case ADMIN_ACTIONS.UPDATE_PRODUCT_SUCCESS:
      const updatedProduct = action.payload.data || action.payload;
      return {
        ...state,
        adminProducts: (Array.isArray(state.adminProducts) ? state.adminProducts : []).map(product =>
          product._id === updatedProduct._id ? updatedProduct : product
        ),
        isProductsLoading: false,
        productsError: null
      };
    
    case ADMIN_ACTIONS.DELETE_PRODUCT_SUCCESS:
      return {
        ...state,
        adminProducts: (Array.isArray(state.adminProducts) ? state.adminProducts : []).filter(product => product._id !== action.payload),
        isProductsLoading: false,
        productsError: null
      };    // 
Orders
    case ADMIN_ACTIONS.LOAD_ADMIN_ORDERS_SUCCESS:
      return {
        ...state,
        adminOrders: action.payload.data || [],
        ordersPagination: {
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
          hasMore: action.payload.hasMore || false
        },
        isOrdersLoading: false,
        ordersError: null
      };
    
    case ADMIN_ACTIONS.LOAD_MORE_ADMIN_ORDERS_SUCCESS:
      return {
        ...state,
        adminOrders: [...(state.adminOrders || []), ...(action.payload.data || [])],
        ordersPagination: {
          page: action.payload.page || state.ordersPagination.page + 1,
          limit: action.payload.limit || state.ordersPagination.limit,
          total: action.payload.total || state.ordersPagination.total,
          totalPages: action.payload.totalPages || state.ordersPagination.totalPages,
          hasMore: action.payload.hasMore || false
        },
        isOrdersLoading: false,
        ordersError: null
      };
    
    case ADMIN_ACTIONS.UPDATE_ORDER_STATUS_SUCCESS:
      const updatedOrder = action.payload.data || action.payload;
      return {
        ...state,
        adminOrders: (state.adminOrders || []).map(order =>
          order._id === updatedOrder._id ? updatedOrder : order
        ),
        isOrdersLoading: false,
        ordersError: null
      };
    
    // Users
    case ADMIN_ACTIONS.LOAD_ADMIN_USERS_SUCCESS:
      return {
        ...state,
        adminUsers: action.payload.data || [],
        usersPagination: {
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
          hasMore: action.payload.hasMore || false
        },
        isUsersLoading: false,
        usersError: null
      };
    
    case ADMIN_ACTIONS.LOAD_MORE_ADMIN_USERS_SUCCESS:
      return {
        ...state,
        adminUsers: [...(state.adminUsers || []), ...(action.payload.data || [])],
        usersPagination: {
          page: action.payload.page || state.usersPagination.page + 1,
          limit: action.payload.limit || state.usersPagination.limit,
          total: action.payload.total || state.usersPagination.total,
          totalPages: action.payload.totalPages || state.usersPagination.totalPages,
          hasMore: action.payload.hasMore || false
        },
        isUsersLoading: false,
        usersError: null
      };
    
    case ADMIN_ACTIONS.UPDATE_USER_STATUS_SUCCESS:
    case ADMIN_ACTIONS.UPDATE_USER_ROLE_SUCCESS:
      const updatedUser = action.payload.data || action.payload;
      return {
        ...state,
        adminUsers: (state.adminUsers || []).map(user =>
          user._id === updatedUser._id ? updatedUser : user
        ),
        isUsersLoading: false,
        usersError: null
      };
    
    // Categories
    case ADMIN_ACTIONS.LOAD_CATEGORIES_SUCCESS:
      const categoriesData = action.payload.data || action.payload || [];
      
      // Ensure we always have an array
      const validCategories = Array.isArray(categoriesData) ? categoriesData : [];
      
      return {
        ...state,
        categories: validCategories,
        isCategoriesLoading: false,
        categoriesError: null
      };
    
    case ADMIN_ACTIONS.CREATE_CATEGORY_SUCCESS:
      return {
        ...state,
        categories: [action.payload, ...(state.categories || [])],
        isCategoriesLoading: false,
        categoriesError: null
      };
    
    case ADMIN_ACTIONS.UPDATE_CATEGORY_SUCCESS:
      const updatedCategory = action.payload.data || action.payload;
      return {
        ...state,
        categories: (state.categories || []).map(category =>
          category._id === updatedCategory._id ? updatedCategory : category
        ),
        isCategoriesLoading: false,
        categoriesError: null
      };
    
    case ADMIN_ACTIONS.DELETE_CATEGORY_SUCCESS:
      return {
        ...state,
        categories: (state.categories || []).filter(category => category._id !== action.payload),
        isCategoriesLoading: false,
        categoriesError: null
      };
    
    // Filters
    case ADMIN_ACTIONS.SET_PRODUCT_FILTERS:
      return {
        ...state,
        productFilters: { ...state.productFilters, ...action.payload }
      };
    
    case ADMIN_ACTIONS.SET_ORDER_FILTERS:
      return {
        ...state,
        orderFilters: { ...state.orderFilters, ...action.payload }
      };
    
    case ADMIN_ACTIONS.SET_USER_FILTERS:
      return {
        ...state,
        userFilters: { ...state.userFilters, ...action.payload }
      };
    
    case ADMIN_ACTIONS.CLEAR_PRODUCT_FILTERS:
      return {
        ...state,
        productFilters: { ...initialState.productFilters }
      };
    
    case ADMIN_ACTIONS.CLEAR_ORDER_FILTERS:
      return {
        ...state,
        orderFilters: { ...initialState.orderFilters }
      };
    
    case ADMIN_ACTIONS.CLEAR_USER_FILTERS:
      return {
        ...state,
        userFilters: { ...initialState.userFilters }
      };
    
    default:
      return state;
  }
};

// Create context
const AdminContext = createContext();

// Provider component
export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { isAuthenticated, isAdmin, user } = useAuth();
  
  // Temporary notification function - will be enhanced later
  const showNotification = useCallback((message, type = 'info') => {
    if (import.meta.env.DEV) {
      console.log(`[ADMIN ${type.toUpperCase()}] ${message}`);
    }
  }, []);

  // Helper function to handle errors consistently
  const handleError = useCallback((error, actionType, defaultMessage) => {
    const errorMessage = error?.message || defaultMessage || 'An error occurred';
    dispatch({ type: actionType, payload: errorMessage });
    showNotification(errorMessage, 'error');
    return errorMessage;
  }, [showNotification]);

  // Dashboard methods
  const loadDashboardStats = useCallback(async (params = {}) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_DASHBOARD_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_DASHBOARD_LOADING, payload: true });
      const response = await adminService.getDashboardStats(params);
      dispatch({ type: ADMIN_ACTIONS.LOAD_DASHBOARD_SUCCESS, payload: response });
      return response;
    } catch (error) {
      console.error('[AdminContext] Dashboard stats error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load dashboard statistics';
      dispatch({ type: ADMIN_ACTIONS.SET_DASHBOARD_ERROR, payload: errorMessage });
      // Remove showNotification to prevent infinite re-renders
      return null;
    }
  }, [isAuthenticated, isAdmin]);

  const loadAnalytics = useCallback(async (params = {}) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: true });
      const response = await adminService.getAnalytics(params);
      dispatch({ type: ADMIN_ACTIONS.LOAD_ANALYTICS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      handleError(error, ADMIN_ACTIONS.SET_ERROR, 'Failed to load analytics');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Product management methods
  const loadAdminProducts = useCallback(async (params = {}, loadMore = false) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      
      const queryParams = {
        ...state.productFilters,
        ...params,
        page: loadMore ? state.productsPagination.page + 1 : (params.page || 1)
      };

      const response = await adminService.getAdminProducts(queryParams);
      
      const actionType = loadMore 
        ? ADMIN_ACTIONS.LOAD_MORE_ADMIN_PRODUCTS_SUCCESS 
        : ADMIN_ACTIONS.LOAD_ADMIN_PRODUCTS_SUCCESS;
      
      dispatch({ type: actionType, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, state.productFilters, state.productsPagination.page, showNotification]);

  const createProduct = useCallback(async (productData) => {
    console.log('🚀 AdminContext.createProduct called with:', productData);
    
    if (!isAuthenticated || !isAdmin()) {
      console.error('❌ Admin access required - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin());
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      console.log('📡 Calling productService.createProduct...');
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      const response = await productService.createProduct(productData);
      console.log('✅ Product created successfully:', response);
      dispatch({ type: ADMIN_ACTIONS.CREATE_PRODUCT_SUCCESS, payload: response.data || response });
      showNotification('Product created successfully!', 'success');
      return response;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Try to get detailed error information
      const errorData = error.data || error.response?.data || {};
      const errorMessage = errorData.message || error.message || 'Unknown error';
      const validationErrors = errorData.errors || [];
      
      console.error('❌ Error data:', errorData);
      console.error('❌ Validation errors:', validationErrors);
      
      // Create detailed error message
      let detailedMessage = errorMessage;
      if (validationErrors.length > 0) {
        const errorList = validationErrors.map(err => `${err.field}: ${err.message}`).join(', ');
        detailedMessage = `${errorMessage}\nValidation errors: ${errorList}`;
      }
      
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: detailedMessage });
      showNotification(detailedMessage, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const updateProduct = useCallback(async (productId, productData) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      const response = await productService.updateProduct(productId, productData);
      dispatch({ type: ADMIN_ACTIONS.UPDATE_PRODUCT_SUCCESS, payload: response });
      showNotification('Product updated successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const deleteProduct = useCallback(async (productId) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      await productService.deleteProduct(productId);
      dispatch({ type: ADMIN_ACTIONS.DELETE_PRODUCT_SUCCESS, payload: productId });
      showNotification('Product deleted successfully!', 'success');
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);  
// Order management methods
  const loadAdminOrders = useCallback(async (params = {}, loadMore = false) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_ORDERS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_ORDERS_LOADING, payload: true });
      
      const queryParams = {
        ...state.orderFilters,
        ...params,
        page: loadMore ? state.ordersPagination.page + 1 : (params.page || 1)
      };

      const response = await adminService.getAdminOrders(queryParams);
      
      const actionType = loadMore 
        ? ADMIN_ACTIONS.LOAD_MORE_ADMIN_ORDERS_SUCCESS 
        : ADMIN_ACTIONS.LOAD_ADMIN_ORDERS_SUCCESS;
      
      dispatch({ type: actionType, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_ORDERS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, state.orderFilters, state.ordersPagination.page, showNotification]);

  const updateOrderStatus = useCallback(async (orderId, status, notes = '') => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_ORDERS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_ORDERS_LOADING, payload: true });
      const response = await adminService.updateOrderStatus(orderId, status, notes);
      dispatch({ type: ADMIN_ACTIONS.UPDATE_ORDER_STATUS_SUCCESS, payload: response });
      showNotification('Order status updated successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_ORDERS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // User management methods
  const loadAdminUsers = useCallback(async (params = {}, loadMore = false) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_LOADING, payload: true });
      
      const queryParams = {
        ...state.userFilters,
        ...params,
        page: loadMore ? state.usersPagination.page + 1 : (params.page || 1)
      };

      const response = await adminService.getAdminUsers(queryParams);
      
      const actionType = loadMore 
        ? ADMIN_ACTIONS.LOAD_MORE_ADMIN_USERS_SUCCESS 
        : ADMIN_ACTIONS.LOAD_ADMIN_USERS_SUCCESS;
      
      dispatch({ type: actionType, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, state.userFilters, state.usersPagination.page, showNotification]);

  const updateUserStatus = useCallback(async (userId, status) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_LOADING, payload: true });
      const response = await adminService.updateUserStatus(userId, status);
      dispatch({ type: ADMIN_ACTIONS.UPDATE_USER_STATUS_SUCCESS, payload: response });
      showNotification('User status updated successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const updateUserRole = useCallback(async (userId, role) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_LOADING, payload: true });
      const response = await adminService.updateUserRole(userId, role);
      dispatch({ type: ADMIN_ACTIONS.UPDATE_USER_ROLE_SUCCESS, payload: response });
      showNotification('User role updated successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_USERS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Category management methods
  // Memoize admin status to prevent unnecessary re-renders
  const isUserAdmin = useMemo(() => isAdmin(), [isAuthenticated, user?.role]);

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated || !isUserAdmin) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_LOADING, payload: true });
      const response = await adminService.getCategories();
      dispatch({ type: ADMIN_ACTIONS.LOAD_CATEGORIES_SUCCESS, payload: response });
      return response;
    } catch (error) {
      console.warn('Failed to load categories from API, using fallback categories:', error.message);
      
      // Provide fallback categories if API fails
      const fallbackCategories = [
        { _id: 'phones', name: 'Phones', slug: 'phones', isActive: true },
        { _id: 'tablets', name: 'Tablets', slug: 'tablets', isActive: true },
        { _id: 'computers', name: 'Computers', slug: 'computers', isActive: true },
        { _id: 'tvs', name: 'TVs', slug: 'tvs', isActive: true },
        { _id: 'gaming', name: 'Gaming', slug: 'gaming', isActive: true },
        { _id: 'watches', name: 'Watches', slug: 'watches', isActive: true },
        { _id: 'audio', name: 'Audio', slug: 'audio', isActive: true },
        { _id: 'cameras', name: 'Cameras', slug: 'cameras', isActive: true },
        { _id: 'accessories', name: 'Accessories', slug: 'accessories', isActive: true },
        { _id: 'smart-home', name: 'Smart Home', slug: 'smart-home', isActive: true },
        { _id: 'fitness', name: 'Fitness', slug: 'fitness', isActive: true }
      ];
      
      dispatch({ type: ADMIN_ACTIONS.LOAD_CATEGORIES_SUCCESS, payload: { data: fallbackCategories } });
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: null }); // Clear error since we have fallback
      return { data: fallbackCategories };
    }
  }, [isAuthenticated, isUserAdmin]);

  const createCategory = useCallback(async (categoryData) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_LOADING, payload: true });
      const response = await adminService.createCategory(categoryData);
      dispatch({ type: ADMIN_ACTIONS.CREATE_CATEGORY_SUCCESS, payload: response.data || response });
      showNotification('Category created successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const updateCategory = useCallback(async (categoryId, categoryData) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_LOADING, payload: true });
      const response = await adminService.updateCategory(categoryId, categoryData);
      dispatch({ type: ADMIN_ACTIONS.UPDATE_CATEGORY_SUCCESS, payload: response });
      showNotification('Category updated successfully!', 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const deleteCategory = useCallback(async (categoryId) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_LOADING, payload: true });
      await adminService.deleteCategory(categoryId);
      dispatch({ type: ADMIN_ACTIONS.DELETE_CATEGORY_SUCCESS, payload: categoryId });
      showNotification('Category deleted successfully!', 'success');
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_CATEGORIES_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Bulk operations
  const bulkUpdateProducts = useCallback(async (productIds, updateData) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      const response = await adminService.bulkUpdateProducts(productIds, updateData);
      
      // Reload products to get updated data
      await loadAdminProducts();
      
      showNotification(`${productIds.length} products updated successfully!`, 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const bulkDeleteProducts = useCallback(async (productIds) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      const response = await adminService.bulkDeleteProducts(productIds);
      
      // Remove deleted products from state
      productIds.forEach(productId => {
        dispatch({ type: ADMIN_ACTIONS.DELETE_PRODUCT_SUCCESS, payload: productId });
      });
      
      showNotification(`${productIds.length} products deleted successfully!`, 'success');
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_PRODUCTS_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Export/Import methods
  const exportData = useCallback(async (type, params = {}) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: true });
      const blob = await adminService.exportData(type, params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: false });
      showNotification(`${type} data exported successfully!`, 'success');
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  const importData = useCallback(async (type, file) => {
    if (!isAuthenticated || !isAdmin()) {
      dispatch({ type: ADMIN_ACTIONS.SET_ERROR, payload: 'Admin access required' });
      return;
    }

    try {
      dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: true });
      const response = await adminService.importData(type, file);
      dispatch({ type: ADMIN_ACTIONS.SET_LOADING, payload: false });
      showNotification(`${type} data imported successfully!`, 'success');
      
      // Reload relevant data
      if (type === 'products') await loadAdminProducts();
      if (type === 'categories') await loadCategories();
      
      return response;
    } catch (error) {
      dispatch({ type: ADMIN_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [isAuthenticated, isAdmin, loadAdminProducts, loadCategories, showNotification]);

  // Filter methods
  const setProductFilters = useCallback((filters) => {
    dispatch({ type: ADMIN_ACTIONS.SET_PRODUCT_FILTERS, payload: filters });
  }, []);

  const setOrderFilters = useCallback((filters) => {
    dispatch({ type: ADMIN_ACTIONS.SET_ORDER_FILTERS, payload: filters });
  }, []);

  const setUserFilters = useCallback((filters) => {
    dispatch({ type: ADMIN_ACTIONS.SET_USER_FILTERS, payload: filters });
  }, []);

  const clearProductFilters = useCallback(() => {
    dispatch({ type: ADMIN_ACTIONS.CLEAR_PRODUCT_FILTERS });
  }, []);

  const clearOrderFilters = useCallback(() => {
    dispatch({ type: ADMIN_ACTIONS.CLEAR_ORDER_FILTERS });
  }, []);

  const clearUserFilters = useCallback(() => {
    dispatch({ type: ADMIN_ACTIONS.CLEAR_USER_FILTERS });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ADMIN_ACTIONS.CLEAR_ERROR });
  }, []);

  // Ensure categories is always an array
  // Debug logging for categories (no direct mutation)
  if (!Array.isArray(state.categories)) {
    console.warn('⚠️ AdminContext: categories is not an array, will fix in value object...', typeof state.categories);
  }

  const value = {
    ...state,
    // Ensure all arrays are always arrays
    adminProducts: Array.isArray(state.adminProducts) ? state.adminProducts : [],
    adminOrders: Array.isArray(state.adminOrders) ? state.adminOrders : [],
    adminUsers: Array.isArray(state.adminUsers) ? state.adminUsers : [],
    categories: Array.isArray(state.categories) ? state.categories : [],
    
    // Dashboard methods
    loadDashboardStats,
    loadAnalytics,
    
    // Product management
    loadAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkUpdateProducts,
    bulkDeleteProducts,
    
    // Order management
    loadAdminOrders,
    updateOrderStatus,
    
    // User management
    loadAdminUsers,
    updateUserStatus,
    updateUserRole,
    
    // Category management
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Export/Import
    exportData,
    importData,
    
    // Filter methods
    setProductFilters,
    setOrderFilters,
    setUserFilters,
    clearProductFilters,
    clearOrderFilters,
    clearUserFilters,
    
    // Utility
    clearError
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// Hook to use admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;