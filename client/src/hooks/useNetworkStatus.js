import { useState, useEffect, useCallback } from 'react';

// Custom hook for network status monitoring
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState(null);
  const [effectiveType, setEffectiveType] = useState(null);
  const [downlink, setDownlink] = useState(null);
  const [rtt, setRtt] = useState(null);
  const [saveData, setSaveData] = useState(false);

  // Update connection info
  const updateConnectionInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || null);
        setEffectiveType(connection.effectiveType || null);
        setDownlink(connection.downlink || null);
        setRtt(connection.rtt || null);
        setSaveData(connection.saveData || false);
      }
    }
  }, []);

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    updateConnectionInfo();
  }, [updateConnectionInfo]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  // Handle connection change
  const handleConnectionChange = useCallback(() => {
    updateConnectionInfo();
  }, [updateConnectionInfo]);

  useEffect(() => {
    // Initial connection info
    updateConnectionInfo();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, updateConnectionInfo]);

  // Test actual connectivity (ping test)
  const testConnectivity = useCallback(async () => {
    if (!isOnline) return false;

    try {
      // Try to fetch a small resource with cache-busting
      const response = await fetch('/favicon.ico?' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('Connectivity test failed:', error);
      return false;
    }
  }, [isOnline]);

  // Get connection quality assessment
  const getConnectionQuality = useCallback(() => {
    if (!isOnline) return 'offline';
    
    if (effectiveType) {
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'poor';
        case '3g':
          return 'good';
        case '4g':
          return 'excellent';
        default:
          return 'unknown';
      }
    }

    // Fallback based on downlink speed
    if (downlink !== null) {
      if (downlink < 0.5) return 'poor';
      if (downlink < 2) return 'good';
      return 'excellent';
    }

    return 'unknown';
  }, [isOnline, effectiveType, downlink]);

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    connectionQuality: getConnectionQuality(),
    testConnectivity
  };
};

// Hook for offline-first data management
export const useOfflineData = (key, fetcher, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { isOnline } = useNetworkStatus();

  const {
    cacheTimeout = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true,
    fallbackData = null
  } = options;

  // Get cached data
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`offline_${key}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < cacheTimeout) {
          return { data: cachedData, timestamp, isStale: false };
        } else if (staleWhileRevalidate) {
          return { data: cachedData, timestamp, isStale: true };
        }
      }
    } catch (error) {
      console.warn('Failed to get cached data:', error);
    }
    return null;
  }, [key, cacheTimeout, staleWhileRevalidate]);

  // Set cached data
  const setCachedData = useCallback((newData) => {
    try {
      const cacheEntry = {
        data: newData,
        timestamp: Date.now()
      };
      localStorage.setItem(`offline_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [key]);

  // Fetch fresh data
  const fetchData = useCallback(async (force = false) => {
    if (!isOnline && !force) {
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
        return cached.data;
      } else if (fallbackData) {
        setData(fallbackData);
        return fallbackData;
      }
      throw new Error('No cached data available offline');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastUpdated(Date.now());
      setCachedData(result);
      return result;
    } catch (err) {
      setError(err);
      
      // Try to use cached data as fallback
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
        return cached.data;
      } else if (fallbackData) {
        setData(fallbackData);
        return fallbackData;
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isOnline, fetcher, getCachedData, setCachedData, fallbackData]);

  // Initial data load
  useEffect(() => {
    const cached = getCachedData();
    
    if (cached) {
      setData(cached.data);
      setLastUpdated(cached.timestamp);
      
      // If online and data is stale, fetch fresh data
      if (isOnline && cached.isStale) {
        fetchData().catch(console.error);
      }
    } else if (isOnline) {
      fetchData().catch(console.error);
    } else if (fallbackData) {
      setData(fallbackData);
    }
  }, [key, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && data) {
      const cached = getCachedData();
      if (cached && cached.isStale) {
        fetchData().catch(console.error);
      }
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData,
    isStale: lastUpdated ? Date.now() - lastUpdated > cacheTimeout : false
  };
};

export default useNetworkStatus;