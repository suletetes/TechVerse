import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Debounces a value by delaying updates until after a specified delay
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // API call with debounced value
 *   searchAPI(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useDebouncedCallback Hook
 * Returns a debounced version of a callback function
 * 
 * @param {function} callback - The callback function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {function} Debounced callback function
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback((term) => {
 *   searchAPI(term);
 * }, 500);
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export const useDebouncedCallback = (callback, delay = 500) => {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedCallback = (...args) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
};

export default useDebounce;
