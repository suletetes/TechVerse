// Enhanced Logger Utility for TechVerse API with Winston
// Provides structured logging with file rotation and environment-aware configuration

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development with emojis
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const emoji = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      http: '🌐',
      debug: '🐛'
    }[level] || '📝';
    
    let log = `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n   Meta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n   Stack: ${stack}`;
    }
    
    return log;
  })
);

// JSON format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: isDevelopment ? developmentFormat : productionFormat
  })
);

// File transports for production
if (isProduction) {
  // Error log with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d', // Keep logs for 14 days
      format: productionFormat,
      zippedArchive: true
    })
  );

  // Combined log with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: productionFormat,
      zippedArchive: true
    })
  );
}

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'warn'),
  transports,
  exitOnError: false
});

// HTTP request logging middleware
logger.http = (req, res, responseTime) => {
  const meta = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress
  };

  logger.info(`${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`, meta);
};

export default logger;
