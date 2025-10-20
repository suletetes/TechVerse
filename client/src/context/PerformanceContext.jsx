import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import performanceUtils from '../utils/performanceUtils.js';

// Performance Context
const PerformanceContext = createContext();

// Performance Provider Component
export const PerformanceProvider = ({ children }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize performance monitoring
  useEffect(() => {
    let unsubscribeAlert = null;
    let updateInterval = null;

    const initializeMonitoring = async () => {
      try {
        const monitor = await performanceUtils.getMonitor();
        
        if (monitor) {
          setIsMonitoring(true);
          
          // Subscribe to performance alerts
          unsubscribeAlert = await performanceUtils.onAlert((alert) => {
            setAlerts(prev => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts
          });

          // Update performance data every 10 seconds
          const updateData = async () => {
            const data = await performanceUtils.getPerformanceReport();
            setPerformanceData(data);
            setIsLoading(false);
          };

          await updateData();
          updateInterval = setInterval(updateData, 10000);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize performance monitoring:', error);
        setIsLoading(false);
      }
    };

    initializeMonitoring();

    return () => {
      if (unsubscribeAlert) unsubscribeAlert();
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  // Get API statistics
  const getApiStats = useCallback(async (endpoint = null) => {
    return await performanceUtils.getApiStats(endpoint);
  }, []);

  // Get memory statistics
  const getMemoryStats = useCallback(async () => {
    return await performanceUtils.getMemoryStats();
  }, []);

  // Get Web Vitals
  const getWebVitals = useCallback(async () => {
    return await performanceUtils.getWebVitals();
  }, []);

  // Get performance bottlenecks
  const getBottlenecks = useCallback(async (type = null, severity = null) => {
    return await performanceUtils.getBottlenecks(type, severity);
  }, []);

  // Clear performance alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Clear all performance metrics
  const clearMetrics = useCallback(async () => {
    await performanceUtils.clearMetrics();
    setPerformanceData(null);
  }, []);

  // Export performance data
  const exportData = useCallback(async (format = 'json') => {
    return await performanceUtils.exportData(format);
  }, []);

  // Update performance thresholds
  const updateThresholds = useCallback(async (thresholds) => {
    await performanceUtils.updateThresholds(thresholds);
  }, []);

  // Check performance budget
  const checkPerformanceBudget = useCallback(async (budget) => {
    return await performanceUtils.checkPerformanceBudget(budget);
  }, []);

  // Measure function performance
  const measureFunction = useCallback((fn, name) => {
    return performanceUtils.measureFunction(fn, name);
  }, []);

  // Measure component render time
  const measureRender = useCallback((componentName) => {
    return performanceUtils.measureRender(componentName);
  }, []);

  // Check memory usage
  const checkMemoryUsage = useCallback((context) => {
    return performanceUtils.checkMemoryUsage(context);
  }, []);

  // Start performance session
  const startSession = useCallback((sessionName) => {
    return performanceUtils.startSession(sessionName);
  }, []);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (!performanceData) return null;

    const apiStats = performanceData.api || {};
    const memoryStats = performanceData.memory || {};
    const webVitals = performanceData.webVitals || {};
    const bottlenecks = performanceData.bottlenecks || [];

    // Calculate overall health score (0-100)
    let healthScore = 100;
    
    // Deduct points for API performance issues
    const slowApis = Object.values(apiStats).filter(stats => stats.average > 2000);
    healthScore -= slowApis.length * 10;
    
    // Deduct points for memory issues
    if (memoryStats.trend === 'increasing') healthScore -= 15;
    if (memoryStats.current > 100 * 1024 * 1024) healthScore -= 20; // >100MB
    
    // Deduct points for Web Vitals issues
    Object.values(webVitals).forEach(vital => {
      if (vital.rating === 'poor') healthScore -= 15;
      else if (vital.rating === 'needs-improvement') healthScore -= 5;
    });
    
    // Deduct points for bottlenecks
    const highSeverityBottlenecks = bottlenecks.filter(b => b.severity === 'high');
    healthScore -= highSeverityBottlenecks.length * 10;
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      healthScore,
      status: healthScore >= 80 ? 'excellent' : 
              healthScore >= 60 ? 'good' : 
              healthScore >= 40 ? 'fair' : 'poor',
      totalApiCalls: Object.values(apiStats).reduce((sum, stats) => sum + stats.count, 0),
      averageApiResponse: Object.values(apiStats).length > 0 
        ? Object.values(apiStats).reduce((sum, stats) => sum + stats.average, 0) / Object.values(apiStats).length 
        : 0,
      memoryUsage: memoryStats.current || 0,
      activeBottlenecks: bottlenecks.length,
      webVitalsScore: Object.values(webVitals).filter(v => v.rating === 'good').length,
      lastUpdated: performanceData.timestamp
    };
  }, [performanceData]);

  const contextValue = {
    // State
    performanceData,
    isMonitoring,
    isLoading,
    alerts,
    
    // Methods
    getApiStats,
    getMemoryStats,
    getWebVitals,
    getBottlenecks,
    clearAlerts,
    clearMetrics,
    exportData,
    updateThresholds,
    checkPerformanceBudget,
    measureFunction,
    measureRender,
    checkMemoryUsage,
    startSession,
    getPerformanceSummary,
    
    // Utilities
    formatBytes: performanceUtils.formatBytes,
    formatDuration: performanceUtils.formatDuration,
    formatPercentage: performanceUtils.formatPercentage
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Custom hook to use performance context
export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  
  return context;
};

// HOC for performance monitoring
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.forwardRef((props, ref) => {
    const { measureRender } = usePerformanceContext();
    
    useEffect(() => {
      const endMeasure = measureRender(componentName || WrappedComponent.name);
      return endMeasure;
    });
    
    return <WrappedComponent {...props} ref={ref} />;
  });
};

export default PerformanceContext;