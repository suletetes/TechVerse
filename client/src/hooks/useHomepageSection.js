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
    method: 'getProductsBySection',
    sectionName: 'latest',
    defaultLimit: 12,
    cacheKey: 'latest-products'
  },
  [SECTION_TYPES.TOP_SELLERS]: {
    method: 'getProductsBySection',
    sectionName: 'topSeller',
    defaultLimit: 12,
    cacheKey: 'top-sellers'
  },
  [SECTION_TYPES.QUICK_PICKS]: {
    method: 'getProductsBySection',
    sectionName: 'quickPick',
    defaultLimit: 8,
    cacheKey: 'quick-picks'
  },
  [SECTION_TYPES.WEEKLY_DEALS]: {
    method: 'getProductsBySection',
    sectionName: 'weeklyDeal',
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

  // Generate unique ID for this hook instance
  const instanceId = useRef(`${sectionType}-${Math.random().toString(36).substr(2, 9)}`);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs to prevent memory leaks and stale closures
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef(null);

  // Get section configuration and store in ref to ensure it's always current
  const sectionConfig = SECTION_CONFIG[sectionType];
  const sectionConfigRef = useRef(sectionConfig);
  
  // Update ref when config changes
  useEffect(() => {
    sectionConfigRef.current = sectionConfig;
  }, [sectionConfig]);
  
  console.log(`🆔 [HOOK_INSTANCE] Created/Rendered: ${instanceId.current}, sectionType: ${sectionType}, sectionName: ${sectionConfig?.sectionName}`);
  
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

  // Fetch data function - DON'T use useCallback to avoid stale closures
  const fetchData = async (isRetry = false) => {
    if (!mountedRef.current) return;

    // Get current config directly, not from ref
    const currentConfig = SECTION_CONFIG[sectionType];
    if (!currentConfig) {
      console.error(`❌ No config found for sectionType: ${sectionType}`);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      console.log(`🔍 [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Instance: ${instanceId.current}`);
      console.log(`🔍 [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Fetching section: ${currentConfig.sectionName}, limit: ${effectiveLimit}`);
      console.log(`🔍 [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Config:`, currentConfig);

      // Call the appropriate service method
      const serviceMethod = productService[currentConfig.method];
      if (!serviceMethod) {
        throw new Error(`Service method ${currentConfig.method} not found`);
      }

      // All sections now use getProductsBySection with sectionName parameter
      console.log(`📡 [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Calling: productService.${currentConfig.method}("${currentConfig.sectionName}", ${effectiveLimit})`);
      const response = await serviceMethod.call(productService, currentConfig.sectionName, effectiveLimit);

      if (!mountedRef.current) return;

      console.log(`📦 [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Raw response:`, response);

      // Extract data from response - handle different response structures
      let products = [];
      if (response?.data?.products) {
        products = response.data.products;
      } else if (Array.isArray(response?.data)) {
        products = response.data;
      } else if (response?.products) {
        products = response.products;
      } else if (Array.isArray(response)) {
        products = response;
      }
      
      console.log(`✅ [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Extracted ${products.length} products`);
      
      // Ensure we have an array
      const safeProducts = Array.isArray(products) ? products : [];
      
      setData(safeProducts);
      setError(null);
      setRetryCount(0);

    } catch (err) {
      if (!mountedRef.current) return;

      console.error(`❌ [HOMEPAGE_SECTION_${sectionType.toUpperCase()}] Error loading products:`, err);
      
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
  };

  // Manual retry function
  const retry = () => {
    setRetryCount(0);
    fetchData(false);
  };

  // Auto-load data on mount and when section type changes
  useEffect(() => {
    console.log(`🔄 [HOOK_EFFECT] Running for ${instanceId.current}, autoLoad: ${autoLoad}, sectionType: ${sectionType}`);
    if (autoLoad) {
      fetchData(false);
    }
  }, [autoLoad, sectionType, effectiveLimit]); // Include all dependencies

  // Refresh data function
  const refresh = () => {
    setRetryCount(0);
    fetchData(false);
  };

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