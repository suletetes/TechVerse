import React, { createContext, useContext, useRef, useEffect, useState, useMemo } from 'react';

/**
 * Creates a context with selective subscription capabilities
 * @param {*} defaultValue - Default context value
 * @returns {Object} - Context and provider components
 */
export const createSelectiveContext = (defaultValue = null) => {
  const Context = createContext(defaultValue);
  const SubscribersContext = createContext(new Set());

  const Provider = ({ value, children }) => {
    const subscribersRef = useRef(new Set());
    const previousValueRef = useRef(value);

    // Notify subscribers when value changes
    useEffect(() => {
      if (previousValueRef.current !== value) {
        subscribersRef.current.forEach(subscriber => {
          const { selector, callback } = subscriber;
          const newSelectedValue = selector(value);
          const oldSelectedValue = selector(previousValueRef.current);

          // Only notify if selected value actually changed
          if (newSelectedValue !== oldSelectedValue) {
            callback(newSelectedValue, oldSelectedValue);
          }
        });

        previousValueRef.current = value;
      }
    }, [value]);

    const contextValue = useMemo(() => ({
      value,
      subscribe: (selector, callback) => {
        const subscriber = { selector, callback };
        subscribersRef.current.add(subscriber);

        // Return unsubscribe function
        return () => {
          subscribersRef.current.delete(subscriber);
        };
      }
    }), [value]);

    return (
      <Context.Provider value={contextValue}>
        <SubscribersContext.Provider value={subscribersRef.current}>
          {children}
        </SubscribersContext.Provider>
      </Context.Provider>
    );
  };

  const useSelector = (selector) => {
    const context = useContext(Context);
    const [selectedValue, setSelectedValue] = useState(() => 
      selector(context?.value || defaultValue)
    );

    useEffect(() => {
      if (!context) return;

      const unsubscribe = context.subscribe(selector, (newValue) => {
        setSelectedValue(newValue);
      });

      // Update initial value
      setSelectedValue(selector(context.value));

      return unsubscribe;
    }, [context, selector]);

    return selectedValue;
  };

  const useValue = () => {
    const context = useContext(Context);
    return context?.value || defaultValue;
  };

  return {
    Context,
    Provider,
    useSelector,
    useValue
  };
};

/**
 * Higher-order component that provides selective subscription to context
 * @param {React.Component} Component - Component to wrap
 * @param {Function} selector - Function to select specific data from context
 * @returns {React.Component} - Wrapped component
 */
export const withContextSelector = (Component, selector) => {
  return React.memo((props) => {
    const selectedValue = useSelector(selector);
    return <Component {...props} contextValue={selectedValue} />;
  });
};

/**
 * Hook for creating memoized selectors
 * @param {Function} selectorFn - Selector function
 * @param {Array} deps - Dependencies for memoization
 * @returns {Function} - Memoized selector
 */
export const useMemoizedSelector = (selectorFn, deps = []) => {
  return useMemo(selectorFn, deps);
};

/**
 * Hook for shallow comparison of context values
 * @param {*} value - Value to compare
 * @returns {*} - Memoized value that only changes on shallow comparison
 */
export const useShallowMemo = (value) => {
  const previousRef = useRef(value);

  return useMemo(() => {
    if (shallowEqual(previousRef.current, value)) {
      return previousRef.current;
    }
    previousRef.current = value;
    return value;
  }, [value]);
};

/**
 * Shallow equality comparison
 * @param {*} objA - First object
 * @param {*} objB - Second object
 * @returns {boolean} - Whether objects are shallowly equal
 */
const shallowEqual = (objA, objB) => {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null || 
      typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let key of keysA) {
    if (!keysB.includes(key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
};

/**
 * Context performance monitoring hook
 * @param {string} contextName - Name of the context for logging
 * @param {*} value - Context value to monitor
 */
export const useContextPerformanceMonitor = (contextName, value) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${contextName}] Render #${renderCountRef.current}, Time since last: ${timeSinceLastRender}ms`);
      
      if (timeSinceLastRender < 16) { // Less than one frame
        console.warn(`[${contextName}] Potential performance issue: Re-rendering too frequently`);
      }
    }

    lastRenderTimeRef.current = now;
  });

  // Log context value changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${contextName}] Value changed:`, value);
    }
  }, [contextName, value]);
};