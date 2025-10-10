import morgan from 'morgan';
import logger from '../utils/logger.js';

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

// Custom token for request ID
morgan.token('request-id', (req) => {
  return req.requestId || 'no-id';
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

// Custom format for development
const developmentFormat = ':method :url :status :response-time-ms ms - :res[content-length] bytes - User: :user-id - ID: :request-id';

// Custom format for production
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms ms',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':user-id',
  requestId: ':request-id',
  timestamp: ':date[iso]'
});

// Stream to write logs
const stream = {
  write: (message) => {
    // Remove trailing newline
    const cleanMessage = message.trim();
    
    try {
      // Try to parse as JSON for production logs
      const logData = JSON.parse(cleanMessage);
      
      // Log based on status code
      if (logData.status >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    } catch (error) {
      // Fallback for development format
      logger.info(cleanMessage);
    }
  }
};

// Skip logging for certain routes
const skip = (req, res) => {
  // Skip health checks and static assets
  const skipPaths = [
    '/api/health',
    '/favicon.ico',
    '/robots.txt'
  ];
  
  return skipPaths.some(path => req.url.startsWith(path));
};

// Development logging middleware
export const developmentLogger = morgan(developmentFormat, {
  stream,
  skip
});

// Production logging middleware
export const productionLogger = morgan(productionFormat, {
  stream,
  skip
});

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  logger.debug('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.user?._id,
    requestId: req.requestId,
    query: req.query,
    params: req.params,
    // Don't log sensitive data in body
    bodyKeys: req.body ? Object.keys(req.body) : []
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response details
    logger.debug('Outgoing Response', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?._id,
      requestId: req.requestId,
      success: data?.success,
      // Don't log full response data for security
      hasData: !!data,
      dataKeys: typeof data === 'object' ? Object.keys(data) : []
    });

    return originalJson.call(this, data);
  };

  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    code: err.code,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    requestId: req.requestId,
    query: req.query,
    params: req.params,
    bodyKeys: req.body ? Object.keys(req.body) : []
  };

  // Log based on error severity
  if (err.statusCode >= 500) {
    logger.error('Server Error', errorDetails);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error', errorDetails);
  } else {
    logger.info('Request Error', errorDetails);
  }

  next(err);
};

// Performance monitoring middleware
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Log performance metrics for slow requests
    if (responseTime > 1000) { // Log requests taking more than 1 second
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime.toFixed(2)}ms`,
        status: res.statusCode,
        memoryDelta,
        userId: req.user?._id,
        requestId: req.requestId
      });
    }

    // Log memory usage if significant increase
    if (memoryDelta.heapUsed > 10 * 1024 * 1024) { // 10MB increase
      logger.warn('High Memory Usage', {
        method: req.method,
        url: req.originalUrl,
        memoryDelta,
        currentMemory: endMemory,
        userId: req.user?._id,
        requestId: req.requestId
      });
    }
  });

  next();
};

// Audit logging for sensitive operations
export const auditLogger = (action, resource = null) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only log successful operations
      if (res.statusCode < 400) {
        logger.info('Audit Log', {
          action,
          resource,
          method: req.method,
          url: req.originalUrl,
          userId: req.user?._id,
          userEmail: req.user?.email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          success: data?.success,
          resourceId: req.params.id || data?.data?.id
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Database query logging
export const queryLogger = (req, res, next) => {
  if (process.env.LOG_DB_QUERIES === 'true') {
    // This would integrate with mongoose to log queries
    // Implementation depends on specific logging requirements
    logger.debug('Database Query Logging Enabled');
  }
  
  next();
};

export default {
  developmentLogger,
  productionLogger,
  requestLogger,
  errorLogger,
  performanceMonitor,
  auditLogger,
  queryLogger
};