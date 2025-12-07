/**
 * Frontend Logger Utility
 * Only logs in development mode to keep production clean
 */

const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development';

const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  error: (...args) => {
    // Always log errors
    console.error(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
  // Silent - does nothing, use to completely disable a log
  silent: () => {}
};

export default logger;
