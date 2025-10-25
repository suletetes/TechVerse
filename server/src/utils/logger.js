// Enhanced Logger Utility for TechVerse API
// Provides structured logging with different levels and metadata support

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
  }

  /**
   * Format log entry with timestamp and metadata
   */
  formatLog(level, message, meta = {}, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(meta).length > 0 && { meta }),
      ...(error && {
        error: {
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
          name: error.name
        }
      })
    };

    return logEntry;
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
    return levels[level] <= levels[this.logLevel];
  }

  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;

    const logEntry = this.formatLog('info', message, meta);

    // Reduce info logging in development
    if (!this.isDevelopment) {
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message, error = null, meta = {}) {
    if (!this.shouldLog('error')) return;

    const logEntry = this.formatLog('error', message, meta, error);

    if (this.isDevelopment) {
      console.error('❌ ERROR:', message);
      if (error) {
        console.error('   Stack:', error.stack || error.message);
      }
      if (Object.keys(meta).length > 0) {
        console.error('   Meta:', meta);
      }
    } else {
      console.error(JSON.stringify(logEntry));
    }
  }

  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;

    const logEntry = this.formatLog('warn', message, meta);

    if (this.isDevelopment) {
      console.warn('⚠️ WARN:', message, Object.keys(meta).length > 0 ? meta : '');
    } else {
      console.warn(JSON.stringify(logEntry));
    }
  }

  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;

    const logEntry = this.formatLog('debug', message, meta);

    if (this.isDevelopment) {
      console.debug('🐛 DEBUG:', message, Object.keys(meta).length > 0 ? meta : '');
    } else {
      console.debug(JSON.stringify(logEntry));
    }
  }

  http(req, res, responseTime) {
    if (!this.shouldLog('http')) return;

    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.requestId
    };

    const message = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;
    const logEntry = this.formatLog('http', message, meta);

    if (this.isDevelopment && res.statusCode >= 400) {
      // Only log errors and warnings in development
      console.log(`🌐 ❌ ${message}`);
    } else if (!this.isDevelopment) {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log database operations
   */
  database(operation, details = {}) {
    if (!this.shouldLog('info')) return;

    const message = `Database ${operation}`;
    const meta = {
      operation,
      ...details
    };

    const logEntry = this.formatLog('info', message, meta);

    if (this.isDevelopment) {
      console.log(`📦 ${message}:`, details);
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Log security events
   */
  security(event, details = {}) {
    const message = `Security event: ${event}`;
    const meta = {
      event,
      timestamp: new Date().toISOString(),
      ...details
    };

    const logEntry = this.formatLog('warn', message, meta);

    if (this.isDevelopment) {
      console.warn(`🔒 SECURITY:`, message, details);
    } else {
      console.warn(JSON.stringify(logEntry));
    }
  }

  /**
   * Log performance metrics
   */
  performance(metric, value, meta = {}) {
    if (!this.shouldLog('info')) return;

    const message = `Performance: ${metric} = ${value}`;
    const logMeta = {
      metric,
      value,
      ...meta
    };

    const logEntry = this.formatLog('info', message, logMeta);

    if (this.isDevelopment) {
      console.log(`⚡ PERF: ${message}`, Object.keys(meta).length > 0 ? meta : '');
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
}

export default new Logger();