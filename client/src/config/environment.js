/**
 * Environment Configuration Manager
 * Handles dynamic environment detection and configuration
 */

// Environment detection utilities
const detectEnvironment = () => {
  // Check if we're in development mode
  if (import.meta.env?.DEV) {
    return 'development';
  }
  
  // Check if we're in production mode
  if (import.meta.env?.PROD) {
    return 'production';
  }
  
  // Fallback detection based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    
    return 'production';
  }
  
  // Server-side fallback
  return process.env.NODE_ENV || 'development';
};

// Configuration validation
const validateConfig = (config) => {
  const errors = [];
  
  if (!config.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  if (!config.API_BASE_URL.startsWith('http')) {
    errors.push('API_BASE_URL must be a valid URL');
  }
  
  if (config.ENVIRONMENT === 'production') {
    if (config.API_BASE_URL.includes('localhost')) {
      errors.push('Production environment cannot use localhost API URL');
    }
    
    if (!config.API_BASE_URL.startsWith('https')) {
      errors.push('Production environment must use HTTPS');
    }
  }
  
  return errors;
};

// Environment-specific configurations
const environmentConfigs = {
  development: {
    API_BASE_URL: 'http://localhost:5000/api',
    DEBUG_MODE: true,
    ENABLE_LOGGING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 300000, // 5 minutes
    ENABLE_MOCK_API: false,
    CORS_ENABLED: true,
    SECURITY_LEVEL: 'low'
  },
  
  staging: {
    API_BASE_URL: 'https://api-staging.techverse.com/api',
    DEBUG_MODE: true,
    ENABLE_LOGGING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CACHE_TTL: 600000, // 10 minutes
    ENABLE_MOCK_API: false,
    CORS_ENABLED: true,
    SECURITY_LEVEL: 'medium'
  },
  
  production: {
    API_BASE_URL: 'https://api.techverse.com/api',
    DEBUG_MODE: false,
    ENABLE_LOGGING: false,
    ENABLE_PERFORMANCE_MONITORING: true,
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 2000,
    CACHE_TTL: 1800000, // 30 minutes
    ENABLE_MOCK_API: false,
    CORS_ENABLED: true,
    SECURITY_LEVEL: 'high'
  }
};

// Get environment variable with fallback
const getEnvVar = (key, fallback = null) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  
  return fallback;
};

// Create configuration object
const createConfig = () => {
  const environment = detectEnvironment();
  const baseConfig = environmentConfigs[environment] || environmentConfigs.development;
  
  // Override with environment variables
  const config = {
    ENVIRONMENT: environment,
    API_BASE_URL: getEnvVar('VITE_API_URL', baseConfig.API_BASE_URL),
    DEBUG_MODE: getEnvVar('VITE_DEBUG_MODE', baseConfig.DEBUG_MODE.toString()) === 'true',
    ENABLE_LOGGING: getEnvVar('VITE_ENABLE_LOGGING', baseConfig.ENABLE_LOGGING.toString()) === 'true',
    ENABLE_PERFORMANCE_MONITORING: getEnvVar('VITE_ENABLE_PERFORMANCE_MONITORING', baseConfig.ENABLE_PERFORMANCE_MONITORING.toString()) === 'true',
    REQUEST_TIMEOUT: parseInt(getEnvVar('VITE_REQUEST_TIMEOUT', baseConfig.REQUEST_TIMEOUT.toString())),
    RETRY_ATTEMPTS: parseInt(getEnvVar('VITE_RETRY_ATTEMPTS', baseConfig.RETRY_ATTEMPTS.toString())),
    RETRY_DELAY: parseInt(getEnvVar('VITE_RETRY_DELAY', baseConfig.RETRY_DELAY.toString())),
    CACHE_TTL: parseInt(getEnvVar('VITE_CACHE_TTL', baseConfig.CACHE_TTL.toString())),
    ENABLE_MOCK_API: getEnvVar('VITE_MOCK_API', baseConfig.ENABLE_MOCK_API.toString()) === 'true',
    CORS_ENABLED: getEnvVar('VITE_CORS_ENABLED', baseConfig.CORS_ENABLED.toString()) === 'true',
    SECURITY_LEVEL: getEnvVar('VITE_SECURITY_LEVEL', baseConfig.SECURITY_LEVEL),
    
    // App configuration
    APP_NAME: getEnvVar('VITE_APP_NAME', 'TechVerse'),
    APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    
    // Feature flags
    ENABLE_ANALYTICS: getEnvVar('VITE_ENABLE_ANALYTICS', 'true') === 'true',
    ENABLE_CHAT_SUPPORT: getEnvVar('VITE_ENABLE_CHAT_SUPPORT', 'false') === 'true',
    ENABLE_REVIEWS: getEnvVar('VITE_ENABLE_REVIEWS', 'true') === 'true',
    
    // External services
    STRIPE_PUBLISHABLE_KEY: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', ''),
    GOOGLE_ANALYTICS_ID: getEnvVar('VITE_GOOGLE_ANALYTICS_ID', ''),
    FACEBOOK_PIXEL_ID: getEnvVar('VITE_FACEBOOK_PIXEL_ID', ''),
    
    // Build information
    BUILD_TIME: new Date().toISOString(),
    BUILD_HASH: getEnvVar('VITE_BUILD_HASH', 'dev-build')
  };
  
  // Validate configuration
  const validationErrors = validateConfig(config);
  if (validationErrors.length > 0) {
    console.error('❌ Configuration validation failed:', validationErrors);
    
    if (config.ENVIRONMENT === 'production') {
      throw new Error(`Configuration validation failed: ${validationErrors.join(', ')}`);
    } else {
      console.warn('⚠️ Configuration warnings (development mode):', validationErrors);
    }
  }
  
  return config;
};

// Initialize configuration
let config;
try {
  config = createConfig();
  
  if (config.DEBUG_MODE) {
    console.log('🔧 Environment Configuration:', {
      environment: config.ENVIRONMENT,
      apiBaseUrl: config.API_BASE_URL,
      debugMode: config.DEBUG_MODE,
      buildTime: config.BUILD_TIME
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize environment configuration:', error);
  
  // Fallback configuration for critical errors
  config = {
    ENVIRONMENT: 'development',
    API_BASE_URL: 'http://localhost:5000/api',
    DEBUG_MODE: true,
    ENABLE_LOGGING: true,
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    APP_NAME: 'TechVerse',
    APP_VERSION: '1.0.0'
  };
}

// Configuration change detection
let configChangeListeners = [];

export const onConfigChange = (listener) => {
  configChangeListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    configChangeListeners = configChangeListeners.filter(l => l !== listener);
  };
};

// Hot reload configuration (development only)
export const reloadConfig = () => {
  if (config.ENVIRONMENT !== 'development') {
    console.warn('⚠️ Configuration reload is only available in development mode');
    return config;
  }
  
  try {
    const newConfig = createConfig();
    const oldConfig = { ...config };
    
    // Update configuration
    Object.assign(config, newConfig);
    
    // Notify listeners
    configChangeListeners.forEach(listener => {
      try {
        listener(newConfig, oldConfig);
      } catch (error) {
        console.error('❌ Error in config change listener:', error);
      }
    });
    
    console.log('🔄 Configuration reloaded');
    return config;
  } catch (error) {
    console.error('❌ Failed to reload configuration:', error);
    return config;
  }
};

// Configuration drift detection
export const detectConfigDrift = () => {
  const currentConfig = createConfig();
  const driftItems = [];
  
  Object.keys(config).forEach(key => {
    if (config[key] !== currentConfig[key]) {
      driftItems.push({
        key,
        current: config[key],
        expected: currentConfig[key]
      });
    }
  });
  
  if (driftItems.length > 0) {
    console.warn('⚠️ Configuration drift detected:', driftItems);
  }
  
  return driftItems;
};

// Export configuration and utilities
export default config;

export {
  detectEnvironment,
  validateConfig,
  getEnvVar,
  createConfig
};