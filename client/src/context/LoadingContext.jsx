import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

// Initial state
const initialState = {
  globalLoading: false,
  loadingStates: {},
  loadingQueue: []
};

// Action types
const LOADING_ACTIONS = {
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  SET_LOADING: 'SET_LOADING',
  CLEAR_LOADING: 'CLEAR_LOADING',
  CLEAR_ALL_LOADING: 'CLEAR_ALL_LOADING',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE'
};

// Reducer
const loadingReducer = (state, action) => {
  switch (action.type) {
    case LOADING_ACTIONS.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.payload
      };

    case LOADING_ACTIONS.SET_LOADING:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: {
            loading: action.payload.loading,
            text: action.payload.text || 'Loading...',
            progress: action.payload.progress,
            timestamp: Date.now()
          }
        }
      };

    case LOADING_ACTIONS.CLEAR_LOADING:
      const newLoadingStates = { ...state.loadingStates };
      delete newLoadingStates[action.payload];
      return {
        ...state,
        loadingStates: newLoadingStates
      };

    case LOADING_ACTIONS.CLEAR_ALL_LOADING:
      return {
        ...state,
        loadingStates: {},
        loadingQueue: []
      };

    case LOADING_ACTIONS.ADD_TO_QUEUE:
      return {
        ...state,
        loadingQueue: [...state.loadingQueue, action.payload]
      };

    case LOADING_ACTIONS.REMOVE_FROM_QUEUE:
      return {
        ...state,
        loadingQueue: state.loadingQueue.filter(item => item.id !== action.payload)
      };

    default:
      return state;
  }
};

// Create context
const LoadingContext = createContext();

// Provider component
export const LoadingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  // Set global loading state
  const setGlobalLoading = useCallback((loading) => {
    dispatch({ 
      type: LOADING_ACTIONS.SET_GLOBAL_LOADING, 
      payload: loading 
    });
  }, []);

  // Set loading state for a specific key
  const setLoading = useCallback((key, loading, text = 'Loading...', progress = null) => {
    if (loading) {
      dispatch({
        type: LOADING_ACTIONS.SET_LOADING,
        payload: { key, loading, text, progress }
      });
    } else {
      dispatch({
        type: LOADING_ACTIONS.CLEAR_LOADING,
        payload: key
      });
    }
  }, []);

  // Clear specific loading state
  const clearLoading = useCallback((key) => {
    dispatch({
      type: LOADING_ACTIONS.CLEAR_LOADING,
      payload: key
    });
  }, []);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    dispatch({ type: LOADING_ACTIONS.CLEAR_ALL_LOADING });
  }, []);

  // Add operation to loading queue
  const addToQueue = useCallback((operation) => {
    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...operation,
      timestamp: Date.now()
    };
    
    dispatch({
      type: LOADING_ACTIONS.ADD_TO_QUEUE,
      payload: queueItem
    });

    return queueItem.id;
  }, []);

  // Remove operation from loading queue
  const removeFromQueue = useCallback((id) => {
    dispatch({
      type: LOADING_ACTIONS.REMOVE_FROM_QUEUE,
      payload: id
    });
  }, []);

  // Check if any loading state is active
  const isAnyLoading = useMemo(() => {
    return state.globalLoading || Object.values(state.loadingStates).some(state => state.loading);
  }, [state.globalLoading, state.loadingStates]);

  // Get loading state for a specific key
  const getLoadingState = useCallback((key) => {
    return state.loadingStates[key] || { loading: false, text: '', progress: null };
  }, [state.loadingStates]);

  // Check if specific key is loading
  const isLoading = useCallback((key) => {
    return state.loadingStates[key]?.loading || false;
  }, [state.loadingStates]);

  // Async operation wrapper with loading state
  const withLoading = useCallback(async (key, operation, text = 'Loading...') => {
    try {
      setLoading(key, true, text);
      const result = await operation();
      return result;
    } catch (error) {
      throw error;
    } finally {
      clearLoading(key);
    }
  }, [setLoading, clearLoading]);

  // Async operation with progress tracking
  const withProgress = useCallback(async (key, operation, text = 'Processing...') => {
    try {
      setLoading(key, true, text, 0);
      
      const progressCallback = (progress) => {
        setLoading(key, true, text, progress);
      };

      const result = await operation(progressCallback);
      return result;
    } catch (error) {
      throw error;
    } finally {
      clearLoading(key);
    }
  }, [setLoading, clearLoading]);

  // Batch operations with queue management
  const batchOperations = useCallback(async (operations) => {
    const queueIds = [];
    
    try {
      // Add all operations to queue
      operations.forEach(op => {
        const queueId = addToQueue(op);
        queueIds.push(queueId);
      });

      // Execute operations
      const results = await Promise.allSettled(
        operations.map(op => op.operation())
      );

      return results;
    } finally {
      // Remove all operations from queue
      queueIds.forEach(id => removeFromQueue(id));
    }
  }, [addToQueue, removeFromQueue]);

  // Get loading statistics
  const getLoadingStats = useMemo(() => {
    const activeLoading = Object.keys(state.loadingStates).filter(
      key => state.loadingStates[key].loading
    );
    
    return {
      totalActive: activeLoading.length,
      globalLoading: state.globalLoading,
      queueLength: state.loadingQueue.length,
      activeKeys: activeLoading,
      oldestLoading: activeLoading.length > 0 ? Math.min(
        ...activeLoading.map(key => state.loadingStates[key].timestamp)
      ) : null
    };
  }, [state]);

  const value = useMemo(() => ({
    // State
    ...state,
    isAnyLoading,
    
    // Actions
    setGlobalLoading,
    setLoading,
    clearLoading,
    clearAllLoading,
    addToQueue,
    removeFromQueue,
    
    // Utilities
    getLoadingState,
    isLoading,
    withLoading,
    withProgress,
    batchOperations,
    getLoadingStats
  }), [
    state,
    isAnyLoading,
    setGlobalLoading,
    setLoading,
    clearLoading,
    clearAllLoading,
    addToQueue,
    removeFromQueue,
    getLoadingState,
    isLoading,
    withLoading,
    withProgress,
    batchOperations,
    getLoadingStats
  ]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook to use loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Hook for component-specific loading state
export const useComponentLoading = (componentName) => {
  const { setLoading, clearLoading, isLoading, getLoadingState, withLoading } = useLoading();

  const setComponentLoading = useCallback((loading, text = 'Loading...', progress = null) => {
    setLoading(componentName, loading, text, progress);
  }, [componentName, setLoading]);

  const clearComponentLoading = useCallback(() => {
    clearLoading(componentName);
  }, [componentName, clearLoading]);

  const isComponentLoading = useMemo(() => {
    return isLoading(componentName);
  }, [componentName, isLoading]);

  const componentLoadingState = useMemo(() => {
    return getLoadingState(componentName);
  }, [componentName, getLoadingState]);

  const withComponentLoading = useCallback(async (operation, text = 'Loading...') => {
    return withLoading(componentName, operation, text);
  }, [componentName, withLoading]);

  return {
    setLoading: setComponentLoading,
    clearLoading: clearComponentLoading,
    isLoading: isComponentLoading,
    loadingState: componentLoadingState,
    withLoading: withComponentLoading
  };
};

export default LoadingContext;