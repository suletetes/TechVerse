/**
 * Consolidated Utilities Index
 * Exports all utility functions from a single entry point
 */

// Re-export all utilities from helpers
export * from './helpers.js';
export { default as helpers } from './helpers.js';

// Re-export all formatters
export * from './formatters.js';
export { default as formatters } from './formatters.js';

// Re-export validators
export * from './validators.js';
export { default as validators } from './validators.js';

// Create consolidated utility object for backward compatibility
import helpers from './helpers.js';
import formatters from './formatters.js';
import validators from './validators.js';

export default {
  ...helpers,
  ...formatters,
  ...validators
};