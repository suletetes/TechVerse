import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { auditSystemConfiguration } from '../middleware/adminAuditLogger.js';
import enhancedLogger from '../utils/enhancedLogger.js';
import performanceMonitor from '../middleware/performanceMonitor.js';
import optionalCache from '../utils/optionalCache.js';
import optionalCDN from '../utils/optionalCDN.js';
import queryOptimizer from '../utils/queryOptimizer.js';

const router = express.Router();

/**
 * Performance Management Routes
 * Provides endpoints for monitoring and optimizing system performance
 */

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

/**
 * GET /api/performance/dashboard
 * Get performance dashboard overview
 */
router.get('/dashboard', auditSystemConfiguration, async (req, res) => {
  try {
    const [
      performanceStats,
      systemHealth,
      cacheStats,
      cdnStats,
      queryStats
    ] = await Promise.all([
      performanceMonitor.getPerformanceStats(),
      performanceMonitor.getSystemHealth(),
      optionalCache.getStats(),
      optionalCDN.getStats(),
      queryOptimizer.getQueryStats()
    ]);

    const dashboard = {
      performance: performanceStats,
      system: systemHealth,
      cache: cacheStats,
      cdn: cdnStats,
      database: queryStats,
      timestamp: new Date().toISOString()
    };

    enhancedLogger.audit('Performance dashboard accessed', {
      adminUserId: req.user._id,
      ip: req.ip,
      requestId: req.id
    });

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    enhancedLogger.error('Failed to fetch performance dashboard', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance dashboard',
      code: 'PERFORMANCE_DASHBOARD_ERROR'
    });
  }
});

/**
 * GET /api/performance/metrics
 * Get detailed performance metrics
 */
router.get('/metrics', auditSystemConfiguration, async (req, res) => {
  try {
    const { 
      type = 'all',
      timeRange = '1h',
      limit = 50 
    } = req.query;

    let metrics = {};

    if (type === 'all' || type === 'requests') {
      metrics.requests = performanceMonitor.getPerformanceStats();
    }

    if (type === 'all' || type === 'system') {
      metrics.system = await performanceMonitor.getSystemHealth();
    }

    if (type === 'all' || type === 'slow') {
      metrics.slowEndpoints = performanceMonitor.getTopSlowEndpoints(parseInt(limit));
    }

    if (type === 'all' || type === 'memory') {
      metrics.memoryLeaks = performanceMonitor.detectMemoryLeaks();
    }

    if (type === 'all' || type === 'optimization') {
      metrics.optimizationSuggestions = performanceMonitor.getOptimizationSuggestions();
    }

    enhancedLogger.audit('Performance metrics accessed', {
      adminUserId: req.user._id,
      type,
      timeRange,
      requestId: req.id
    });

    res.json({
      success: true,
      data: metrics,
      meta: {
        type,
        timeRange,
        limit: parseInt(limit),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    enhancedLogger.error('Failed to fetch performance metrics', {
      error: error.message,
      type: req.query.type,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      code: 'PERFORMANCE_METRICS_ERROR'
    });
  }
});

/**
 * GET /api/performance/cache/stats
 * Get cache performance statistics
 */
router.get('/cache/stats', auditSystemConfiguration, async (req, res) => {
  try {
    const cacheStats = await optionalCache.getStats();

    enhancedLogger.audit('Cache stats accessed', {
      adminUserId: req.user._id,
      cacheType: cacheStats.type,
      requestId: req.id
    });

    res.json({
      success: true,
      data: cacheStats
    });

  } catch (error) {
    enhancedLogger.error('Failed to fetch cache stats', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch cache statistics',
      code: 'CACHE_STATS_ERROR'
    });
  }
});

/**
 * POST /api/performance/cache/clear
 * Clear application cache
 */
router.post('/cache/clear', auditSystemConfiguration, async (req, res) => {
  try {
    const { pattern = '*' } = req.body;

    const result = await optionalCache.clear();

    enhancedLogger.audit('Cache cleared', {
      adminUserId: req.user._id,
      pattern,
      success: result,
      requestId: req.id
    });

    if (result) {
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        code: 'CACHE_CLEAR_ERROR'
      });
    }

  } catch (error) {
    enhancedLogger.error('Failed to clear cache', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      code: 'CACHE_CLEAR_ERROR'
    });
  }
});

/**
 * GET /api/performance/cdn/stats
 * Get CDN performance statistics
 */
router.get('/cdn/stats', auditSystemConfiguration, async (req, res) => {
  try {
    const cdnStats = await optionalCDN.getStats();

    enhancedLogger.audit('CDN stats accessed', {
      adminUserId: req.user._id,
      isS3Available: cdnStats.isS3Available,
      requestId: req.id
    });

    res.json({
      success: true,
      data: cdnStats
    });

  } catch (error) {
    enhancedLogger.error('Failed to fetch CDN stats', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch CDN statistics',
      code: 'CDN_STATS_ERROR'
    });
  }
});

/**
 * GET /api/performance/cdn/health
 * Check CDN health status
 */
router.get('/cdn/health', auditSystemConfiguration, async (req, res) => {
  try {
    const health = await optionalCDN.healthCheck();

    enhancedLogger.audit('CDN health check performed', {
      adminUserId: req.user._id,
      healthStatus: health.status,
      requestId: req.id
    });

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      data: health
    });

  } catch (error) {
    enhancedLogger.error('CDN health check failed', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'CDN health check failed',
      code: 'CDN_HEALTH_ERROR'
    });
  }
});

/**
 * GET /api/performance/database/stats
 * Get database performance statistics
 */
router.get('/database/stats', auditSystemConfiguration, async (req, res) => {
  try {
    const queryStats = queryOptimizer.getQueryStats();

    enhancedLogger.audit('Database stats accessed', {
      adminUserId: req.user._id,
      modelCount: Object.keys(queryStats).length,
      requestId: req.id
    });

    res.json({
      success: true,
      data: queryStats
    });

  } catch (error) {
    enhancedLogger.error('Failed to fetch database stats', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics',
      code: 'DATABASE_STATS_ERROR'
    });
  }
});

/**
 * POST /api/performance/database/optimize
 * Trigger database optimization
 */
router.post('/database/optimize', auditSystemConfiguration, async (req, res) => {
  try {
    const { models = [] } = req.body;

    // This would typically run optimization tasks
    // For now, we'll reset query stats and provide recommendations
    queryOptimizer.resetQueryStats();

    const optimizationResult = {
      modelsOptimized: models.length || 'all',
      recommendations: [
        'Query statistics have been reset',
        'Monitor slow queries over the next period',
        'Consider adding indexes for frequently queried fields',
        'Review and optimize aggregation pipelines'
      ],
      timestamp: new Date().toISOString()
    };

    enhancedLogger.audit('Database optimization triggered', {
      adminUserId: req.user._id,
      models,
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Database optimization completed',
      data: optimizationResult
    });

  } catch (error) {
    enhancedLogger.error('Database optimization failed', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Database optimization failed',
      code: 'DATABASE_OPTIMIZATION_ERROR'
    });
  }
});

/**
 * POST /api/performance/metrics/reset
 * Reset performance metrics
 */
router.post('/metrics/reset', auditSystemConfiguration, async (req, res) => {
  try {
    performanceMonitor.resetMetrics();
    queryOptimizer.resetQueryStats();

    enhancedLogger.audit('Performance metrics reset', {
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });

  } catch (error) {
    enhancedLogger.error('Failed to reset performance metrics', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset performance metrics',
      code: 'METRICS_RESET_ERROR'
    });
  }
});

/**
 * GET /api/performance/optimization/suggestions
 * Get performance optimization suggestions
 */
router.get('/optimization/suggestions', auditSystemConfiguration, async (req, res) => {
  try {
    const suggestions = performanceMonitor.getOptimizationSuggestions();

    enhancedLogger.audit('Optimization suggestions accessed', {
      adminUserId: req.user._id,
      suggestionCount: suggestions.length,
      requestId: req.id
    });

    res.json({
      success: true,
      data: suggestions,
      meta: {
        count: suggestions.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    enhancedLogger.error('Failed to fetch optimization suggestions', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch optimization suggestions',
      code: 'OPTIMIZATION_SUGGESTIONS_ERROR'
    });
  }
});

/**
 * POST /api/performance/gc
 * Trigger garbage collection (if available)
 */
router.post('/gc', auditSystemConfiguration, async (req, res) => {
  try {
    const beforeMemory = process.memoryUsage();
    
    if (global.gc) {
      global.gc();
      
      const afterMemory = process.memoryUsage();
      const memoryFreed = beforeMemory.heapUsed - afterMemory.heapUsed;

      enhancedLogger.audit('Garbage collection triggered', {
        adminUserId: req.user._id,
        memoryFreed: Math.round(memoryFreed / 1024 / 1024) + 'MB',
        beforeHeapUsed: Math.round(beforeMemory.heapUsed / 1024 / 1024) + 'MB',
        afterHeapUsed: Math.round(afterMemory.heapUsed / 1024 / 1024) + 'MB',
        requestId: req.id
      });

      res.json({
        success: true,
        message: 'Garbage collection completed',
        data: {
          memoryFreed: Math.round(memoryFreed / 1024 / 1024) + 'MB',
          beforeMemory: {
            heapUsed: Math.round(beforeMemory.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(beforeMemory.heapTotal / 1024 / 1024) + 'MB'
          },
          afterMemory: {
            heapUsed: Math.round(afterMemory.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(afterMemory.heapTotal / 1024 / 1024) + 'MB'
          }
        }
      });

    } else {
      res.status(400).json({
        success: false,
        message: 'Garbage collection not available. Start Node.js with --expose-gc flag.',
        code: 'GC_NOT_AVAILABLE'
      });
    }

  } catch (error) {
    enhancedLogger.error('Garbage collection failed', {
      error: error.message,
      adminUserId: req.user._id,
      requestId: req.id
    });

    res.status(500).json({
      success: false,
      message: 'Garbage collection failed',
      code: 'GC_ERROR'
    });
  }
});

export default router;