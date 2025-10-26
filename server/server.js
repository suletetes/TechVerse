import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';

// Load environment variables first
dotenv.config();

// Import other modules after environment is loaded
import connectDB from './src/config/database.js';
import logger from './src/utils/logger.js';
import enhancedLogger from './src/utils/enhancedLogger.js';
import sentryConfig from './src/config/sentry.js';
import securityMonitor from './src/utils/securityMonitor.js';
import passport, { initializePassport } from './src/config/passport.js';
import sessionConfig from './src/config/session.js';

// Initialize Sentry after imports
// sentryConfig.initialize();
// Import middleware
import {
  errorHandler,
  notFound,
  corsOptions,
  helmetConfig,
  requestId,
  maintenanceMode,
  requestSizeLimiter,
  developmentLogger,
  productionLogger,
  requestLogger,
  performanceMonitor,
  sanitizeInput
} from './src/middleware/index.js';
// Import enhanced security middleware
import {
  apiRateLimit,
  securityHeaders,
  inputSanitization,
  suspiciousActivityDetector,
  trackFailedAuth,
  securityAuditLogger
} from './src/middleware/securityMiddleware.js';
// Import enhanced CORS handling
import {
  corsErrorDetector,
  enhancedCors,
  corsErrorHandler,
  preflightOptimization,
  corsHealthCheck
} from './src/middleware/corsHandler.js';
// Import routes
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import orderRoutes from './src/routes/orders.js';
import userRoutes from './src/routes/users.js';
import adminRoutes from './src/routes/admin.js';
import uploadRoutes from './src/routes/upload.js';
import notificationRoutes from './src/routes/notifications.js';
import userProfileRoutes from './src/routes/userProfile.js';
// Initialize Passport strategies
initializePassport();
// Connect to MongoDB
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);
// Sentry request handler (must be first)
app.use(sentryConfig.getRequestHandler());
app.use(sentryConfig.getTracingHandler());
// Request ID middleware
app.use(requestId);
// Security middleware
app.use(helmet(helmetConfig));
app.use(securityHeaders);
app.use(compression());
// Security monitoring middleware
app.use(securityAuditLogger);
app.use(trackFailedAuth);
// Maintenance mode check
app.use(maintenanceMode);
// Enhanced CORS configuration with error detection
app.use(corsErrorDetector);
app.use(preflightOptimization);
app.use(enhancedCors);
// Request size limiting
app.use(requestSizeLimiter('10mb'));
// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));
// Enhanced input sanitization and security checks
// app.use(inputSanitization); // Temporarily disabled - causing validation issues
app.use(suspiciousActivityDetector);
// Session and Passport will be initialized in async startup function
// Logging middleware
if (NODE_ENV === 'development') {
  app.use(developmentLogger);
  app.use(requestLogger);
} else {
  app.use(productionLogger);
}
// Performance monitoring
app.use(performanceMonitor);
// Static file serving configuration
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve uploaded images from server/uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types for images
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    // Add CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
// Serve client public images (for development/testing)
app.use('/img', express.static(path.join(__dirname, '../client/public/img'), {
  maxAge: '7d', // Cache for 7 days (these are static assets)
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types for images
    if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
    // Add CORS headers for images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
// Rate limiting for API routes
app.use('/api/', apiRateLimit);
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', userProfileRoutes);
// Health check endpoints
import healthCheck from './src/utils/healthCheck.js';
import healthMonitor from './src/utils/healthMonitor.js';
app.get('/api/health', (req, res) => {
  const health = healthCheck.getBasicHealth();
  res.status(200).json(health);
});
// CORS health check endpoint
app.get('/api/health/cors', corsHealthCheck);
// Detailed health check endpoint
app.get('/api/health/detailed', async (req, res) => {
  try {
    const health = await healthCheck.getDetailedHealth();
    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
// Database-specific health check
app.get('/api/health/database', async (req, res) => {
  try {
    const dbHealth = await healthCheck.checkDatabase();
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(dbHealth);
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
// Health monitoring endpoints
app.get('/api/health/monitor/status', (req, res) => {
  try {
    const status = healthMonitor.getStatus();
    res.status(200).json(status);
  } catch (error) {
    logger.error('Failed to get health monitor status:', error);
    res.status(500).json({
      error: 'Failed to get health monitor status',
      message: error.message
    });
  }
});
app.get('/api/health/monitor/stats', (req, res) => {
  try {
    const stats = healthMonitor.getHealthStats();
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Failed to get health monitor stats:', error);
    res.status(500).json({
      error: 'Failed to get health monitor stats',
      message: error.message
    });
  }
});
app.get('/api/health/monitor/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = healthMonitor.getHealthHistory(limit);
    res.status(200).json({
      history,
      count: history.length,
      limit
    });
  } catch (error) {
    logger.error('Failed to get health monitor history:', error);
    res.status(500).json({
      error: 'Failed to get health monitor history',
      message: error.message
    });
  }
});
// Admin endpoints for health monitoring control
app.post('/api/health/monitor/start', (req, res) => {
  try {
    healthMonitor.start();
    res.status(200).json({
      message: 'Health monitoring started',
      status: healthMonitor.getStatus()
    });
  } catch (error) {
    logger.error('Failed to start health monitoring:', error);
    res.status(500).json({
      error: 'Failed to start health monitoring',
      message: error.message
    });
  }
});
app.post('/api/health/monitor/stop', (req, res) => {
  try {
    healthMonitor.stop();
    res.status(200).json({
      message: 'Health monitoring stopped',
      status: healthMonitor.getStatus()
    });
  } catch (error) {
    logger.error('Failed to stop health monitoring:', error);
    res.status(500).json({
      error: 'Failed to stop health monitoring',
      message: error.message
    });
  }
});
// 404 handler for undefined routes
app.use(notFound);
// CORS error handling (before global error handler)
app.use(corsErrorHandler);
// Sentry error handler (before global error handler)
app.use(sentryConfig.getErrorHandler());
// Global error handling middleware (must be last)
app.use(errorHandler);
// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  enhancedLogger.info(`Received ${signal}. Starting graceful shutdown...`);
  // Flush Sentry events
  try {
    await sentryConfig.flush(5000);
    enhancedLogger.info('Sentry events flushed');
  } catch (error) {
    enhancedLogger.error('Failed to flush Sentry events', { error: error.message });
  }
  // Close server
  server.close(async (err) => {
    if (err) {
      enhancedLogger.error('Error during server shutdown', { error: err.message });
      process.exit(1);
    }
    // Close Sentry client
    try {
      await sentryConfig.close(2000);
      enhancedLogger.info('Sentry client closed');
    } catch (error) {
      enhancedLogger.error('Failed to close Sentry client', { error: error.message });
    }
    // Flush logs
    try {
      await enhancedLogger.flush();
    } catch (error) {
      console.error('Failed to flush logs:', error.message);
    }
    enhancedLogger.info('Server closed successfully');
    process.exit(0);
  });
  // Force shutdown after 30 seconds
  setTimeout(() => {
    enhancedLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};
// Async server initialization
async function initializeServer() {
  try {
    // Start security monitoring
    securityMonitor.startCleanup();
    enhancedLogger.info('Security monitoring initialized');
    // Initialize session management
    enhancedLogger.info('Initializing session management...');
    // Try to initialize session manager first
    const sessionManagerInitialized = await import('./src/utils/sessionManager.js')
      .then(module => module.default.initialize())
      .catch(error => {
        logger.warn('Session manager initialization failed, using fallback', {
          error: error.message
        });
        return false;
      });
    // Initialize session middleware
    const sessionMiddleware = await sessionConfig.initialize();
    app.use(sessionMiddleware);
    logger.info('Session management initialized successfully', {
      redisAvailable: sessionManagerInitialized,
      store: sessionManagerInitialized ? 'Redis' : 'Memory'
    });
    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session()); // Enable session support for Passport
    logger.info('Passport initialized with session support');
  } catch (error) {
    logger.error('Failed to initialize session management', {
      error: error.message,
      stack: error.stack
    });
    // In development, continue without sessions; in production, fail
    if (NODE_ENV === 'production') {
      logger.error('Session initialization failed in production, exiting...');
      process.exit(1);
    } else {
      logger.warn('Continuing without session management in development mode');
      // Initialize Passport without sessions
      app.use(passport.initialize());
    }
  }
}
// Start server
async function startServer() {
  try {
    await initializeServer();
    const server = app.listen(PORT, async () => {
      // Log server startup information
      healthCheck.logServerStartup(PORT, NODE_ENV);
      // Perform startup health checks
      try {
        const healthCheckResult = await healthCheck.performStartupHealthCheck();
        if (!healthCheckResult.success) {
          logger.error('Server started but health checks failed', null, healthCheckResult);
          console.error('⚠️ Server started with health check warnings. Check logs for details.');
        }
      } catch (error) {
        logger.error('Failed to perform startup health checks', error);
        console.error('⚠️ Could not perform startup health checks:', error.message);
      }
    });
    return server;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}
// Start the server
const server = await startServer();
// Initialize Socket.io
import socketManager from './src/socket/socketManager.js';
const io = socketManager.initialize(server);
enhancedLogger.info('Socket.io initialized successfully');
// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});
// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
export default app;
