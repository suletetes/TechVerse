/**
 * Performance Optimization Service
 * Provides comprehensive performance monitoring and optimization features
 */

import os from 'os';
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

    // Only log warnings for very high resource usage
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 1000) { // 1GB threshold
      logger.warn('Very high memory usage detected', {
        heapUsed: `${memoryUsageMB.toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
      });
    }

    if (loadAverage[0] > os.cpus().length * 2) { // 2x CPU count threshold
      logger.warn('Very high CPU load detected', {
        loadAverage: loadAverage[0],
        cpuCount: os.cpus().length
      });
    }
  }

  // Track request performance (reduced logging)
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

    // Only log very slow requests (over 5 seconds)
    if (duration > 5000) {
      logger.warn('Very slow request detected', {
        method,
        path,
        duration: `${duration}ms`,
        statusCode,
        userAgent: req.headers['user-agent']
      });
    }

    // Only log server errors
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

  // Track database query performance (reduced logging)
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

    // Only log very slow queries (over 2 seconds)
    if (duration > 2000) {
      logger.warn('Very slow database query', {
        operation,
        collection,
        duration: `${duration}ms`,
        error: error?.message
      });
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
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

    return {
      system: {
        uptime: Math.floor(uptime / 1000), // seconds
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) // %
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
      }
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
      if (errorMetrics.contexts) {
        errorMetrics.contexts = errorMetrics.contexts.filter(c => c.timestamp > cutoffTime);
        
        // Remove error types with no recent contexts
        if (errorMetrics.contexts.length === 0 && errorMetrics.lastOccurrence < cutoffTime) {
          this.metrics.errors.delete(errorType);
        }
      }
    }
  }
}

// Create and export singleton instance
const performanceService = new PerformanceService();

// Middleware for tracking request performance (reduced logging)
export const performanceMiddleware = (req, res, next) => {
  // Skip performance tracking for static assets
  if (req.originalUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/i)) {
    return next();
  }
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    performanceService.trackRequest(req, res, startTime);
  });
  
  next();
};

export default performanceService;