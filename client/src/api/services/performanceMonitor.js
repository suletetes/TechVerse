// Performance Monitoring Service
// Implements comprehensive performance tracking for API calls, user interactions, and system resources

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      api: new Map(), // API response times and statistics
      interactions: new Map(), // User interaction performance
      memory: [], // Memory usage history
      bottlenecks: [], // Detected performance bottlenecks
      vitals: {} // Core Web Vitals
    };
    
    this.thresholds = {
      apiResponseTime: 2000, // 2 seconds
      memoryUsage: 100 * 1024 * 1024, // 100MB
      renderTime: 16, // 16ms for 60fps
      interactionDelay: 100, // 100ms for good UX
      bundleSize: 2 * 1024 * 1024 // 2MB
    };
    
    this.observers = {
      performance: null,
      memory: null,
      navigation: null
    };
    
    this.isMonitoring = false;
    this.alertCallbacks = new Set();
    
    // Initialize monitoring
    this.initialize();
  }

  // Initialize performance monitoring
  initialize() {
    if (typeof window === 'undefined') return;
    
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupNavigationTiming();
    this.setupWebVitals();
    this.isMonitoring = true;
    
    console.log('🔍 Performance monitoring initialized');
  }

  // Setup Performance Observer for various metrics
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    try {
      // Monitor navigation timing
      this.observers.navigation = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordNavigationTiming(entry);
        }
      });
      this.observers.navigation.observe({ entryTypes: ['navigation'] });

      // Monitor resource timing (API calls, assets)
      this.observers.performance = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('/api/') || entry.name.includes('localhost:')) {
            this.recordApiTiming(entry);
          } else {
            this.recordResourceTiming(entry);
          }
        }
      });
      this.observers.performance.observe({ entryTypes: ['resource'] });

      // Monitor user interactions
      if ('PerformanceEventTiming' in window) {
        const interactionObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordInteractionTiming(entry);
          }
        });
        interactionObserver.observe({ entryTypes: ['event'] });
      }

    } catch (error) {
      console.warn('Performance Observer setup failed:', error);
    }
  }

  // Setup memory monitoring
  setupMemoryMonitoring() {
    if (!performance.memory) return;

    const monitorMemory = () => {
      const memoryInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };

      this.metrics.memory.push(memoryInfo);
      
      // Keep only last 100 entries
      if (this.metrics.memory.length > 100) {
        this.metrics.memory.shift();
      }

      // Check for memory alerts
      this.checkMemoryAlerts(memoryInfo);
    };

    // Monitor memory every 30 seconds
    this.memoryInterval = setInterval(monitorMemory, 30000);
    monitorMemory(); // Initial reading
  }

  // Setup navigation timing
  setupNavigationTiming() {
    if (!performance.getEntriesByType) return;

    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      this.recordNavigationTiming(navigationEntries[0]);
    }
  }

  // Setup Web Vitals monitoring
  setupWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeWebVital('largest-contentful-paint', (entry) => {
      this.metrics.vitals.lcp = {
        value: entry.startTime,
        timestamp: Date.now(),
        rating: entry.startTime <= 2500 ? 'good' : entry.startTime <= 4000 ? 'needs-improvement' : 'poor'
      };
    });

    // First Input Delay (FID)
    this.observeWebVital('first-input', (entry) => {
      this.metrics.vitals.fid = {
        value: entry.processingStart - entry.startTime,
        timestamp: Date.now(),
        rating: (entry.processingStart - entry.startTime) <= 100 ? 'good' : 
                (entry.processingStart - entry.startTime) <= 300 ? 'needs-improvement' : 'poor'
      };
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeWebVital('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        this.metrics.vitals.cls = {
          value: clsValue,
          timestamp: Date.now(),
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
        };
      }
    });
  }

  // Observe specific web vital
  observeWebVital(type, callback) {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ entryTypes: [type] });
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  // Record API timing from Performance API
  recordApiTiming(entry) {
    const url = new URL(entry.name).pathname;
    const timing = {
      url,
      duration: entry.duration,
      responseTime: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize || 0,
      timestamp: Date.now(),
      method: 'GET' // Default, will be overridden by manual tracking
    };

    if (!this.metrics.api.has(url)) {
      this.metrics.api.set(url, []);
    }
    
    const apiMetrics = this.metrics.api.get(url);
    apiMetrics.push(timing);
    
    // Keep only last 50 entries per endpoint
    if (apiMetrics.length > 50) {
      apiMetrics.shift();
    }

    // Check for performance bottlenecks
    this.checkApiBottlenecks(url, timing);
  }

  // Manual API timing recording (called from interceptors)
  recordApiCall(endpoint, method, startTime, endTime, options = {}) {
    const duration = endTime - startTime;
    const timing = {
      url: endpoint,
      method,
      duration,
      responseTime: duration,
      transferSize: options.transferSize || 0,
      status: options.status || 200,
      cached: options.cached || false,
      retried: options.retried || false,
      timestamp: Date.now()
    };

    if (!this.metrics.api.has(endpoint)) {
      this.metrics.api.set(endpoint, []);
    }
    
    const apiMetrics = this.metrics.api.get(endpoint);
    apiMetrics.push(timing);
    
    // Keep only last 50 entries per endpoint
    if (apiMetrics.length > 50) {
      apiMetrics.shift();
    }

    // Check for performance bottlenecks
    this.checkApiBottlenecks(endpoint, timing);

    return timing;
  }

  // Record user interaction timing
  recordInteractionTiming(entry) {
    const interaction = {
      type: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      processingStart: entry.processingStart,
      processingEnd: entry.processingEnd,
      timestamp: Date.now()
    };

    if (!this.metrics.interactions.has(entry.name)) {
      this.metrics.interactions.set(entry.name, []);
    }
    
    const interactions = this.metrics.interactions.get(entry.name);
    interactions.push(interaction);
    
    // Keep only last 30 entries per interaction type
    if (interactions.length > 30) {
      interactions.shift();
    }

    // Check for interaction bottlenecks
    this.checkInteractionBottlenecks(entry.name, interaction);
  }

  // Record navigation timing
  recordNavigationTiming(entry) {
    this.metrics.navigation = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstPaint: entry.responseEnd - entry.requestStart,
      ttfb: entry.responseStart - entry.requestStart, // Time to First Byte
      timestamp: Date.now()
    };
  }

  // Record resource timing (CSS, JS, images)
  recordResourceTiming(entry) {
    if (!this.metrics.resources) {
      this.metrics.resources = [];
    }

    const resource = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      transferSize: entry.transferSize || 0,
      timestamp: Date.now()
    };

    this.metrics.resources.push(resource);
    
    // Keep only last 100 resource entries
    if (this.metrics.resources.length > 100) {
      this.metrics.resources.shift();
    }
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Check for API performance bottlenecks
  checkApiBottlenecks(endpoint, timing) {
    if (timing.duration > this.thresholds.apiResponseTime) {
      const bottleneck = {
        type: 'api_slow_response',
        endpoint,
        duration: timing.duration,
        threshold: this.thresholds.apiResponseTime,
        severity: timing.duration > this.thresholds.apiResponseTime * 2 ? 'high' : 'medium',
        timestamp: Date.now()
      };

      this.recordBottleneck(bottleneck);
      this.triggerAlert('api_performance', bottleneck);
    }
  }

  // Check for interaction bottlenecks
  checkInteractionBottlenecks(type, interaction) {
    if (interaction.duration > this.thresholds.interactionDelay) {
      const bottleneck = {
        type: 'interaction_delay',
        interactionType: type,
        duration: interaction.duration,
        threshold: this.thresholds.interactionDelay,
        severity: interaction.duration > this.thresholds.interactionDelay * 3 ? 'high' : 'medium',
        timestamp: Date.now()
      };

      this.recordBottleneck(bottleneck);
      this.triggerAlert('interaction_performance', bottleneck);
    }
  }

  // Check for memory alerts
  checkMemoryAlerts(memoryInfo) {
    if (memoryInfo.used > this.thresholds.memoryUsage) {
      const alert = {
        type: 'memory_usage_high',
        used: memoryInfo.used,
        threshold: this.thresholds.memoryUsage,
        percentage: (memoryInfo.used / memoryInfo.total) * 100,
        severity: memoryInfo.used > this.thresholds.memoryUsage * 1.5 ? 'high' : 'medium',
        timestamp: Date.now()
      };

      this.triggerAlert('memory_usage', alert);
    }
  }

  // Record performance bottleneck
  recordBottleneck(bottleneck) {
    this.metrics.bottlenecks.push(bottleneck);
    
    // Keep only last 50 bottlenecks
    if (this.metrics.bottlenecks.length > 50) {
      this.metrics.bottlenecks.shift();
    }
  }

  // Trigger performance alert
  triggerAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now()
    };

    // Call all registered alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Performance alert callback failed:', error);
      }
    });
  }

  // Register alert callback
  onAlert(callback) {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  // Get API performance statistics
  getApiStats(endpoint = null) {
    if (endpoint) {
      const metrics = this.metrics.api.get(endpoint) || [];
      return this.calculateStats(metrics);
    }

    const allStats = {};
    for (const [url, metrics] of this.metrics.api.entries()) {
      allStats[url] = this.calculateStats(metrics);
    }
    return allStats;
  }

  // Get interaction performance statistics
  getInteractionStats(type = null) {
    if (type) {
      const metrics = this.metrics.interactions.get(type) || [];
      return this.calculateStats(metrics);
    }

    const allStats = {};
    for (const [interactionType, metrics] of this.metrics.interactions.entries()) {
      allStats[interactionType] = this.calculateStats(metrics);
    }
    return allStats;
  }

  // Calculate statistics for a set of metrics
  calculateStats(metrics) {
    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      };
    }

    const durations = metrics.map(m => m.duration || m.responseTime).sort((a, b) => a - b);
    const sum = durations.reduce((acc, val) => acc + val, 0);

    return {
      count: metrics.length,
      average: sum / metrics.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      recent: metrics.slice(-10) // Last 10 entries
    };
  }

  // Get memory usage statistics
  getMemoryStats() {
    if (this.metrics.memory.length === 0) {
      return {
        current: performance.memory ? performance.memory.usedJSHeapSize : 0,
        peak: 0,
        average: 0,
        trend: 'stable'
      };
    }

    const recent = this.metrics.memory.slice(-10);
    const used = recent.map(m => m.used);
    const sum = used.reduce((acc, val) => acc + val, 0);
    const peak = Math.max(...used);
    const average = sum / used.length;

    // Calculate trend
    const firstHalf = used.slice(0, Math.floor(used.length / 2));
    const secondHalf = used.slice(Math.floor(used.length / 2));
    const firstAvg = firstHalf.reduce((acc, val) => acc + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((acc, val) => acc + val, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'increasing';
    else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';

    return {
      current: performance.memory ? performance.memory.usedJSHeapSize : 0,
      peak,
      average,
      trend,
      history: recent
    };
  }

  // Get Web Vitals
  getWebVitals() {
    return { ...this.metrics.vitals };
  }

  // Get performance bottlenecks
  getBottlenecks(type = null, severity = null) {
    let bottlenecks = [...this.metrics.bottlenecks];

    if (type) {
      bottlenecks = bottlenecks.filter(b => b.type === type);
    }

    if (severity) {
      bottlenecks = bottlenecks.filter(b => b.severity === severity);
    }

    return bottlenecks.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get comprehensive performance report
  getPerformanceReport() {
    return {
      api: this.getApiStats(),
      interactions: this.getInteractionStats(),
      memory: this.getMemoryStats(),
      webVitals: this.getWebVitals(),
      bottlenecks: this.getBottlenecks(),
      navigation: this.metrics.navigation,
      resources: this.metrics.resources?.slice(-20) || [], // Last 20 resources
      custom: this.getCustomStats(),
      timestamp: Date.now(),
      isMonitoring: this.isMonitoring
    };
  }

  // Export performance data
  exportData(format = 'json') {
    const data = this.getPerformanceReport();
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }

  // Convert data to CSV format
  convertToCSV(data) {
    const csvRows = [];
    
    // API performance CSV
    csvRows.push('API Performance');
    csvRows.push('Endpoint,Count,Average,Min,Max,P95,P99');
    
    for (const [endpoint, stats] of Object.entries(data.api)) {
      csvRows.push(`${endpoint},${stats.count},${stats.average.toFixed(2)},${stats.min},${stats.max},${stats.p95},${stats.p99}`);
    }
    
    csvRows.push('');
    
    // Memory usage CSV
    csvRows.push('Memory Usage');
    csvRows.push('Metric,Value');
    csvRows.push(`Current,${data.memory.current}`);
    csvRows.push(`Peak,${data.memory.peak}`);
    csvRows.push(`Average,${data.memory.average.toFixed(2)}`);
    csvRows.push(`Trend,${data.memory.trend}`);
    
    return csvRows.join('\n');
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.api.clear();
    this.metrics.interactions.clear();
    this.metrics.memory = [];
    this.metrics.bottlenecks = [];
    this.metrics.vitals = {};
    this.metrics.navigation = null;
    this.metrics.resources = [];
    if (this.metrics.custom) {
      this.metrics.custom.clear();
    }
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Record custom performance metric
  recordCustomMetric(name, duration, metadata = {}) {
    if (!this.metrics.custom) {
      this.metrics.custom = new Map();
    }

    if (!this.metrics.custom.has(name)) {
      this.metrics.custom.set(name, []);
    }

    const customMetrics = this.metrics.custom.get(name);
    customMetrics.push({
      duration,
      timestamp: Date.now(),
      ...metadata
    });

    // Keep only last 30 entries per custom metric
    if (customMetrics.length > 30) {
      customMetrics.shift();
    }

    // Check for custom metric bottlenecks
    if (duration > (metadata.threshold || 1000)) {
      const bottleneck = {
        type: 'custom_metric_slow',
        metricName: name,
        duration,
        threshold: metadata.threshold || 1000,
        severity: duration > (metadata.threshold || 1000) * 2 ? 'high' : 'medium',
        timestamp: Date.now()
      };

      this.recordBottleneck(bottleneck);
      this.triggerAlert('custom_performance', bottleneck);
    }
  }

  // Get custom metrics statistics
  getCustomStats(metricName = null) {
    if (!this.metrics.custom) return {};

    if (metricName) {
      const metrics = this.metrics.custom.get(metricName) || [];
      return this.calculateStats(metrics);
    }

    const allStats = {};
    for (const [name, metrics] of this.metrics.custom.entries()) {
      allStats[name] = this.calculateStats(metrics);
    }
    return allStats;
  }

  // Stop monitoring
  stop() {
    if (this.observers.performance) {
      this.observers.performance.disconnect();
    }
    if (this.observers.navigation) {
      this.observers.navigation.disconnect();
    }
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    this.isMonitoring = false;
    console.log('🔍 Performance monitoring stopped');
  }

  // Restart monitoring
  restart() {
    this.stop();
    this.initialize();
  }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;