import { useEffect, useCallback, useRef, useState } from 'react';
import { dataSyncManager } from '../utils/dataSyncManager.js';

/**
 * Hook for integrating data synchronization with React components
 * @param {string} key - Unique key for the data
 * @param {Object} options - Configuration options
 */
export const useDataSync = (key, options = {}) => {
  const {
    autoSync = true,
    syncInterval = 30000,
    conflictResolver = null,
    onSyncEvent = null
  } = options;

  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    isPending: false,
    lastSync: null,
    error: null
  });

  const unsubscribeRef = useRef(null);

  // Register conflict resolver
  useEffect(() => {
    if (conflictResolver) {
      dataSyncManager.registerConflictResolver(key, conflictResolver);
    }
  }, [key, conflictResolver]);

  // Setup sync event listener
  useEffect(() => {
    const handleSyncEvent = (event) => {
      if (event.data.key === key || !event.data.key) {
        setSyncStatus(prev => ({
          ...prev,
          isOnline: event.event === 'network' ? event.data.online : prev.isOnline,
          isPending: ['sync_started', 'optimistic_update'].includes(event.event),
          lastSync: ['sync_success', 'sync_completed'].includes(event.event) ? Date.now() : prev.lastSync,
          error: event.event.includes('failed') || event.event.includes('error') ? event.data.error : null
        }));

        if (onSyncEvent) {
          onSyncEvent(event);
        }
      }
    };

    unsubscribeRef.current = dataSyncManager.addSyncListener(handleSyncEvent);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [key, onSyncEvent]);

  // Optimistic update function
  const optimisticUpdate = useCallback(async (data, serverOperation, rollbackFn) => {
    return dataSyncManager.optimisticUpdate(
      key,
      data,
      serverOperation,
      rollbackFn,
      { autoSync }
    );
  }, [key, autoSync]);

  // Force refresh function
  const forceRefresh = useCallback(async (fetchFn) => {
    return dataSyncManager.forceRefresh(key, fetchFn);
  }, [key]);

  // Get cached data
  const getCachedData = useCallback(() => {
    return dataSyncManager.getCachedData(key);
  }, [key]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    dataSyncManager.invalidateCache(key);
  }, [key]);

  return {
    syncStatus,
    optimisticUpdate,
    forceRefresh,
    getCachedData,
    invalidateCache
  };
};

/**
 * Hook for batch operations with optimistic updates
 * @param {string} baseKey - Base key for batch operations
 */
export const useBatchSync = (baseKey) => {
  const [batchStatus, setBatchStatus] = useState({
    isProcessing: false,
    completed: 0,
    total: 0,
    errors: []
  });

  const batchOperations = useCallback(async (operations) => {
    setBatchStatus({
      isProcessing: true,
      completed: 0,
      total: operations.length,
      errors: []
    });

    const results = [];
    const errors = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const operationKey = `${baseKey}_${operation.id || i}`;

      try {
        const result = await dataSyncManager.optimisticUpdate(
          operationKey,
          operation.optimisticData,
          operation.serverOperation,
          operation.rollbackFn,
          operation.options
        );
        results.push(result);
      } catch (error) {
        errors.push({ index: i, operation, error });
      }

      setBatchStatus(prev => ({
        ...prev,
        completed: i + 1,
        errors
      }));
    }

    setBatchStatus(prev => ({
      ...prev,
      isProcessing: false
    }));

    return { results, errors };
  }, [baseKey]);

  return {
    batchStatus,
    batchOperations
  };
};

/**
 * Hook for real-time data synchronization
 * @param {string} key - Data key
 * @param {Function} fetchFn - Function to fetch data
 * @param {Object} options - Configuration options
 */
export const useRealTimeSync = (key, fetchFn, options = {}) => {
  const {
    interval = 5000,
    enabled = true,
    onUpdate = null
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const syncData = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      const freshData = await fetchFn();
      const cachedData = dataSyncManager.getCachedData(key);

      // Check for consistency
      if (cachedData && cachedData._synced) {
        const inconsistencies = dataSyncManager.validateConsistency(key, cachedData, freshData);
        if (inconsistencies.length > 0) {
          console.warn('Data inconsistencies detected:', inconsistencies);
        }
      }

      // Update cache and state
      dataSyncManager.updateCache(key, freshData);
      setData(freshData);

      if (onUpdate) {
        onUpdate(freshData);
      }
    } catch (err) {
      setError(err);
      console.error('Real-time sync error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, enabled, onUpdate]);

  // Start/stop real-time sync
  useEffect(() => {
    if (enabled) {
      // Initial sync
      syncData();

      // Setup interval
      intervalRef.current = setInterval(syncData, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, syncData]);

  // Manual sync trigger
  const manualSync = useCallback(() => {
    syncData();
  }, [syncData]);

  return {
    data,
    isLoading,
    error,
    manualSync
  };
};

/**
 * Hook for conflict resolution UI
 * @param {string} key - Data key
 */
export const useConflictResolution = (key) => {
  const [conflicts, setConflicts] = useState([]);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const handleConflict = (event) => {
      if (event.event === 'conflict_manual' && event.data.key === key) {
        setConflicts(prev => [...prev, {
          id: `${key}_${Date.now()}`,
          key,
          operation: event.data.operation,
          error: event.data.error,
          serverData: event.data.serverData,
          timestamp: Date.now()
        }]);
      }
    };

    unsubscribeRef.current = dataSyncManager.addSyncListener(handleConflict);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [key]);

  const resolveConflict = useCallback(async (conflictId, resolution) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    try {
      // Apply resolution
      switch (resolution.strategy) {
        case 'use_server':
          dataSyncManager.updateCache(conflict.key, conflict.serverData);
          if (conflict.operation.rollbackFn) {
            conflict.operation.rollbackFn();
          }
          break;

        case 'use_local':
          // Retry the operation with force flag
          conflict.operation.options.force = true;
          await dataSyncManager.executeServerOperation(conflict.operation);
          break;

        case 'merge':
          const mergedData = resolution.mergedData;
          dataSyncManager.applyOptimisticUpdate(conflict.key, mergedData);
          conflict.operation.optimisticData = mergedData;
          await dataSyncManager.executeServerOperation(conflict.operation);
          break;
      }

      // Remove resolved conflict
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }, [conflicts]);

  const dismissConflict = useCallback((conflictId) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  return {
    conflicts,
    resolveConflict,
    dismissConflict
  };
};