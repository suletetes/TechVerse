import enhancedLogger from '../utils/enhancedLogger.js';
import optionalCache from '../utils/optionalCache.js';

/**
 * Performance Monitoring Middleware
 * Tracks and optimizes application performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowRequestThreshold = 1000; // 1 second
    this.memoryWarningThreshold = 0.8; // 80% memory usage
    this.cpuWarningThreshold = 0.8; // 80% CPU usage
    this.enableDetailedLogging = process.env.NODE_ENV === 'development';
    this.isDisabled = process.env.DISABLE_PERFORMANCE_MONITORING === 'true';
    
    // Start system monitoring only if not disabled
    if (!this.isDisabled) {
      this.startSystemMonitoring();
    }
  }

  /**
   * Request performance monitoring middleware
   */
  monitorRequest() {
    return (req, res, next) => {
      // Skip monitoring if disabled
      if (this.isDisabled) {
        return next();
      }
      
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      // Add performance tracking to request
      req.performance = {
        startTime,
        startMemory,
        endpoint: req.originalUrl,
        method: req.method
      };

      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        const metrics = {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          memoryDelta: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external
          },
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?._id,
          timestamp: new Date().toISOString()
        };

        // Track metrics
        this.trackRequestMetrics(metrics);

        // Log slow requests
        if (duration > this.slowRequestThreshold) {
          enhancedLogger.warn('Slow request detected', {
            ...metrics,
            threshold: this.slowRequestThreshold
          });
        }

        // Log detailed metrics in development
        if (this.enableDetailedLogging) {
          enhancedLogger.debug('Request performance', metrics);
        }

        return originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Track request metrics
   */
  trackRequestMetrics(metrics) {
    const key = `${metrics.method}:${metrics.endpoint}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        slowRequests: 0,
        errorCount: 0,
        successCount: 0,
        memoryUsage: {
          totalRss: 0,
          totalHeapUsed: 0,
          avgRss: 0,
          avgHeapUsed: 0
        }
      });
    }

    const endpointMetrics = this.metrics.get(key);
    endpointMetrics.count++;
    endpointMetrics.totalDuration += metrics.duration;
    endpointMetrics.avgDuration = endpointMetrics.totalDuration / endpointMetrics.count;
    endpointMetrics.minDuration = Math.min(endpointMetrics.minDuration, metrics.duration);
    endpointMetrics.maxDuration = Math.max(endpointMetrics.maxDuration, metrics.duration);

    if (metrics.duration > this.slowRequestThreshold) {
      endpointMetrics.slowRequests++;
    }

    if (metrics.statusCode >= 400) {
      endpointMetrics.errorCount++;
    } else {
      endpointMetrics.successCount++;
    }

    // Track memory usage
    endpointMetrics.memoryUsage.totalRss += metrics.memoryDelta.rss;
    endpointMetrics.memoryUsage.totalHeapUsed += metrics.memoryDelta.heapUsed;
    endpointMetrics.memoryUsage.avgRss = endpointMetrics.memoryUsage.totalRss / endpointMetrics.count;
    endpointMetrics.memoryUsage.avgHeapUsed = endpointMetrics.memoryUsage.totalHeapUsed / endpointMetrics.count;
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Monitor memory usage every 10 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 10000);
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      const systemMetrics = {
        memory: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          arrayBuffers: memoryUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime,
        timestamp: new Date().toISOString()
      };

      // Cache system metrics for dashboard
      optionalCache.set('system_metrics', systemMetrics, 60); // Cache for 1 minute

      // Log system metrics periodically
      if (this.enableDetailedLogging) {
        enhancedLogger.debug('System metrics', systemMetrics);
      }

    } catch (error) {
      enhancedLogger.error('System metrics collection error', {
        error: error.message
      });
    }
  }

  /**
   * Check memory usage and warn if high
   */
  checkMemoryUsage() {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryUsageRatio = usedMemory / totalMemory;

      if (memoryUsageRatio > this.memoryWarningThreshold) {
        enhancedLogger.warn('High memory usage detected', {
          usedMemory: Math.round(usedMemory / 1024 / 1024) + 'MB',
          totalMemory: Math.round(totalMemory / 1024 / 1024) + 'MB',
          usagePercentage: Math.round(memoryUsageRatio * 100) + '%',
          threshold: Math.round(this.memoryWarningThreshold * 100) + '%'
        });

        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
          enhancedLogger.info('Garbage collection triggered');
        }
      }

    } catch (error) {
      enhancedLogger.error('Memory usage check error', {
        error: error.message
      });
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats = {
      endpoints: {},
      summary: {
        totalRequests: 0,
        totalSlowRequests: 0,
        totalErrors: 0,
        avgResponseTime: 0,
        slowestEndpoint: null,
        fastestEndpoint: null
      }
    };

    let totalDuration = 0;
    let slowestDuration = 0;
    let fastestDuration = Infinity;

    for (const [endpoint, metrics] of this.metrics.entries()) {
      stats.endpoints[endpoint] = {
        ...metrics,
        errorRate: (metrics.errorCount / metrics.count) * 100,
        slowRequestRate: (metrics.slowRequests / metrics.count) * 100
      };

      stats.summary.totalRequests += metrics.count;
      stats.summary.totalSlowRequests += metrics.slowRequests;
      stats.summary.totalErrors += metrics.errorCount;
      totalDuration += metrics.totalDuration;

      if (metrics.maxDuration > slowestDuration) {
        slowestDuration = metrics.maxDuration;
        stats.summary.slowestEndpoint = endpoint;
      }

      if (metrics.minDuration < fastestDuration) {
        fastestDuration = metrics.minDuration;
        stats.summary.fastestEndpoint = endpoint;
      }
    }

    stats.summary.avgResponseTime = stats.summary.totalRequests > 0 
      ? totalDuration / stats.summary.totalRequests 
      : 0;

    return stats;
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();

      // Get cache statistics
      const cacheStats = await optionalCache.getStats();

      // Calculate health scores
      const memoryHealth = this.calculateMemoryHealth(memoryUsage);
      const performanceHealth = this.calculatePerformanceHealth();

      return {
        status: this.getOverallHealthStatus(memoryHealth, performanceHealth),
        memory: {
          ...memoryUsage,
          health: memoryHealth,
          usagePercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        cpu: {
          ...cpuUsage,
          uptime
        },
        cache: cacheStats,
        performance: {
          health: performanceHealth,
          slowRequestRate: this.getSlowRequestRate(),
          errorRate: this.getErrorRate()
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      enhancedLogger.error('System health check error', {
        error: error.message
      });

      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate memory health score
   */
  calculateMemoryHealth(memoryUsage) {
    const usageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    if (usageRatio < 0.5) return 'excellent';
    if (usageRatio < 0.7) return 'good';
    if (usageRatio < 0.85) return 'warning';
    return 'critical';
  }

  /**
   * Calculate performance health score
   */
  calculatePerformanceHealth() {
    const slowRequestRate = this.getSlowRequestRate();
    const errorRate = this.getErrorRate();

    if (slowRequestRate < 5 && errorRate < 1) return 'excellent';
    if (slowRequestRate < 10 && errorRate < 5) return 'good';
    if (slowRequestRate < 20 && errorRate < 10) return 'warning';
    return 'critical';
  }

  /**
   * Get overall health status
   */
  getOverallHealthStatus(memoryHealth, performanceHealth) {
    const healthLevels = { excellent: 4, good: 3, warning: 2, critical: 1 };
    const avgHealth = (healthLevels[memoryHealth] + healthLevels[performanceHealth]) / 2;

    if (avgHealth >= 3.5) return 'healthy';
    if (avgHealth >= 2.5) return 'warning';
    return 'unhealthy';
  }

  /**
   * Get slow request rate
   */
  getSlowRequestRate() {
    let totalRequests = 0;
    let totalSlowRequests = 0;

    for (const metrics of this.metrics.values()) {
      totalRequests += metrics.count;
      totalSlowRequests += metrics.slowRequests;
    }

    return totalRequests > 0 ? (totalSlowRequests / totalRequests) * 100 : 0;
  }

  /**
   * Get error rate
   */
  getErrorRate() {
    let totalRequests = 0;
    let totalErrors = 0;

    for (const metrics of this.metrics.values()) {
      totalRequests += metrics.count;
      totalErrors += metrics.errorCount;
    }

    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics.clear();
    enhancedLogger.info('Performance metrics reset');
  }

  /**
   * Get top slow endpoints
   */
  getTopSlowEndpoints(limit = 10) {
    const endpoints = Array.from(this.metrics.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        avgDuration: metrics.avgDuration,
        maxDuration: metrics.maxDuration,
        slowRequests: metrics.slowRequests,
        count: metrics.count,
        slowRequestRate: (metrics.slowRequests / metrics.count) * 100
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);

    return endpoints;
  }

  /**
   * Get memory leak detection
   */
  detectMemoryLeaks() {
    const currentMemory = process.memoryUsage();
    const leakDetection = {
      status: 'normal',
      warnings: [],
      recommendations: []
    };

    // Check for excessive heap usage
    const heapUsageRatio = currentMemory.heapUsed / currentMemory.heapTotal;
    if (heapUsageRatio > 0.9) {
      leakDetection.status = 'warning';
      leakDetection.warnings.push('Heap usage is very high (>90%)');
      leakDetection.recommendations.push('Consider running garbage collection or investigating memory leaks');
    }

    // Check for excessive external memory
    if (currentMemory.external > 100 * 1024 * 1024) { // 100MB
      leakDetection.warnings.push('External memory usage is high');
      leakDetection.recommendations.push('Check for large buffers or external resources');
    }

    // Check for array buffer usage
    if (currentMemory.arrayBuffers > 50 * 1024 * 1024) { // 50MB
      leakDetection.warnings.push('Array buffer usage is high');
      leakDetection.recommendations.push('Review array buffer allocations');
    }

    return leakDetection;
  }

  /**
   * Performance optimization suggestions
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const stats = this.getPerformanceStats();

    // Check for slow endpoints
    const slowEndpoints = this.getTopSlowEndpoints(5);
    if (slowEndpoints.length > 0) {
      suggestions.push({
        type: 'slow_endpoints',
        priority: 'high',
        message: `${slowEndpoints.length} endpoints have slow response times`,
        details: slowEndpoints,
        recommendations: [
          'Add database indexes for frequently queried fields',
          'Implement caching for expensive operations',
          'Optimize database queries',
          'Consider pagination for large result sets'
        ]
      });
    }

    // Check error rates
    if (stats.summary.totalErrors > 0) {
      const errorRate = (stats.summary.totalErrors / stats.summary.totalRequests) * 100;
      if (errorRate > 5) {
        suggestions.push({
          type: 'high_error_rate',
          priority: 'high',
          message: `Error rate is ${errorRate.toFixed(1)}%`,
          recommendations: [
            'Review error logs for common issues',
            'Implement better error handling',
            'Add input validation',
            'Monitor third-party service dependencies'
          ]
        });
      }
    }

    // Check memory usage
    const memoryHealth = this.detectMemoryLeaks();
    if (memoryHealth.status === 'warning') {
      suggestions.push({
        type: 'memory_usage',
        priority: 'medium',
        message: 'Memory usage patterns suggest potential issues',
        details: memoryHealth,
        recommendations: memoryHealth.recommendations
      });
    }

    return suggestions;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;