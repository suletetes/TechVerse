import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced logging system with structured logging and rotation
 */
class EnhancedLogger {
  constructor() {
    this.logger = null;
    this.initialize();
  }

  initialize() {
    const logDir = path.join(__dirname, '../../logs');
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

    // Custom format for structured logging
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const logEntry = {
          timestamp,
          level: level.toUpperCase(),
          message,
          ...meta
        };

        // Add request ID if available
        if (meta.requestId) {
          logEntry.requestId = meta.requestId;
        }

        // Add user context if available
        if (meta.userId) {
          logEntry.userId = meta.userId;
        }

        return JSON.stringify(logEntry);
      })
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let logMessage = `${timestamp} [${level}] ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return logMessage;
      })
    );

    const transports = [];

    // Console transport
    transports.push(
      new winston.transports.Console({
        level: logLevel,
        format: isProduction ? customFormat : consoleFormat,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // File transports for production
    if (isProduction) {
      // General application logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
          format: customFormat,
          handleExceptions: true,
          handleRejections: true
        })
      );

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: customFormat,
          handleExceptions: true,
          handleRejections: true
        })
      );

      // Security logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          level: 'warn',
          format: customFormat,
          handleExceptions: true,
          handleRejections: true,
          // Only log security-related events
          filter: (info) => {
            return info.category === 'security' || 
                   info.type === 'security' ||
                   info.message?.toLowerCase().includes('security') ||
                   info.message?.toLowerCase().includes('auth');
          }
        })
      );

      // Audit logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logDir, 'audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '365d',
          level: 'info',
          format: customFormat,
          // Only log audit events
          filter: (info) => {
            return info.category === 'audit' || 
                   info.type === 'audit' ||
                   info.audit === true;
          }
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: customFormat,
      transports,
      exitOnError: false,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: [
        new winston.transports.Console({
          format: consoleFormat
        })
      ],
      rejectionHandlers: [
        new winston.transports.Console({
          format: consoleFormat
        })
      ]
    });

    // Add request context helper
    this.logger.withRequest = (req) => {
      return this.logger.child({
        requestId: req.id || req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || req.user?._id
      });
    };

    // Add user context helper
    this.logger.withUser = (user) => {
      return this.logger.child({
        userId: user?.id || user?._id,
        userEmail: user?.email,
        userRole: user?.role
      });
    };
  }

  // Security logging methods
  security(message, meta = {}) {
    this.logger.warn(message, {
      ...meta,
      category: 'security',
      type: 'security'
    });
  }

  // Audit logging methods
  audit(message, meta = {}) {
    this.logger.info(message, {
      ...meta,
      category: 'audit',
      type: 'audit',
      audit: true
    });
  }

  // Authentication logging
  auth(level, message, meta = {}) {
    this.logger[level](message, {
      ...meta,
      category: 'authentication',
      type: 'auth'
    });
  }

  // Performance logging
  performance(message, meta = {}) {
    this.logger.info(message, {
      ...meta,
      category: 'performance',
      type: 'performance'
    });
  }

  // Database logging
  database(level, message, meta = {}) {
    this.logger[level](message, {
      ...meta,
      category: 'database',
      type: 'database'
    });
  }

  // API logging
  api(level, message, meta = {}) {
    this.logger[level](message, {
      ...meta,
      category: 'api',
      type: 'api'
    });
  }

  // Proxy standard winston methods
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  // Get logger instance
  getInstance() {
    return this.logger;
  }

  // Create child logger with context
  child(context) {
    return this.logger.child(context);
  }

  // Flush logs (useful for graceful shutdown)
  async flush() {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Export singleton instance
export default new EnhancedLogger();