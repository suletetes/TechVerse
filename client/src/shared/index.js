// Shared Utilities Library - Main Export
// Consolidates all shared utilities for easy import

// Core utilities
export * from './utils/validators.js';
export * from './utils/formatters.js';
export * from './utils/helpers.js';
export * from './utils/errorHandlers.js';
export * from './utils/performance.js';

// Constants and configuration
export * from './constants/index.js';

// API utilities
export * from './api/index.js';

// Component utilities
export * from './components/index.js';

// Default exports for convenience
export { default as validators } from './utils/validators.js';
export { default as formatters } from './utils/formatters.js';
export { default as helpers } from './utils/helpers.js';
export { default as errorHandlers } from './utils/errorHandlers.js';
export { default as performance } from './utils/performance.js';
export { default as constants } from './constants/index.js';
export { default as apiUtils } from './api/index.js';