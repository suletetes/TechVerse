import { useCallback, useRef } from 'react';

/**
 * Custom hook for batching multiple state updates to prevent excessive re-renders
 * @param {Function} updateFunction - Function to call with batched updates
 * @param {number} delay - Delay in milliseconds to batch updates (default: 16ms for next frame)
 * @returns {Function} - Batched update function
 */
export const useBatchedUpdates = (updateFunction, delay = 16) => {
  const timeoutRef = useRef(null);
  const pendingUpdatesRef = useRef([]);

  const batchedUpdate = useCallback((update) => {
    // Add update to pending queue
    pendingUpdatesRef.current.push(update);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to process batched updates
    timeoutRef.current = setTimeout(() => {
      if (pendingUpdatesRef.current.length > 0) {
        // Merge all pending updates
        const mergedUpdate = pendingUpdatesRef.current.reduce((acc, curr) => {
          return typeof curr === 'function' ? curr(acc) : { ...acc, ...curr };
        }, {});

        // Apply merged update
        updateFunction(mergedUpdate);

        // Clear pending updates
        pendingUpdatesRef.current = [];
      }
    }, delay);
  }, [updateFunction, delay]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pendingUpdatesRef.current = [];
  }, []);

  return { batchedUpdate, cleanup };
};

/**
 * Custom hook for debouncing function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const useDebounce = (func, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedFunction = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedFunction, cancel };
};

/**
 * Custom hook for throttling function calls
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
export const useThrottle = (func, delay = 100) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  const throttledFunction = useCallback((...args) => {
    const now = Date.now();

    if (now - lastCallRef.current >= delay) {
      // Call immediately if enough time has passed
      lastCallRef.current = now;
      func(...args);
    } else {
      // Schedule call for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        func(...args);
      }, delay - (now - lastCallRef.current));
    }
  }, [func, delay]);

  return throttledFunction;
};