/**
 * Logging Configuration
 * Controls verbosity of different log types
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1, 
  INFO: 2,
  DEBUG: 3
};

const LOG_CONFIG = {
  // Current log level (set to INFO to reduce noise)
  CURRENT_LEVEL: process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO,
  
  // Specific feature logging controls
  FEATURES: {
    AUTH_REQUESTS: false,        // Disable auth request logging
    ROUTE_REGISTRATION: false,   // Disable route registration logs
    DATABASE_OPERATIONS: false,  // Disable DB operation logs
    MULTI_TAB_SYNC: false,      // Disable multi-tab sync logs
    TOKEN_OPERATIONS: false,     // Disable token operation logs
    SEEDING_DETAILS: false,     // Disable detailed seeding logs
    HEALTH_CHECKS: false        // Disable health check logs
  }
};

/**
 * Conditional logging helper
 */
export const conditionalLog = (feature, level, ...args) => {
  if (LOG_CONFIG.FEATURES[feature] && LOG_CONFIG.CURRENT_LEVEL >= level) {
    console.log(...args);
  }
};

/**
 * Error logging (always enabled)
 */
export const logError = (...args) => {
  console.error(...args);
};

/**
 * Warning logging
 */
export const logWarn = (...args) => {
  if (LOG_CONFIG.CURRENT_LEVEL >= LOG_LEVELS.WARN) {
    console.warn(...args);
  }
};

/**
 * Info logging (reduced)
 */
export const logInfo = (...args) => {
  if (LOG_CONFIG.CURRENT_LEVEL >= LOG_LEVELS.INFO) {
    console.log(...args);
  }
};

export default LOG_CONFIG;