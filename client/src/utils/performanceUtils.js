// Performance Utilities
// Provides easy access to performance monitoring functionality

class PerformanceUtils {
  constructor() {
    this.monitor = null;
    this.initialized = false;
  }

  // Initialize performance monitoring
  async initialize() {
    if (this.initialized) return this.monitor;

    try {
      const { default: performanceMonitor } = await import('../api/services/performanceMonitor.js');
      this.monitor = performanceMonitor;
      this.initialized = true;
      return this.monitor;
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
      return null;
    }
  }

  // Get performance monitor instance
  async getMonitor() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.monitor;
  }

  // Quick access methods
  async getApiStats(endpoint = null) {
    const monitor = await this.getMonitor();
    return monitor ? monitor.getApiStats(endpoint) : null;
  }

  async getMemoryStats() {
    const monitor = await this.getMonitor();
    return monitor ? monitor.getMemoryStats() : null;
  }

  async getWebVitals() {
    const monitor = await this.getMonitor();
    return monitor ? monitor.getWebVitals() : null;
  }

  async getBottlenecks(type = null, severity = null) {
    const monitor = await this.getMonitor();
    return monitor ? monitor.getBottlenecks(type, severity) : [];
  }

  async getPerformanceReport() {
    const monitor = await this.getMonitor();
    return monitor ? monitor.getPerformanceReport() : null;
  }

  // Register for performance alerts
  async onAlert(callback) {
    const monitor = await this.getMonitor();
    return monitor ? monitor.onAlert(callback) : () => {};
  }

  // Update performance thresholds
  async updateThresholds(thresholds) {
    const monitor = await this.getMonitor();
    if (monitor) {
      monitor.updateThresholds(thresholds);
    }
  }

  // Export performance data
  async exportData(format = 'json') {
    const monitor = await this.getMonitor();
    return monitor ? monitor.exportData(format) : null;
  }

  // Record custom metric
  async recordCustomMetric(name, duration, metadata = {}) {
    const monitor = await this.getMonitor();
    if (monitor) {
      monitor.recordCustomMetric(name, duration, metadata);
    }
  }

  // Get custom metrics
  async getCustomStats(metricName = null) {
    const monitor = await this.getMonitor();
    return monitor ? monitor.getCustomStats(metricName) : {};
  }

  // Clear performance metrics
  async clearMetrics() {
    const monitor = await this.getMonitor();
    if (monitor) {
      monitor.clearMetrics();
    }
  }

  // Performance measurement helpers
  measureFunction(fn, name = 'function') {
    return async (...args) => {
      const startTime = performance.now();
      try {
        const result = await fn(...args);
        const endTime = performance.now();
        
        console.log(`⏱️ ${name} took ${(endTime - startTime).toFixed(2)}ms`);
        
        // Record custom performance metric
        const monitor = await this.getMonitor();
        if (monitor) {
          monitor.recordCustomMetric(name, endTime - startTime, { type: 'function' });
        }
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        console.error(`❌ ${name} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
        throw error;
      }
    };
  }

  // Component render time measurement
  measureRender(componentName) {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance monitoring silently tracks render times
      
      return renderTime;
    };
  }

  // Memory usage checker
  checkMemoryUsage(context = 'unknown') {
    if (!performance.memory) {
      console.warn('Memory API not available');
      return null;
    }

    const memory = {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      context
    };

    const usagePercent = (memory.used / memory.total) * 100;
    
    // Memory usage monitored silently

    return memory;
  }

  // Network performance helpers
  async measureNetworkLatency(url = '/api/health') {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const endTime = performance.now();
      
      return {
        latency: endTime - startTime,
        success: response.ok,
        status: response.status
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        latency: endTime - startTime,
        success: false,
        error: error.message
      };
    }
  }

  // Bundle size estimation
  estimateBundleSize() {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: scripts.map(s => s.src),
      styles: styles.map(s => s.href)
    };
  }

  // Performance budget checker
  async checkPerformanceBudget(budget = {}) {
    const defaultBudget = {
      maxApiResponseTime: 2000,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxRenderTime: 16,
      maxBundleSize: 2 * 1024 * 1024 // 2MB
    };

    const activeBudget = { ...defaultBudget, ...budget };
    const report = await this.getPerformanceReport();
    
    if (!report) return null;

    const violations = [];

    // Check API response times
    Object.entries(report.api || {}).forEach(([endpoint, stats]) => {
      if (stats.average > activeBudget.maxApiResponseTime) {
        violations.push({
          type: 'api_response_time',
          endpoint,
          actual: stats.average,
          budget: activeBudget.maxApiResponseTime
        });
      }
    });

    // Check memory usage
    if (report.memory?.current > activeBudget.maxMemoryUsage) {
      violations.push({
        type: 'memory_usage',
        actual: report.memory.current,
        budget: activeBudget.maxMemoryUsage
      });
    }

    return {
      budget: activeBudget,
      violations,
      isWithinBudget: violations.length === 0
    };
  }

  // Format utilities
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatPercentage(value, total) {
    return `${((value / total) * 100).toFixed(1)}%`;
  }

  // Development helpers
  logPerformanceReport() {
    this.getPerformanceReport().then(report => {
      if (report) {
        console.group('📊 Performance Report');
        console.log('API Stats:', report.api);
        console.log('Memory Stats:', report.memory);
        console.log('Web Vitals:', report.webVitals);
        console.log('Bottlenecks:', report.bottlenecks);
        console.groupEnd();
      }
    });
  }

  // Start performance monitoring session
  startSession(sessionName = 'default') {
    const session = {
      name: sessionName,
      startTime: performance.now(),
      markers: []
    };

    return {
      mark: (label) => {
        session.markers.push({
          label,
          time: performance.now() - session.startTime
        });
      },
      
      end: () => {
        const endTime = performance.now();
        const duration = endTime - session.startTime;
        
        console.group(`⏱️ Performance Session: ${sessionName}`);
        console.log(`Total Duration: ${this.formatDuration(duration)}`);
        session.markers.forEach(marker => {
          console.log(`${marker.label}: ${this.formatDuration(marker.time)}`);
        });
        console.groupEnd();
        
        return {
          ...session,
          endTime,
          duration
        };
      }
    };
  }
}

// Create and export singleton instance
const performanceUtils = new PerformanceUtils();

export default performanceUtils;

// Export individual utilities for convenience
export const {
  getApiStats,
  getMemoryStats,
  getWebVitals,
  getBottlenecks,
  getPerformanceReport,
  onAlert,
  updateThresholds,
  exportData,
  clearMetrics,
  measureFunction,
  measureRender,
  checkMemoryUsage,
  measureNetworkLatency,
  estimateBundleSize,
  checkPerformanceBudget,
  formatBytes,
  formatDuration,
  formatPercentage,
  logPerformanceReport,
  startSession
} = performanceUtils;