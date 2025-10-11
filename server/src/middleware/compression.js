import compression from 'compression';
import logger from '../utils/logger.js';

// Custom compression middleware with advanced options
export const compressionMiddleware = compression({
  // Compression level (1-9, 6 is default)
  level: 6,
  
  // Compression threshold - only compress if response is larger than this
  threshold: 1024, // 1KB
  
  // Filter function to determine what to compress
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Don't compress images, videos, or already compressed files
    const contentType = res.getHeader('content-type');
    if (contentType) {
      const type = contentType.toLowerCase();
      
      // Skip already compressed content
      if (type.includes('image/') || 
          type.includes('video/') || 
          type.includes('audio/') ||
          type.includes('application/zip') ||
          type.includes('application/gzip') ||
          type.includes('application/x-rar') ||
          type.includes('application/pdf')) {
        return false;
      }
    }

    // Use compression for everything else
    return compression.filter(req, res);
  },

  // Memory level (1-9, 8 is default)
  memLevel: 8,

  // Window bits (9-15, 15 is default)
  windowBits: 15,

  // Compression strategy (use zlib constants)
  strategy: 0 // Z_DEFAULT_STRATEGY
});

// Brotli compression middleware (for modern browsers)
export const brotliMiddleware = (req, res, next) => {
  // Check if client supports Brotli
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('br')) {
    // Set Brotli as preferred encoding
    res.setHeader('Content-Encoding', 'br');
    
    // Log Brotli usage
    logger.debug('Using Brotli compression', {
      userAgent: req.headers['user-agent'],
      path: req.path
    });
  }
  
  next();
};

// Response size monitoring
export const responseSizeMonitor = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    const size = Buffer.byteLength(data, 'utf8');
    
    // Log large responses
    if (size > 100 * 1024) { // 100KB
      logger.warn('Large response detected', {
        path: req.path,
        method: req.method,
        size: `${(size / 1024).toFixed(2)}KB`,
        userAgent: req.headers['user-agent']
      });
    }
    
    // Add response size header
    res.setHeader('X-Response-Size', size);
    
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    const jsonString = JSON.stringify(data);
    const size = Buffer.byteLength(jsonString, 'utf8');
    
    // Log large JSON responses
    if (size > 100 * 1024) { // 100KB
      logger.warn('Large JSON response detected', {
        path: req.path,
        method: req.method,
        size: `${(size / 1024).toFixed(2)}KB`,
        recordCount: Array.isArray(data?.data) ? data.data.length : 'N/A'
      });
    }
    
    // Add response size header
    res.setHeader('X-Response-Size', size);
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Content optimization middleware
export const contentOptimization = (req, res, next) => {
  // Set optimal cache headers for static content
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Cache static assets for 1 year
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  } else if (req.path.match(/\.(html|htm)$/)) {
    // Cache HTML for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else {
    // API responses - cache for 5 minutes by default
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  
  // Enable GZIP for all text-based content
  res.setHeader('Vary', 'Accept-Encoding');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

// Minification middleware for JSON responses
export const jsonMinification = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Remove unnecessary whitespace from JSON
    const minified = JSON.stringify(data);
    
    // Set content type
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    return res.send(minified);
  };
  
  next();
};

// Response streaming for large datasets
export const streamingResponse = (req, res, next) => {
  // Add streaming method to response object
  res.streamJson = function(data, options = {}) {
    const { 
      chunkSize = 1000,
      delay = 0 
    } = options;
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    if (Array.isArray(data)) {
      res.write('{"data":[');
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const chunkJson = chunk.map(item => JSON.stringify(item)).join(',');
        
        if (i > 0) res.write(',');
        res.write(chunkJson);
        
        // Optional delay between chunks
        if (delay > 0 && i + chunkSize < data.length) {
          setTimeout(() => {}, delay);
        }
      }
      
      res.write(']}');
    } else {
      res.write(JSON.stringify(data));
    }
    
    res.end();
  };
  
  next();
};

// Performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) { // Slower than 1 second
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent']
      });
    }
    
    // Add performance header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
    
    // Log performance metrics
    logger.debug('Request completed', {
      method: req.method,
      path: req.path,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode
    });
  });
  
  next();
};

export default {
  compressionMiddleware,
  brotliMiddleware,
  responseSizeMonitor,
  contentOptimization,
  jsonMinification,
  streamingResponse,
  performanceMonitoring
};