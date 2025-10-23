import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { productService } from '../api/services/index.js';
import { useDataSync } from '../hooks/useDataSync.js';

// Initial state
const initialState = {
  products: [],
  featuredProducts: [],
  topSellingProducts: [],
  latestProducts: [],
  productsOnSale: [],
  quickPicks: [],
  categories: [],
  currentProduct: null,
  searchResults: [],
  relatedProducts: [],
  reviews: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  },
  filters: {
    category: null,
    minPrice: null,
    maxPrice: null,
    inStock: null,
    sort: 'createdAt',
    order: 'desc'
  },
  searchQuery: ''
};

// Action types
const PRODUCT_ACTIONS = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Products
  LOAD_PRODUCTS_SUCCESS: 'LOAD_PRODUCTS_SUCCESS',
  LOAD_MORE_PRODUCTS_SUCCESS: 'LOAD_MORE_PRODUCTS_SUCCESS',

  // Featured products
  LOAD_FEATURED_PRODUCTS_SUCCESS: 'LOAD_FEATURED_PRODUCTS_SUCCESS',

  // Top selling products
  LOAD_TOP_SELLING_SUCCESS: 'LOAD_TOP_SELLING_SUCCESS',

  // Latest products
  LOAD_LATEST_PRODUCTS_SUCCESS: 'LOAD_LATEST_PRODUCTS_SUCCESS',

  // Products on sale
  LOAD_PRODUCTS_ON_SALE_SUCCESS: 'LOAD_PRODUCTS_ON_SALE_SUCCESS',

  // Quick picks
  LOAD_QUICK_PICKS_SUCCESS: 'LOAD_QUICK_PICKS_SUCCESS',

  // Categories
  LOAD_CATEGORIES_SUCCESS: 'LOAD_CATEGORIES_SUCCESS',

  // Single product
  LOAD_PRODUCT_SUCCESS: 'LOAD_PRODUCT_SUCCESS',
  CLEAR_CURRENT_PRODUCT: 'CLEAR_CURRENT_PRODUCT',

  // Search
  SEARCH_PRODUCTS_SUCCESS: 'SEARCH_PRODUCTS_SUCCESS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  CLEAR_SEARCH: 'CLEAR_SEARCH',

  // Related products
  LOAD_RELATED_PRODUCTS_SUCCESS: 'LOAD_RELATED_PRODUCTS_SUCCESS',

  // Reviews
  LOAD_REVIEWS_SUCCESS: 'LOAD_REVIEWS_SUCCESS',
  ADD_REVIEW_SUCCESS: 'ADD_REVIEW_SUCCESS',

  // Filters
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',

  // Pagination
  SET_PAGINATION: 'SET_PAGINATION'
};

// Reducer
const productReducer = (state, action) => {
  switch (action.type) {
    case PRODUCT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case PRODUCT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case PRODUCT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case PRODUCT_ACTIONS.LOAD_PRODUCTS_SUCCESS:
      return {
        ...state,
        products: action.payload.data || [],
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

    case PRODUCT_ACTIONS.LOAD_MORE_PRODUCTS_SUCCESS:
      return {
        ...state,
        products: [...state.products, ...(action.payload.data || [])],
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

    case PRODUCT_ACTIONS.LOAD_FEATURED_PRODUCTS_SUCCESS:
      return {
        ...state,
        featuredProducts: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_TOP_SELLING_SUCCESS:
      return {
        ...state,
        topSellingProducts: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_LATEST_PRODUCTS_SUCCESS:
      return {
        ...state,
        latestProducts: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_PRODUCTS_ON_SALE_SUCCESS:
      return {
        ...state,
        productsOnSale: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_QUICK_PICKS_SUCCESS:
      return {
        ...state,
        quickPicks: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_CATEGORIES_SUCCESS:
      return {
        ...state,
        categories: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_PRODUCT_SUCCESS:
      return {
        ...state,
        currentProduct: action.payload.data || action.payload,
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.CLEAR_CURRENT_PRODUCT:
      return {
        ...state,
        currentProduct: null,
        relatedProducts: [],
        reviews: []
      };

    case PRODUCT_ACTIONS.SEARCH_PRODUCTS_SUCCESS:
      return {
        ...state,
        searchResults: action.payload.data || [],
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

    case PRODUCT_ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };

    case PRODUCT_ACTIONS.CLEAR_SEARCH:
      return {
        ...state,
        searchResults: [],
        searchQuery: '',
        pagination: { ...initialState.pagination }
      };

    case PRODUCT_ACTIONS.LOAD_RELATED_PRODUCTS_SUCCESS:
      return {
        ...state,
        relatedProducts: action.payload.data || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.LOAD_REVIEWS_SUCCESS:
      return {
        ...state,
        reviews: action.payload.data?.reviews || action.payload.reviews || action.payload || [],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.ADD_REVIEW_SUCCESS:
      return {
        ...state,
        reviews: [action.payload, ...state.reviews],
        isLoading: false,
        error: null
      };

    case PRODUCT_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case PRODUCT_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: { ...initialState.filters }
      };

    case PRODUCT_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload }
      };

    default:
      return state;
  }
};

// Create context
const ProductContext = createContext();

// Provider component
export const ProductProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  // Request deduplication - prevent multiple simultaneous calls
  const activeRequests = React.useRef(new Set());

  // Data synchronization
  const { optimisticUpdate, forceRefresh, getCachedData, invalidateCache } = useDataSync('products', {
    conflictResolver: (operation, error) => {
      // For products, server usually wins unless it's a new product
      if (operation.options?.isNew) {
        return { strategy: 'client_wins' };
      }
      return { strategy: 'server_wins', data: error.data };
    }
  });

  // Cleanup active requests on unmount
  React.useEffect(() => {
    return () => {
      activeRequests.current.clear();
    };
  }, []);

  // Temporary notification function - will be enhanced later
  const showNotification = useCallback((message, type = 'info') => {
    if (import.meta.env.DEV) {
      console.log(`[PRODUCT ${type.toUpperCase()}] ${message}`);
    }
  }, []);

  // Load products with filters and pagination
  const loadProducts = useCallback(async (params = {}, loadMore = false) => {
    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });

      const queryParams = {
        ...params,
        page: loadMore ? (params.page || 1) + 1 : (params.page || 1)
      };

      const response = await productService.getProducts(queryParams);

      const actionType = loadMore
        ? PRODUCT_ACTIONS.LOAD_MORE_PRODUCTS_SUCCESS
        : PRODUCT_ACTIONS.LOAD_PRODUCTS_SUCCESS;

      dispatch({ type: actionType, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]); // Remove state dependencies

  // Load more products (pagination)
  const loadMoreProducts = useCallback(async (currentPagination, isCurrentlyLoading) => {
    if (!currentPagination?.hasMore || isCurrentlyLoading) return;
    return loadProducts({ page: currentPagination.page + 1 }, true);
  }, [loadProducts]);

  // Load featured products
  const loadFeaturedProducts = useCallback(async (limit = 10) => {
    const requestKey = `featured-${limit}`;
    if (activeRequests.current.has(requestKey)) {
      console.log('Skipping duplicate request:', requestKey);
      return;
    }

    try {
      activeRequests.current.add(requestKey);
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getFeaturedProducts(limit);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_FEATURED_PRODUCTS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    } finally {
      activeRequests.current.delete(requestKey);
    }
  }, [showNotification]);

  // Load top selling products
  const loadTopSellingProducts = useCallback(async (limit = 10, timeframe = null) => {
    const requestKey = `top-selling-${limit}-${timeframe}`;
    if (activeRequests.current.has(requestKey)) {
      console.log('Skipping duplicate request:', requestKey);
      return;
    }

    try {
      activeRequests.current.add(requestKey);
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getTopSellingProducts(limit, timeframe);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_TOP_SELLING_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    } finally {
      activeRequests.current.delete(requestKey);
    }
  }, [showNotification]);

  // Load latest products
  const loadLatestProducts = useCallback(async (limit = 10) => {
    const requestKey = `latest-${limit}`;
    if (activeRequests.current.has(requestKey)) {
      console.log('Skipping duplicate request:', requestKey);
      return;
    }

    try {
      activeRequests.current.add(requestKey);
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getLatestProducts(limit);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_LATEST_PRODUCTS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    } finally {
      activeRequests.current.delete(requestKey);
    }
  }, [showNotification]);

  // Load products on sale
  const loadProductsOnSale = useCallback(async (limit = 10) => {
    const requestKey = `on-sale-${limit}`;
    if (activeRequests.current.has(requestKey)) {
      console.log('Skipping duplicate request:', requestKey);
      return;
    }

    try {
      activeRequests.current.add(requestKey);
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getProductsOnSale(limit);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_PRODUCTS_ON_SALE_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    } finally {
      activeRequests.current.delete(requestKey);
    }
  }, [showNotification]);

  // Load quick picks
  const loadQuickPicks = useCallback(async (limit = 8) => {
    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getQuickPicks(limit);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_QUICK_PICKS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getCategories();
      dispatch({ type: PRODUCT_ACTIONS.LOAD_CATEGORIES_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]);
  // Load single product
  const loadProduct = useCallback(async (productId) => {
    if (!productId) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getProductById(productId);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_PRODUCT_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]);

  // Load products by category
  const loadProductsByCategory = useCallback(async (categoryId, params = {}) => {
    if (!categoryId) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: 'Category ID is required' });
      return;
    }

    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getProductsByCategory(categoryId, params);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_PRODUCTS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]);

  // Search products
  const searchProducts = useCallback(async (query, filters = {}, loadMore = false) => {
    if (!query || query.trim().length < 2) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: 'Search query must be at least 2 characters' });
      return;
    }

    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });

      const searchParams = {
        ...filters,
        page: loadMore ? (filters.page || 1) + 1 : 1
      };

      const response = await productService.searchProducts(query, searchParams);

      dispatch({ type: PRODUCT_ACTIONS.SET_SEARCH_QUERY, payload: query });
      dispatch({ type: PRODUCT_ACTIONS.SEARCH_PRODUCTS_SUCCESS, payload: response });

      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]);

  // Load related products
  const loadRelatedProducts = useCallback(async (productId, limit = 4) => {
    if (!productId) return;

    try {
      const response = await productService.getRelatedProducts(productId, limit);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_RELATED_PRODUCTS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      console.error('Error loading related products:', error);
      // Don't show notification for related products error as it's not critical
    }
  }, []);

  // Load product reviews
  const loadProductReviews = useCallback(async (productId, params = {}) => {
    if (!productId) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    try {
      dispatch({ type: PRODUCT_ACTIONS.SET_LOADING, payload: true });
      const response = await productService.getProductReviews(productId, params);
      dispatch({ type: PRODUCT_ACTIONS.LOAD_REVIEWS_SUCCESS, payload: response });
      return response;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification]);

  // Add product review with optimistic updates
  const addProductReview = useCallback(async (productId, reviewData) => {
    if (!productId) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: 'Product ID is required' });
      return;
    }

    const optimisticReview = {
      ...reviewData,
      _id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      _optimistic: true
    };

    try {
      // Optimistic update
      const result = await optimisticUpdate(
        optimisticReview,
        // Server operation
        async () => {
          const response = await productService.addProductReview(productId, reviewData);
          return response.data || response;
        },
        // Rollback function
        () => {
          dispatch({ 
            type: PRODUCT_ACTIONS.SET_ERROR, 
            payload: 'Failed to add review, rolling back...' 
          });
          // Remove optimistic review from state
          const currentReviews = state.reviews.filter(r => r._id !== optimisticReview._id);
          dispatch({ 
            type: PRODUCT_ACTIONS.LOAD_REVIEWS_SUCCESS, 
            payload: currentReviews 
          });
        }
      );

      if (!result.queued) {
        dispatch({ type: PRODUCT_ACTIONS.ADD_REVIEW_SUCCESS, payload: result });
        showNotification('Review added successfully!', 'success');
      } else {
        dispatch({ type: PRODUCT_ACTIONS.ADD_REVIEW_SUCCESS, payload: optimisticReview });
        showNotification('Review added (will sync when online)', 'info');
      }

      return result;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      showNotification(error.message, 'error');
      throw error;
    }
  }, [showNotification, optimisticUpdate, state.reviews]);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: PRODUCT_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    dispatch({ type: PRODUCT_ACTIONS.CLEAR_FILTERS });
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    dispatch({ type: PRODUCT_ACTIONS.CLEAR_SEARCH });
  }, []);

  // Clear current product
  const clearCurrentProduct = useCallback(() => {
    dispatch({ type: PRODUCT_ACTIONS.CLEAR_CURRENT_PRODUCT });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: PRODUCT_ACTIONS.CLEAR_ERROR });
  }, []);

  // Cache management functions
  const refreshProducts = useCallback(async () => {
    try {
      const freshData = await forceRefresh(() => productService.getProducts());
      dispatch({ type: PRODUCT_ACTIONS.LOAD_PRODUCTS_SUCCESS, payload: freshData });
      return freshData;
    } catch (error) {
      dispatch({ type: PRODUCT_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [forceRefresh]);

  const invalidateProductCache = useCallback(() => {
    invalidateCache();
    dispatch({ type: PRODUCT_ACTIONS.CLEAR_ERROR });
  }, [invalidateCache]);

  const getCachedProducts = useCallback(() => {
    return getCachedData();
  }, [getCachedData]);

  // Utility functions - use current state values to avoid stale closures
  const getProductById = useCallback((productId) => {
    return state.products.find(product => product._id === productId) ||
      state.searchResults.find(product => product._id === productId) ||
      state.featuredProducts.find(product => product._id === productId);
  }, [state.products, state.searchResults, state.featuredProducts]);

  const getCategoryById = useCallback((categoryId) => {
    return state.categories.find(category => category._id === categoryId);
  }, [state.categories]);

  const isProductInResults = useCallback((productId) => {
    return state.products.some(product => product._id === productId) ||
      state.searchResults.some(product => product._id === productId);
  }, [state.products, state.searchResults]);

  // Filter products by criteria
  const filterProducts = useCallback((products, criteria) => {
    return products.filter(product => {
      if (criteria.category && product.category._id !== criteria.category) return false;
      if (criteria.minPrice && product.price < criteria.minPrice) return false;
      if (criteria.maxPrice && product.price > criteria.maxPrice) return false;
      if (criteria.inStock !== undefined && product.inStock !== criteria.inStock) return false;
      if (criteria.rating && product.averageRating < criteria.rating) return false;
      return true;
    });
  }, []);

  // Sort products
  const sortProducts = useCallback((products, sortBy, order = 'asc') => {
    return [...products].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested properties
      if (sortBy.includes('.')) {
        const keys = sortBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  // Get filtered and sorted products
  const getFilteredProducts = useCallback(() => {
    let products = state.searchQuery ? state.searchResults : state.products;

    // Apply client-side filters if needed
    if (Object.values(state.filters).some(value => value !== null && value !== '')) {
      products = filterProducts(products, state.filters);
    }

    return products;
  }, [state.products, state.searchResults, state.searchQuery, state.filters, filterProducts]);

  const value = useMemo(() => ({
    ...state,

    // Data loading methods
    loadProducts,
    loadMoreProducts,
    loadFeaturedProducts,
    loadTopSellingProducts,
    loadLatestProducts,
    loadProductsOnSale,
    loadQuickPicks,
    loadCategories,
    loadProduct,
    loadProductsByCategory,
    searchProducts,
    loadRelatedProducts,
    loadProductReviews,
    addProductReview,

    // State management
    setFilters,
    clearFilters,
    clearSearch,
    clearCurrentProduct,
    clearError,

    // Utility methods
    getProductById,
    getCategoryById,
    isProductInResults,
    filterProducts,
    sortProducts,
    getFilteredProducts,

    // Cache management
    refreshProducts,
    invalidateProductCache,
    getCachedProducts
  }), [
    state,
    loadProducts,
    loadMoreProducts,
    loadFeaturedProducts,
    loadTopSellingProducts,
    loadLatestProducts,
    loadProductsOnSale,
    loadQuickPicks,
    loadCategories,
    loadProduct,
    loadProductsByCategory,
    searchProducts,
    loadRelatedProducts,
    loadProductReviews,
    addProductReview,
    setFilters,
    clearFilters,
    clearSearch,
    clearCurrentProduct,
    clearError,
    getProductById,
    getCategoryById,
    isProductInResults,
    filterProducts,
    sortProducts,
    getFilteredProducts,
    refreshProducts,
    invalidateProductCache,
    getCachedProducts
  ]);

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

// Hook to use product context
export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

export default ProductContext;