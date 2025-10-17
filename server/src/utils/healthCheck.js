import mongoose from 'mongoose';
import logger from './logger.js';

/**
 * Comprehensive health check utility for TechVerse API
 * Provides detailed system status information
 */

class HealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.checks = new Map();
  }

  /**
   * Get basic server health status
   */
  getBasicHealth() {
    return {
      status: 'OK',
      message: 'TechVerse API is running',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime()
    };
  }

  /**
   * Get comprehensive health status including database
   */
  async getDetailedHealth() {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    // Check database connectivity
    health.services.database = await this.checkDatabase();
    
    // Check memory usage
    health.services.memory = this.checkMemory();
    
    // Check process health
    health.services.process = this.checkProcess();

    // Determine overall status
    const allServicesHealthy = Object.values(health.services)
      .every(service => service.status === 'healthy');
    
    health.status = allServicesHealthy ? 'OK' : 'DEGRADED';

    return health;
  }

  /**
   * Check database connectivity and performance
   */
  async checkDatabase() {
    try {
      const startTime = Date.now();
      
      // Check connection state
      const connectionState = mongoose.connection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      if (connectionState !== 1) {
        return {
          status: 'unhealthy',
          message: `Database ${stateMap[connectionState]}`,
          responseTime: null
        };
      }

      // Test database query performance
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Database connected and responsive',
        responseTime: `${responseTime}ms`,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        collections: await this.getCollectionStats()
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const stats = {};

      for (const collection of collections) {
        try {
          const collStats = await mongoose.connection.db
            .collection(collection.name)
            .estimatedDocumentCount();
          stats[collection.name] = {
            documentCount: collStats
          };
        } catch (error) {
          stats[collection.name] = {
            documentCount: 'unknown',
            error: error.message
          };
        }
      }

      return stats;
    } catch (error) {
      return { error: 'Unable to retrieve collection stats' };
    }
  }

  /**
   * Check memory usage
   */
  checkMemory() {
    const memUsage = process.memoryUsage();
    const formatBytes = (bytes) => {
      return `${Math.round(bytes / 1024 / 1024 * 100) / 100} MB`;
    };

    const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    return {
      status: heapUsedPercent > 90 ? 'warning' : 'healthy',
      heapUsed: formatBytes(memUsage.heapUsed),
      heapTotal: formatBytes(memUsage.heapTotal),
      heapUsedPercent: `${heapUsedPercent}%`,
      rss: formatBytes(memUsage.rss),
      external: formatBytes(memUsage.external)
    };
  }

  /**
   * Check process health
   */
  checkProcess() {
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'healthy',
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuUsage: {
        user: `${Math.round(cpuUsage.user / 1000)}ms`,
        system: `${Math.round(cpuUsage.system / 1000)}ms`
      }
    };
  }

  /**
   * Get server uptime
   */
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    return {
      ms: uptimeMs,
      human: `${hours}h ${minutes}m ${seconds}s`
    };
  }

  /**
   * Add custom health check
   */
  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  /**
   * Run all custom health checks
   */
  async runCustomChecks() {
    const results = {};
    
    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
      } catch (error) {
        results[name] = {
          status: 'error',
          message: error.message
        };
      }
    }
    
    return results;
  }

  /**
   * Get health check for specific service
   */
  async getServiceHealth(serviceName) {
    switch (serviceName) {
      case 'database':
        return await this.checkDatabase();
      case 'memory':
        return this.checkMemory();
      case 'process':
        return this.checkProcess();
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }
}

// Create singleton instance
const healthCheck = new HealthCheck();

export default healthCheck;

// Export individual functions for convenience
export const {
  getBasicHealth,
  getDetailedHealth,
  checkDatabase,
  checkMemory,
  checkProcess,
  addCheck,
  runCustomChecks,
  getServiceHealth
} = healthCheck;