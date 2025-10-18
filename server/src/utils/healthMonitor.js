/**
 * Health Monitor Utility
 * Provides continuous health monitoring and alerting capabilities
 */

import healthCheck from './healthCheck.js';
import logger from './logger.js';

class HealthMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 30000; // 30 seconds default
    this.alertThresholds = {
      memoryUsage: options.memoryThreshold || 90, // 90% memory usage
      responseTime: options.responseTimeThreshold || 1000, // 1 second
      ...options.thresholds
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.healthHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
  }

  /**
   * Start continuous health monitoring
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('Health monitoring is already running');
      return;
    }

    logger.info('Starting health monitoring', {
      interval: `${this.interval}ms`,
      thresholds: this.alertThresholds
    });

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.interval);

    // Perform initial health check
    this.performHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (!this.isMonitoring) {
      logger.warn('Health monitoring is not running');
      return;
    }

    logger.info('Stopping health monitoring');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Perform a single health check and evaluate alerts
   */
  async performHealthCheck() {
    try {
      const health = await healthCheck.getDetailedHealth();
      const timestamp = new Date().toISOString();

      // Add to history
      this.addToHistory({
        timestamp,
        status: health.status,
        services: health.services
      });

      // Check for alerts
      this.evaluateAlerts(health);

      // Log periodic health status (only in development or if issues detected)
      if (process.env.NODE_ENV === 'development' || health.status !== 'OK') {
        logger.info('Health check completed', {
          status: health.status,
          database: health.services.database.status,
          memory: health.services.memory.status,
          responseTime: health.services.database.responseTime
        });
      }

    } catch (error) {
      logger.error('Health monitoring check failed', error);
      
      this.addToHistory({
        timestamp: new Date().toISOString(),
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Evaluate health data against alert thresholds
   */
  evaluateAlerts(health) {
    const alerts = [];

    // Check memory usage
    if (health.services.memory && health.services.memory.heapUsedPercent) {
      const memoryPercent = parseInt(health.services.memory.heapUsedPercent.replace('%', ''));
      if (memoryPercent >= this.alertThresholds.memoryUsage) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `High memory usage: ${health.services.memory.heapUsedPercent}`,
          threshold: `${this.alertThresholds.memoryUsage}%`,
          current: health.services.memory.heapUsedPercent
        });
      }
    }

    // Check database response time
    if (health.services.database && health.services.database.responseTime) {
      const responseTime = parseInt(health.services.database.responseTime.replace('ms', ''));
      if (responseTime >= this.alertThresholds.responseTime) {
        alerts.push({
          type: 'database_performance',
          severity: 'warning',
          message: `Slow database response: ${health.services.database.responseTime}`,
          threshold: `${this.alertThresholds.responseTime}ms`,
          current: health.services.database.responseTime
        });
      }
    }

    // Check database connectivity
    if (health.services.database && health.services.database.status !== 'healthy') {
      alerts.push({
        type: 'database_connectivity',
        severity: 'critical',
        message: `Database connectivity issue: ${health.services.database.message}`,
        status: health.services.database.status
      });
    }

    // Log alerts
    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        logger.error(`Health Alert: ${alert.message}`, null, alert);
      } else {
        logger.warn(`Health Alert: ${alert.message}`, alert);
      }
    });

    return alerts;
  }

  /**
   * Add health check result to history
   */
  addToHistory(healthData) {
    this.healthHistory.push(healthData);
    
    // Maintain history size limit
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 10) {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get health statistics from history
   */
  getHealthStats() {
    if (this.healthHistory.length === 0) {
      return { message: 'No health data available' };
    }

    const recentHistory = this.healthHistory.slice(-20); // Last 20 checks
    const healthyCount = recentHistory.filter(h => h.status === 'OK').length;
    const degradedCount = recentHistory.filter(h => h.status === 'DEGRADED').length;
    const errorCount = recentHistory.filter(h => h.status === 'ERROR').length;

    return {
      totalChecks: recentHistory.length,
      healthyCount,
      degradedCount,
      errorCount,
      healthyPercentage: Math.round((healthyCount / recentHistory.length) * 100),
      lastCheck: recentHistory[recentHistory.length - 1],
      isMonitoring: this.isMonitoring,
      interval: this.interval
    };
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      interval: this.interval,
      thresholds: this.alertThresholds,
      historySize: this.healthHistory.length,
      maxHistorySize: this.maxHistorySize
    };
  }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

export default healthMonitor;

// Export class for custom instances
export { HealthMonitor };