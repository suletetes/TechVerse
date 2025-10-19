import React, { useMemo, useRef, useCallback } from 'react';
import { useBatchedUpdates, useDebounce, useThrottle } from '../hooks/useBatchedUpdates.js';

/**
 * Higher-order component that optimizes context providers
 * @param {React.Component} Provider - Context provider component
 * @param {Object} options - Optimization options
 * @returns {React.Component} - Optimized provider
 */
export const withContextOptimization = (Provider, options = {}) => {
  const {
    enableBatching = true,
    batchDelay = 16,
    enableDebouncing = false,
    debounceDelay = 100,
    enableThrottling = false,
    throttleDelay = 100,
    enablePerformanceMonitoring = process.env.NODE_ENV === 'development'
  } = options;

  return React.memo(({ children, value, ...props }) => {
    const renderCountRef = useRef(0);
    const lastRenderTimeRef = useRef(Date.now());

    // Performance monitoring
    if (enablePerformanceMonitoring) {
      renderCountRef.current += 1;
      const now = Date.now();
      const timeSinceLastRender = now - lastRenderTimeRef.current;

      if (timeSinceLastRender < 16) {
        console.warn(`Context provider re-rendering too frequently: ${timeSinceLastRender}ms`);
      }

      lastRenderTimeRef.current = now;
    }

    // Memoize the value to prevent unnecessary re-renders
    const memoizedValue = useMemo(() => {
      if (typeof value === 'object' && value !== null) {
        // Deep clone to prevent mutations
        return JSON.parse(JSON.stringify(value));
      }
      return value;
    }, [value]);

    return (
      <Provider value={memoizedValue} {...props}>
        {children}
      </Provider>
    );
  });
};

/**
 * Context state manager with optimizations
 */
export class OptimizedContextState {
  constructor(initialState, options = {}) {
    this.state = initialState;
    this.listeners = new Set();
    this.options = {
      enableBatching: true,
      batchDelay: 16,
      enableDeepComparison: true,
      ...options
    };

    if (this.options.enableBatching) {
      this.batchedNotify = this.createBatchedNotify();
    }
  }

  createBatchedNotify() {
    let timeoutId = null;
    const pendingUpdates = [];

    return (update) => {
      pendingUpdates.push(update);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const mergedUpdate = pendingUpdates.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        this.notifyListeners(mergedUpdate);
        pendingUpdates.length = 0;
      }, this.options.batchDelay);
    };
  }

  setState(update) {
    const newState = typeof update === 'function' ? update(this.state) : { ...this.state, ...update };

    // Deep comparison if enabled
    if (this.options.enableDeepComparison && this.deepEqual(this.state, newState)) {
      return;
    }

    this.state = newState;

    if (this.options.enableBatching) {
      this.batchedNotify(newState);
    } else {
      this.notifyListeners(newState);
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(state) {
    this.listeners.forEach(listener => listener(state));
  }

  deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
      if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Hook for creating optimized context state
 * @param {*} initialState - Initial state value
 * @param {Object} options - Optimization options
 * @returns {Object} - State manager and utilities
 */
export const useOptimizedContextState = (initialState, options = {}) => {
  const stateManagerRef = useRef(null);

  if (!stateManagerRef.current) {
    stateManagerRef.current = new OptimizedContextState(initialState, options);
  }

  const setState = useCallback((update) => {
    stateManagerRef.current.setState(update);
  }, []);

  const getState = useCallback(() => {
    return stateManagerRef.current.getState();
  }, []);

  const subscribe = useCallback((listener) => {
    return stateManagerRef.current.subscribe(listener);
  }, []);

  return {
    setState,
    getState,
    subscribe,
    stateManager: stateManagerRef.current
  };
};

/**
 * Context value stabilizer - prevents unnecessary re-renders due to object recreation
 * @param {*} value - Context value to stabilize
 * @param {Array} deps - Dependencies for memoization
 * @returns {*} - Stabilized value
 */
export const useStableContextValue = (value, deps = []) => {
  const previousValueRef = useRef(value);
  const previousDepsRef = useRef(deps);

  return useMemo(() => {
    // Check if dependencies have changed
    const depsChanged = deps.some((dep, index) => dep !== previousDepsRef.current[index]);

    if (!depsChanged) {
      return previousValueRef.current;
    }

    previousValueRef.current = value;
    previousDepsRef.current = deps;
    return value;
  }, deps);
};

/**
 * Context performance profiler
 */
export const ContextProfiler = ({ name, children, onRender }) => {
  const renderCountRef = useRef(0);

  const handleRender = useCallback((id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    renderCountRef.current += 1;

    if (onRender) {
      onRender({
        name,
        renderCount: renderCountRef.current,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${name}] Render #${renderCountRef.current} - ${phase} phase - ${actualDuration}ms`);
    }
  }, [name, onRender]);

  return (
    <React.Profiler id={name} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
};