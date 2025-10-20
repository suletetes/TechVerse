import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    rerenderCount: 0
  });

  const renderStartTime = useRef(Date.now());
  const rerenderCount = useRef(0);

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    rerenderCount.current += 1;

    setMetrics(prev => ({
      ...prev,
      renderTime,
      rerenderCount: rerenderCount.current,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0
    }));
  });

  const logPerformance = useCallback((componentName) => {
    console.log(`Performance metrics for ${componentName}:`, metrics);
  }, [metrics]);

  return { metrics, logPerformance };
};

// Enhanced performance monitoring hook with system-wide metrics
export const useSystemPerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let performanceMonitor = null;
    let unsubscribeAlert = null;

    const initializeMonitoring = async () => {
      try {
        const { default: monitor } = await import('../api/services/performanceMonitor.js');
        performanceMonitor = monitor;

        // Subscribe to performance alerts
        unsubscribeAlert = monitor.onAlert((alert) => {
          setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
        });

        // Update performance data every 5 seconds
        const updateData = () => {
          const data = monitor.getPerformanceReport();
          setPerformanceData(data);
          setIsLoading(false);
        };

        updateData();
        const interval = setInterval(updateData, 5000);

        return () => {
          clearInterval(interval);
          if (unsubscribeAlert) unsubscribeAlert();
        };
      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error);
        setIsLoading(false);
      }
    };

    const cleanup = initializeMonitoring();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
    };
  }, []);

  const getApiStats = useCallback((endpoint) => {
    if (!performanceData) return null;
    return endpoint ? performanceData.api[endpoint] : performanceData.api;
  }, [performanceData]);

  const getMemoryStats = useCallback(() => {
    return performanceData?.memory || null;
  }, [performanceData]);

  const getWebVitals = useCallback(() => {
    return performanceData?.webVitals || null;
  }, [performanceData]);

  const getBottlenecks = useCallback((type, severity) => {
    if (!performanceData) return [];
    let bottlenecks = performanceData.bottlenecks || [];
    
    if (type) bottlenecks = bottlenecks.filter(b => b.type === type);
    if (severity) bottlenecks = bottlenecks.filter(b => b.severity === severity);
    
    return bottlenecks;
  }, [performanceData]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    performanceData,
    isLoading,
    alerts,
    getApiStats,
    getMemoryStats,
    getWebVitals,
    getBottlenecks,
    clearAlerts
  };
};

// Debounced value hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
};

// Virtual scrolling hook
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return { visibleItems, handleScroll };
};

// Image lazy loading hook
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { elementRef, hasIntersected } = useIntersectionObserver();

  useEffect(() => {
    if (hasIntersected && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setIsError(true);
      };
      
      img.src = src;
    }
  }, [hasIntersected, src]);

  return { elementRef, imageSrc, isLoaded, isError };
};

// Memoized component wrapper
export const useMemoizedComponent = (Component, dependencies = []) => {
  return useMemo(() => Component, dependencies);
};

// Optimized event handler
export const useOptimizedEventHandler = (handler, dependencies = []) => {
  return useCallback(handler, dependencies);
};

// Resource preloader hook
export const useResourcePreloader = (resources = []) => {
  const [loadedResources, setLoadedResources] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadResource = useCallback((resource) => {
    return new Promise((resolve, reject) => {
      if (resource.type === 'image') {
        const img = new Image();
        img.onload = () => resolve(resource);
        img.onerror = reject;
        img.src = resource.url;
      } else if (resource.type === 'script') {
        const script = document.createElement('script');
        script.onload = () => resolve(resource);
        script.onerror = reject;
        script.src = resource.url;
        document.head.appendChild(script);
      } else if (resource.type === 'style') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.onload = () => resolve(resource);
        link.onerror = reject;
        link.href = resource.url;
        document.head.appendChild(link);
      }
    });
  }, []);

  const preloadResources = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const promises = resources.map(preloadResource);
      const results = await Promise.allSettled(promises);
      
      const loaded = new Set();
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loaded.add(resources[index].url);
        }
      });
      
      setLoadedResources(loaded);
    } catch (error) {
      console.error('Resource preloading failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resources, preloadResource]);

  useEffect(() => {
    if (resources.length > 0) {
      preloadResources();
    }
  }, [preloadResources]);

  return { loadedResources, isLoading, preloadResources };
};

// Bundle size analyzer
export const useBundleAnalyzer = () => {
  const [bundleInfo, setBundleInfo] = useState({
    totalSize: 0,
    gzippedSize: 0,
    chunks: []
  });

  useEffect(() => {
    // This would integrate with webpack-bundle-analyzer or similar
    // For now, we'll simulate the data
    if (process.env.NODE_ENV === 'development') {
      const mockBundleInfo = {
        totalSize: 2.5 * 1024 * 1024, // 2.5MB
        gzippedSize: 800 * 1024, // 800KB
        chunks: [
          { name: 'main', size: 1.2 * 1024 * 1024 },
          { name: 'vendor', size: 1.0 * 1024 * 1024 },
          { name: 'runtime', size: 300 * 1024 }
        ]
      };
      setBundleInfo(mockBundleInfo);
    }
  }, []);

  return bundleInfo;
};

// Performance budget checker
export const usePerformanceBudget = (budget = {}) => {
  const [budgetStatus, setBudgetStatus] = useState({
    isWithinBudget: true,
    violations: []
  });

  const defaultBudget = {
    maxBundleSize: 2 * 1024 * 1024, // 2MB
    maxRenderTime: 16, // 16ms for 60fps
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxImageSize: 500 * 1024 // 500KB
  };

  const checkBudget = useCallback((metrics) => {
    const activeBudget = { ...defaultBudget, ...budget };
    const violations = [];

    if (metrics.bundleSize > activeBudget.maxBundleSize) {
      violations.push({
        type: 'bundle_size',
        actual: metrics.bundleSize,
        budget: activeBudget.maxBundleSize
      });
    }

    if (metrics.renderTime > activeBudget.maxRenderTime) {
      violations.push({
        type: 'render_time',
        actual: metrics.renderTime,
        budget: activeBudget.maxRenderTime
      });
    }

    if (metrics.memoryUsage > activeBudget.maxMemoryUsage) {
      violations.push({
        type: 'memory_usage',
        actual: metrics.memoryUsage,
        budget: activeBudget.maxMemoryUsage
      });
    }

    setBudgetStatus({
      isWithinBudget: violations.length === 0,
      violations
    });
  }, [budget]);

  return { budgetStatus, checkBudget };
};