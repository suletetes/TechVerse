import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus.js';
import NotificationContext from './NotificationContext.jsx';

// Initial state
const initialState = {
  isOffline: false,
  offlineQueue: [],
  syncInProgress: false,
  lastSyncTime: null,
  offlineData: {},
  offlineMode: 'auto', // 'auto', 'force-offline', 'force-online'
  syncErrors: []
};

// Action types
const OFFLINE_ACTIONS = {
  SET_OFFLINE_STATUS: 'SET_OFFLINE_STATUS',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  CLEAR_QUEUE: 'CLEAR_QUEUE',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  SET_OFFLINE_DATA: 'SET_OFFLINE_DATA',
  SET_OFFLINE_MODE: 'SET_OFFLINE_MODE',
  ADD_SYNC_ERROR: 'ADD_SYNC_ERROR',
  CLEAR_SYNC_ERRORS: 'CLEAR_SYNC_ERRORS'
};

// Reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case OFFLINE_ACTIONS.SET_OFFLINE_STATUS:
      return {
        ...state,
        isOffline: action.payload
      };

    case OFFLINE_ACTIONS.ADD_TO_QUEUE:
      return {
        ...state,
        offlineQueue: [...state.offlineQueue, action.payload]
      };

    case OFFLINE_ACTIONS.REMOVE_FROM_QUEUE:
      return {
        ...state,
        offlineQueue: state.offlineQueue.filter(item => item.id !== action.payload)
      };

    case OFFLINE_ACTIONS.CLEAR_QUEUE:
      return {
        ...state,
        offlineQueue: []
      };

    case OFFLINE_ACTIONS.SET_SYNC_STATUS:
      return {
        ...state,
        syncInProgress: action.payload
      };

    case OFFLINE_ACTIONS.SET_LAST_SYNC:
      return {
        ...state,
        lastSyncTime: action.payload
      };

    case OFFLINE_ACTIONS.SET_OFFLINE_DATA:
      return {
        ...state,
        offlineData: {
          ...state.offlineData,
          [action.payload.key]: action.payload.data
        }
      };

    case OFFLINE_ACTIONS.SET_OFFLINE_MODE:
      return {
        ...state,
        offlineMode: action.payload
      };

    case OFFLINE_ACTIONS.ADD_SYNC_ERROR:
      return {
        ...state,
        syncErrors: [...state.syncErrors, action.payload]
      };

    case OFFLINE_ACTIONS.CLEAR_SYNC_ERRORS:
      return {
        ...state,
        syncErrors: []
      };

    default:
      return state;
  }
};

// Create context
const OfflineContext = createContext();

// Provider component
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);
  const { isOnline, connectionQuality } = useNetworkStatus();
  
  // Safely access notification context without throwing error
  const notificationContext = useContext(NotificationContext);
  const showWarning = notificationContext?.showWarning || (() => {});
  const showSuccess = notificationContext?.showSuccess || (() => {});
  const showError = notificationContext?.showError || (() => {});

  // Determine effective offline status
  const effectiveOfflineStatus = useMemo(() => {
    switch (state.offlineMode) {
      case 'force-offline':
        return true;
      case 'force-online':
        return false;
      case 'auto':
      default:
        return !isOnline;
    }
  }, [state.offlineMode, isOnline]);

  // Update offline status when network changes
  useEffect(() => {
    const wasOffline = state.isOffline;
    const isNowOffline = effectiveOfflineStatus;

    if (wasOffline !== isNowOffline) {
      dispatch({ type: OFFLINE_ACTIONS.SET_OFFLINE_STATUS, payload: isNowOffline });

      if (isNowOffline) {
        showWarning('You are now offline. Some features may be limited.', 5000);
      } else if (wasOffline) {
        showSuccess('You are back online. Syncing data...', 3000);
        syncOfflineQueue();
      }
    }
  }, [effectiveOfflineStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load offline queue from localStorage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem('offlineQueue');
      if (savedQueue) {
        const queue = JSON.parse(savedQueue);
        queue.forEach(item => {
          dispatch({ type: OFFLINE_ACTIONS.ADD_TO_QUEUE, payload: item });
        });
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }
  }, []);

  // Save offline queue to localStorage
  const saveQueueToStorage = useCallback(() => {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(state.offlineQueue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }, [state.offlineQueue]);

  // Save queue whenever it changes
  useEffect(() => {
    saveQueueToStorage();
  }, [saveQueueToStorage]);

  // Add operation to offline queue
  const addToOfflineQueue = useCallback((operation) => {
    const queueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...operation,
      timestamp: Date.now(),
      retryCount: 0
    };

    dispatch({ type: OFFLINE_ACTIONS.ADD_TO_QUEUE, payload: queueItem });
    return queueItem.id;
  }, []);

  // Remove operation from offline queue
  const removeFromOfflineQueue = useCallback((id) => {
    dispatch({ type: OFFLINE_ACTIONS.REMOVE_FROM_QUEUE, payload: id });
  }, []);

  // Clear offline queue
  const clearOfflineQueue = useCallback(() => {
    dispatch({ type: OFFLINE_ACTIONS.CLEAR_QUEUE });
    localStorage.removeItem('offlineQueue');
  }, []);

  // Sync offline queue when back online
  const syncOfflineQueue = useCallback(async () => {
    if (state.offlineQueue.length === 0 || state.syncInProgress) return;

    dispatch({ type: OFFLINE_ACTIONS.SET_SYNC_STATUS, payload: true });
    dispatch({ type: OFFLINE_ACTIONS.CLEAR_SYNC_ERRORS });

    const errors = [];
    const successfulSyncs = [];

    for (const item of state.offlineQueue) {
      try {
        if (item.operation && typeof item.operation === 'function') {
          await item.operation();
          successfulSyncs.push(item.id);
        }
      } catch (error) {
        console.error('Failed to sync offline operation:', error);
        errors.push({
          id: item.id,
          error: error.message,
          timestamp: Date.now()
        });

        // Increment retry count
        item.retryCount = (item.retryCount || 0) + 1;
        
        // Remove from queue if max retries reached
        if (item.retryCount >= 3) {
          successfulSyncs.push(item.id);
          dispatch({ 
            type: OFFLINE_ACTIONS.ADD_SYNC_ERROR, 
            payload: { ...item, error: error.message } 
          });
        }
      }
    }

    // Remove successfully synced items
    successfulSyncs.forEach(id => {
      dispatch({ type: OFFLINE_ACTIONS.REMOVE_FROM_QUEUE, payload: id });
    });

    dispatch({ type: OFFLINE_ACTIONS.SET_SYNC_STATUS, payload: false });
    dispatch({ type: OFFLINE_ACTIONS.SET_LAST_SYNC, payload: Date.now() });

    if (errors.length > 0) {
      showError(`Failed to sync ${errors.length} offline operations`, 8000);
    } else if (successfulSyncs.length > 0) {
      showSuccess(`Successfully synced ${successfulSyncs.length} offline operations`, 3000);
    }
  }, [state.offlineQueue, state.syncInProgress, showError, showSuccess]);

  // Store data for offline use
  const storeOfflineData = useCallback((key, data) => {
    dispatch({ 
      type: OFFLINE_ACTIONS.SET_OFFLINE_DATA, 
      payload: { key, data } 
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`offline_data_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to store offline data:', error);
    }
  }, []);

  // Get offline data
  const getOfflineData = useCallback((key) => {
    // First check in-memory store
    if (state.offlineData[key]) {
      return state.offlineData[key];
    }

    // Then check localStorage
    try {
      const stored = localStorage.getItem(`offline_data_${key}`);
      if (stored) {
        const { data } = JSON.parse(stored);
        return data;
      }
    } catch (error) {
      console.warn('Failed to get offline data:', error);
    }

    return null;
  }, [state.offlineData]);

  // Set offline mode
  const setOfflineMode = useCallback((mode) => {
    dispatch({ type: OFFLINE_ACTIONS.SET_OFFLINE_MODE, payload: mode });
  }, []);

  // Clear sync errors
  const clearSyncErrors = useCallback(() => {
    dispatch({ type: OFFLINE_ACTIONS.CLEAR_SYNC_ERRORS });
  }, []);

  // Get offline statistics
  const getOfflineStats = useMemo(() => {
    return {
      queueLength: state.offlineQueue.length,
      syncInProgress: state.syncInProgress,
      lastSyncTime: state.lastSyncTime,
      syncErrors: state.syncErrors.length,
      connectionQuality,
      offlineDataKeys: Object.keys(state.offlineData).length
    };
  }, [state, connectionQuality]);

  const value = useMemo(() => ({
    // State
    ...state,
    isOffline: effectiveOfflineStatus,
    connectionQuality,
    
    // Actions
    addToOfflineQueue,
    removeFromOfflineQueue,
    clearOfflineQueue,
    syncOfflineQueue,
    storeOfflineData,
    getOfflineData,
    setOfflineMode,
    clearSyncErrors,
    
    // Utilities
    getOfflineStats
  }), [
    state,
    effectiveOfflineStatus,
    connectionQuality,
    addToOfflineQueue,
    removeFromOfflineQueue,
    clearOfflineQueue,
    syncOfflineQueue,
    storeOfflineData,
    getOfflineData,
    setOfflineMode,
    clearSyncErrors,
    getOfflineStats
  ]);

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Hook to use offline context
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;