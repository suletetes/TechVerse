/**
 * Centralized Error Manager for consistent error processing
 * Implements requirements 2.2, 6.1, 6.3, 6.5
 */

import errorHandler from '../services/errorHandler.js';

class ErrorManager {
  constructor(config = {}) {
    this.config = {
      enableOfflineDetection: config.enableOfflineDetection !== false,
      enableRetryQueue: config.enableRetryQueue !== false,
      maxRetryAttempts: config.maxRetryAttempts || 3,
      retryDelay: config.retryDe