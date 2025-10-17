import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';

import connectDB from './src/config/database.js';
import logger from './src/utils/logger.js';

// Import middleware
import {
  errorHandler,
  notFound,
  apiRateLimit,
  corsOptions,
  helmetConfig,
  requestId,
  securityHeaders,
  maintenanceMode,
  suspiciousActivityDetector,
  requestSizeLimiter,
  developmentLogger,
  productionLogger,
  requestLogger,
  performanceMonitor,
  sanitizeInput
} from './src/middleware/index.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import orderRoutes from './src/routes/orders.js';
import userRoutes from './src/routes/users.js';
import adminRoutes from './src/routes/admin.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Request ID middleware (must be first)
app.use(requestId);

// Security middleware
app.use(helmet(helmetConfig));
app.use(securityHeaders);
app.use(compression());

// Maintenance mode check
app.use(maintenanceMode);

// CORS configuration
app.use(cors(corsOptions));

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

// Input sanitization
app.use(sanitizeInput);

// Security checks
app.use(suspiciousActivityDetector);

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(developmentLogger);
  app.use(requestLogger);
} else {
  app.use(productionLogger);
}

// Performance monitoring
app.use(performanceMonitor);

// Rate limiting for API routes
app.use('/api/', apiRateLimit);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TechVerse API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown', err);
      process.exit(1);
    }
    
    logger.info('Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 TechVerse API Server started`, {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
  
  if (NODE_ENV === 'development') {
    console.log(`🌐 Server running at: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
  }
});

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