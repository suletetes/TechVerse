/**
 * Custom hook for homepage sections
 * Provides loading states, error handling, and data fetching for homepage components
 * Implements requirements 4.1, 4.2, 4.3, 4.4, 8.5
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '../api/services/index.js';

const SECTION_TYPES = {
  LATEST: 'latest',
  TOP_SELLERS: 'topSellers', 
  QUICK_PICKS: 'quickPicks',
  WEEKLY_DEALS: 'weeklyDeals'
};

const SECTION_CONFIG = {
  [SECTION_TYPES.LATEST]: {
    method: 'getLatestProducts',
    defaultLimit: 12,
    cacheKey: 'latest-products'
  },
  [SECTION_TYPES.TOP_SELLERS]: {
    method: 'getTopSellingProducts', 
    defaultLimit: 12,
    cacheKey: 'top-sellers'
  },
  [SECTION_TYPES.QUICK_PICKS]: {
    method: 'getQuickPicks',
    defaultLimit: 8,
    cacheKey: 'quick-picks'
  },
  [SECTION_TYPES.WEEKLY_DEALS]: {
    method: 'getProductsOnSale',
    defaultLimit: 10,
    cacheKey: 'weekly-deals'
  }
};

/**
 * Hook for managing homepage section data
 * @param {string} sectionType - Type of section (latest, topSellers, quickPicks, weeklyDeals)
 * @param {Object} options - Configuration options
 * @returns {Object} Section data, loading state, error state, and retry function
 */
export const useHomepageSection = (sectionType, options = {}) => {
  const {
    limit,
    autoLoad = true,
    onSuccess,
    onError,
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs to prevent memory leaks and stale closures
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);

  // Get section configuration
  const sectionConfig = SECTION_CONFIG[sectionType];
  
  if (!sectionConfig) {
    throw new Error(`Invalid section type: ${sectionType}. Must be one of: ${Object.values(SECTION_TYPES).join(', ')}`);
  }

  const effectiveLimit = limit || sectionConfig.defaultLimit;

  // Clear retry timeout on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (isRetry = false) => {
    if (!mountedRef.current) return;

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // Call the appropriate service method
      const serviceMethod = productService[sectionConfig.method];
      if (!serviceMethod) {
        throw new Error(`Service method ${sectionConfig.method} not found`);
      }

      let response;
      
      // Handle different method signatures
      if (sectionType === SECTION_TYPES.TOP_SELLERS) {
        response = await serviceMethod.call(productService, effectiveLimit, null);
      } else {
        response = await serviceMethod.call(productService, effectiveLimit);
      }

      if (!mountedRef.current) return;

      // Extract data from response
      const products = response?.data || response || [];
      
      // Ensure we have an array
      const safeProducts = Array.isArray(products) ? products : [];
      
      setData(safeProducts);
      setError(null);
      setRetryCount(0);

    } catch (err) {
      if (!mountedRef.current) return;

      console.error(`Error loading ${sectionType} products:`, err);
      
      const errorMessage = err.message || `Failed to load ${sectionType} products`;
      setError(errorMessage);

      // Auto-retry logic
      if (retryCount < maxRetries && !isRetry) {
        setRetryCount(prev => prev + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            fetchData(true);
          }
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    sectionType, 
    sectionConfig.method, 
    effectiveLimit, 
    retryCount, 
    maxRetries, 
    retryDelay
  ]);

  // Manual retry function
  const retry = useCallback(() => {
    setRetryCount(0);
    fetchData(false);
  }, [fetchData]);

  // Auto-load data on mount only
  useEffect(() => {
    if (autoLoad) {
      fetchData(false);
    }
  }, [autoLoad]); // Only depend on autoLoad, not fetchData

  // Refresh data function
  const refresh = useCallback(() => {
    setRetryCount(0);
    fetchData(false);
  }, [fetchData]);

  // Handle callbacks separately to avoid infinite loops
  useEffect(() => {
    if (data.length > 0 && onSuccess) {
      onSuccess(data, sectionType);
    }
  }, [data.length]); // Only trigger when data length changes

  useEffect(() => {
    if (error && onError) {
      onError(new Error(error), sectionType);
    }
  }, [error]);

  return {
    data,
    loading,
    error,
    retry,
    refresh,
    isEmpty: !loading && !error && data.length === 0,
    hasData: data.length > 0,
    retryCount,
    sectionType
  };
};

/**
 * Hook for managing multiple homepage sections
 * @param {Array} sections - Array of section configurations
 * @returns {Object} Combined state for all sections
 */
export const useHomepageSections = (sections = []) => {
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [sectionsData, setSectionsData] = useState({});

  // Track individual section states
  const sectionStates = sections.reduce((acc, section) => {
    const { sectionType, ...options } = section;
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[sectionType] = useHomepageSection(sectionType, {
      ...options,
      onSuccess: (data, type) => {
        setSectionsData(prev => ({
          ...prev,
          [type]: data
        }));
      },
      onError: (error, type) => {
        console.error(`Section ${type} error:`, error);
        setGlobalError(error.message);
      }
    });
    
    return acc;
  }, {});

  // Calculate global loading state
  useEffect(() => {
    const isAnyLoading = Object.values(sectionStates).some(state => state.loading);
    setGlobalLoading(isAnyLoading);
  }, [sectionStates]);

  // Retry all sections
  const retryAll = useCallback(() => {
    setGlobalError(null);
    Object.values(sectionStates).forEach(state => {
      if (state.error) {
        state.retry();
      }
    });
  }, [sectionStates]);

  // Refresh all sections
  const refreshAll = useCallback(() => {
    setGlobalError(null);
    Object.values(sectionStates).forEach(state => state.refresh());
  }, [sectionStates]);

  return {
    sections: sectionStates,
    data: sectionsData,
    globalLoading,
    globalError,
    retryAll,
    refreshAll,
    hasAnyData: Object.values(sectionsData).some(data => data && data.length > 0),
    hasAllData: sections.every(section => 
      sectionsData[section.sectionType] && sectionsData[section.sectionType].length > 0
    )
  };
};

export { SECTION_TYPES };
export default useHomepageSection;