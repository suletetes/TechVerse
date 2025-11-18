/**
 * Test App Instance
 * Simplified Express app for testing without full server initialization
 * 
 * Note: This is a minimal app for testing. Routes are loaded dynamically
 * to avoid import issues with services that require full initialization.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Routes will be loaded dynamically in tests that need them
// This avoids import issues with services that require full initialization

// Basic error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
