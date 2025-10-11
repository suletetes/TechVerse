import os from 'os';
import process from 'process';
import logger from '../utils/logger.js';

class PerformanceService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      memory: [],
      cpu: [],
      database: new Map(),
      cache: new Map(),
      errors: new Map()
    };
    
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    
    // Start monitoring
    this.startMonitoring();
  }

  // Start system monitoring
  startMonitoring() {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Clean old metrics every 5 minutes
    setInterval(() => {
      this.cleanOldMetrics();
    }, 300000);
  }

  // Collect system performance metrics
  collectSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAverage = os.loadavg();
    
    const timestamp = Date.now();
    
    // Memory metrics
    this.metrics.memory.push({
      timestamp,
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers
    });

    // CPU metrics
    this.metrics.cpu.push({
      timestamp,
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: loadAverage[0] // 1-minute load average
    });

    // Keep only last 100 entries
    if (this.metrics.memory.length > 100) {
      this.metrics.memory = this.metrics.memory.slice(-100);
    }
    
    if (this.metrics.cpu.length > 100) {
      this.metrics.cpu = this.metrics.cpu.slice(-100);
    }

    // Log warnings for high resource usage
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) { // 500MB threshold
      logger.warn('High memory usage detected', {
        heapUsed: `${memoryUsageMB.toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
      });
    }

    if (loadAverage[0] > os.cpus().length) {
      logger.warn('High CPU load detected', {
        loadAverage: loadAverage[0],
        cpuCount: os.cpus().length
      });
    }
  }

  // Track request performance
  trackRequest(req, res, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const path = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    this.requestCount++;
    
    const requestKey = `${method}:${path}`;
    
    if (!this.metrics.requests.has(requestKey)) {
      this.metrics.requests.set(requestKey, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        statusCodes: new Map(),
        errors: 0
      });
    }
    
    const requestMetrics = this.metrics.requests.get(requestKey);
    requestMetrics.count++;
    requestMetrics.totalDuration += duration;
    requestMetrics.minDuration = Math.min(requestMetrics.minDuration, duration);
    requestMetrics.maxDuration = Math.max(requestMetrics.maxDuration, duration);
    requestMetrics.avgDuration = requestMetrics.totalDuration / requestMetrics.count;
    
    // Track status codes
    if (!requestMetrics.statusCodes.has(statusCode)) {
      requestMetrics.statusCodes.set(statusCode, 0);
    }
    requestMetrics.statusCodes.set(statusCode, requestMetrics.statusCodes.get(statusCode) + 1);
    
    // Track errors
    if (statusCode >= 400) {
      requestMetrics.errors++;
      this.errorCount++;
    }

    // Log slow requests
    if (duration > 1000) { // Slower than 1 second
      logger.warn('Slow request detected', {
        method,
        path,
        duration: `${duration}ms`,
        statusCode,
        userAgent: req.headers['user-agent']
      });
    }

    // Log error requests
    if (statusCode >= 500) {
      logger.error('Server error request', {
        method,
        path,
        duration: `${duration}ms`,
        statusCode,
        userAgent: req.headers['user-agent']
      });
    }
  }

  // Track database query performance
  trackDatabaseQuery(operation, collection, duration, error = null) {
    const key = `${operation}:${collection}`;
    
    if (!this.metrics.database.has(key)) {
      this.metrics.database.set(key, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        errors: 0
      });
    }
    
    const dbMetrics = this.metrics.database.get(key);
    dbMetrics.count++;
    dbMetrics.totalDuration += duration;
    dbMetrics.minDuration = Math.min(dbMetrics.minDuration, duration);
    dbMetrics.maxDuration = Math.max(dbMetrics.maxDuration, duration);
    dbMetrics.avgDuration = dbMetrics.totalDuration / dbMetrics.count;
    
    if (error) {
      dbMetrics.errors++;
    }

    // Log slow queries
    if (duration > 100) { // Slower than 100ms
      logger.warn('Slow database query', {
        operation,
        collection,
        duration: `${duration}ms`,
        error: error?.message
      });
    }
  }

  // Track cache performance
  trackCacheOperation(operation, key, hit = false, duration = 0) {
    const cacheKey = `cache:${operation}`;
    
    if (!this.metrics.cache.has(cacheKey)) {
      this.metrics.cache.set(cacheKey, {
        count: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalDuration: 0,
        avgDuration: 0
      });
    }
    
    const cacheMetrics = this.metrics.cache.get(cacheKey);
    cacheMetrics.count++;
    cacheMetrics.totalDuration += duration;
    cacheMetrics.avgDuration = cacheMetrics.totalDuration / cacheMetrics.count;
    
    if (hit) {
      cacheMetrics.hits++;
    } else {
      cacheMetrics.misses++;
    }
    
    cacheMetrics.hitRate = (cacheMetrics.hits / cacheMetrics.count) * 100;
  }

  // Track application errors
  trackError(error, context = {}) {
    const errorKey = error.name || 'UnknownError';
    
    if (!this.metrics.errors.has(errorKey)) {
      this.metrics.errors.set(errorKey, {
        count: 0,
        lastOccurrence: null,
        contexts: []
      });
    }
    
    const errorMetrics = this.metrics.errors.get(errorKey);
    errorMetrics.count++;
    errorMetrics.lastOccurrence = Date.now();
    errorMetrics.contexts.push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context
    });
    
    // Keep only last 10 error contexts
    if (errorMetrics.contexts.length > 10) {
      errorMetrics.contexts = errorMetrics.contexts.slice(-10);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate request statistics
    let totalRequests = 0;
    let totalErrors = 0;
    let avgResponseTime = 0;
    let slowestEndpoint = null;
    let slowestTime = 0;
    
    for (const [endpoint, metrics] of this.metrics.requests) {
      totalRequests += metrics.count;
      totalErrors += metrics.errors;
      avgResponseTime += metrics.avgDuration * metrics.count;
      
      if (metrics.maxDuration > slowestTime) {
        slowestTime = metrics.maxDuration;
        slowestEndpoint = endpoint;
      }
    }
    
    avgResponseTime = totalRequests > 0 ? avgResponseTime / totalRequests : 0;
    
    // Calculate database statistics
    let totalDbQueries = 0;
    let avgDbTime = 0;
    let slowestQuery = null;
    let slowestQueryTime = 0;
    
    for (const [query, metrics] of this.metrics.database) {
      totalDbQueries += metrics.count;
      avgDbTime += metrics.avgDuration * metrics.count;
      
      if (metrics.maxDuration > slowestQueryTime) {
        slowestQueryTime = metrics.maxDuration;
        slowestQuery = query;
      }
    }
    
    avgDbTime = totalDbQueries > 0 ? avgDbTime / totalDbQueries : 0;
    
    // Calculate cache statistics
    let totalCacheOps = 0;
    let totalCacheHits = 0;
    
    for (const [operation, metrics] of this.metrics.cache) {
      totalCacheOps += metrics.count;
      totalCacheHits += metrics.hits;
    }
    
    const cacheHitRate = totalCacheOps > 0 ? (totalCacheHits / totalCacheOps) * 100 : 0;

    return {
      system: {
        uptime: Math.floor(uptime / 1000), // seconds
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) // %
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          loadAverage: os.loadavg()[0]
        }
      },
      requests: {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        slowestEndpoint,
        slowestTime: Math.round(slowestTime)
      },
      database: {
        totalQueries: totalDbQueries,
        avgQueryTime: Math.round(avgDbTime),
        slowestQuery,
        slowestQueryTime: Math.round(slowestQueryTime)
      },
      cache: {
        totalOperations: totalCacheOps,
        hitRate: Math.round(cacheHitRate * 100) / 100
      },
      errors: {
        total: this.errorCount,
        uniqueTypes: this.metrics.errors.size
      }
    };
  }

  // Get detailed metrics
  getDetailedMetrics() {
    return {
      requests: Object.fromEntries(this.metrics.requests),
      database: Object.fromEntries(this.metrics.database),
      cache: Object.fromEntries(this.metrics.cache),
      errors: Object.fromEntries(this.metrics.errors),
      memory: this.metrics.memory.slice(-20), // Last 20 entries
      cpu: this.metrics.cpu.slice(-20) // Last 20 entries
    };
  }

  // Get health status
  getHealthStatus() {
    const summary = this.getPerformanceSummary();
    const issues = [];
    
    // Check memory usage
    if (summary.system.memory.usage > 80) {
      issues.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${summary.system.memory.usage}%`
      });
    }
    
    // Check error rate
    if (summary.requests.errorRate > 5) {
      issues.push({
        type: 'errors',
        severity: 'error',
        message: `High error rate: ${summary.requests.errorRate}%`
      });
    }
    
    // Check response time
    if (summary.requests.avgResponseTime > 1000) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: `Slow average response time: ${summary.requests.avgResponseTime}ms`
      });
    }
    
    // Check cache hit rate
    if (summary.cache.hitRate < 70 && summary.cache.totalOperations > 100) {
      issues.push({
        type: 'cache',
        severity: 'warning',
        message: `Low cache hit rate: ${summary.cache.hitRate}%`
      });
    }

    return {
      status: issues.length === 0 ? 'healthy' : 
              issues.some(i => i.severity === 'error') ? 'unhealthy' : 'warning',
      issues,
      summary
    };
  }

  // Clean old metrics to prevent memory leaks
  cleanOldMetrics() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean memory metrics
    this.metrics.memory = this.metrics.memory.filter(m => m.timestamp > cutoffTime);
    
    // Clean CPU metrics
    this.metrics.cpu = this.metrics.cpu.filter(c => c.timestamp > cutoffTime);
    
    // Clean error contexts
    for (const [errorType, errorMetrics] of this.metrics.errors) {
      errorMetrics.contexts = errorMetrics.contexts.filter(c => c.timestamp > cutoffTime);
      
      // Remove error types with no recent contexts
      if (errorMetrics.contexts.length === 0 && errorMetrics.lastOccurrence < cutoffTime) {
        this.metrics.errors.delete(errorType);
      }
    }
    
    logger.debug('Performance metrics cleaned', {
      memoryEntries: this.metrics.memory.length,
      cpuEntries: this.metrics.cpu.length,
      errorTypes: this.metrics.errors.size
    });
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      requests: new Map(),
      memory: [],
      cpu: [],
      database: new Map(),
      cache: new Map(),
      errors: new Map()
    };
    
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    
    logger.info('Performance metrics reset');
  }

  // Export metrics for external monitoring
  exportMetrics() {
    const summary = this.getPerformanceSummary();
    const detailed = this.getDetailedMetrics();
    
    return {
      timestamp: Date.now(),
      summary,
      detailed
    };
  }
}

// Create and export singleton instance
const performanceService = new PerformanceService();

// Middleware for tracking request performance
export const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    performanceService.trackRequest(req, res, startTime);
  });
  
  next();
};

// Middleware for tracking errors
export const errorTrackingMiddleware = (error, req, res, next) => {
  performanceService.trackError(error, {
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  next(error);
};

export default performanceService;