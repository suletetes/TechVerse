/**
 * Centralized Configuration Manager
 * Consolidates environment configuration and provides runtime config management
 */

import environmentConfig from './environment.js';
import { STORAGE_KEYS, API_TIMEOUTS, RETRY_CONFIG, FEATURE_FLAGS } from '../shared/constants/consolidated.js';

class ConfigManager {
  constructor() {
    this.config = this.initializeConfig();
    this.listeners = [];
    this.cache = new Map();
  }

  /**
   * Initialize configuration from multiple sources
   */
  initializeConfig() {
    const baseConfig = {
      // Environment configuration
      ...environmentConfig,
      
      // API Configuration
      api: {
        baseUrl: environmentConfig.API_BASE_URL,
        timeout: environmentConfig.REQUEST_TIMEOUT || API_TIMEOUTS.DEFAULT,
        retryAttempts: environmentConfig.RETRY_ATTEMPTS || RETRY_CONFIG.MAX_RETRIES,
        retryDelay: environmentConfig.RETRY_DELAY || RETRY_CONFIG.INITIAL_DELAY,
        enableCaching: FEATURE_FLAGS.ENABLE_CACHING,
        enableBatching: FEATURE_FLAGS.ENABLE_BATCHING,
        enablePrefetching: FEATURE_FLAGS.ENABLE_PREFETCHING
      },
      
      // Storage Configuration
      storage: {
        keys: STORAGE_KEYS,
        enableEncryption: environmentConfig.SECURITY_LEVEL === 'high',
        cacheExpiry: environmentConfig.CACHE_TTL || 300000
      },
      
      // Feature Flags
      features: {
        ...FEATURE_FLAGS,
        enableAnalytics: environmentConfig.ENABLE_ANALYTICS,
        enableChatSupport: environmentConfig.ENABLE_CHAT_SUPPORT,
        enableReviews: environmentConfig.ENABLE_REVIEWS
      },
      
      // Performance Configuration
      performance: {
        enableMonitoring: environmentConfig.ENABLE_PERFORMANCE_MONITORING,
        apiResponseThreshold: 2000,
        renderThreshold: 16,
        memoryThreshold: 100 * 1024 * 1024,
        bundleSizeThreshold: 2 * 1024 * 1024
      },
      
      // Security Configuration
      security: {
        level: environmentConfig.SECURITY_LEVEL || 'medium',
        enableCSRF: environmentConfig.SECURITY_LEVEL !== 'low',
        enableXSS: true,
        enableContentSecurityPolicy: environmentConfig.SECURITY_LEVEL === 'high',
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        tokenRefreshThreshold: 5 * 60 * 1000 // 5 minutes before expiry
      },
      
      // UI Configuration
      ui: {
        theme: this.getStoredValue('theme', 'light'),
        language: this.getStoredValue('language', 'en-GB'),
        enableAnimations: true,
        enableTransitions: true,
        compactMode: false,
        accessibilityMode: false
      },
      
      // External Services
      external: {
        stripePublishableKey: environmentConfig.STRIPE_PUBLISHABLE_KEY,
        googleAnalyticsId: environmentConfig.GOOGLE_ANALYTICS_ID,
        facebookPixelId: environmentConfig.FACEBOOK_PIXEL_ID
      },
      
      // Build Information
      build: {
        version: environmentConfig.APP_VERSION,
        buildTime: environmentConfig.BUILD_TIME,
        buildHash: environmentConfig.BUILD_HASH,
        environment: environmentConfig.ENVIRONMENT
      }
    };

    // Validate configuration
    this.validateConfig(baseConfig);
    
    return baseConfig;
  }

  /**
   * Get configuration value with dot notation support
   */
  get(path, defaultValue = undefined) {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        value = defaultValue;
        break;
      }
    }

    // Cache the result
    this.cache.set(path, value);
    
    return value;
  }

  /**
   * Set configuration value with dot notation support
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;

    // Navigate to the parent object
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the value
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Clear cache for this path and related paths
    this.clearCacheForPath(path);

    // Persist certain values to localStorage
    this.persistValue(path, value);

    // Notify listeners
    this.notifyListeners(path, value, oldValue);

    return this;
  }

  /**
   * Get multiple configuration values
   */
  getMultiple(paths) {
    const result = {};
    
    for (const path of paths) {
      result[path] = this.get(path);
    }
    
    return result;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName) {
    return this.get(`features.${featureName}`, false);
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return this.get('api');
  }

  /**
   * Get storage configuration
   */
  getStorageConfig() {
    return this.get('storage');
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.get('security');
  }

  /**
   * Get UI configuration
   */
  getUIConfig() {
    return this.get('ui');
  }

  /**
   * Update UI preferences
   */
  updateUIPreferences(preferences) {
    Object.entries(preferences).forEach(([key, value]) => {
      this.set(`ui.${key}`, value);
    });
    
    return this.getUIConfig();
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    return {
      environment: this.get('build.environment'),
      isDevelopment: this.get('build.environment') === 'development',
      isProduction: this.get('build.environment') === 'production',
      isStaging: this.get('build.environment') === 'staging',
      debugMode: this.get('DEBUG_MODE', false),
      enableLogging: this.get('ENABLE_LOGGING', false)
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = [];

    // Validate API configuration
    if (!config.api?.baseUrl) {
      errors.push('API base URL is required');
    }

    if (config.api?.baseUrl && !config.api.baseUrl.startsWith('http')) {
      errors.push('API base URL must be a valid URL');
    }

    // Validate production-specific requirements
    if (config.build?.environment === 'production') {
      if (config.api?.baseUrl?.includes('localhost')) {
        errors.push('Production environment cannot use localhost API URL');
      }

      if (!config.api?.baseUrl?.startsWith('https')) {
        errors.push('Production environment must use HTTPS');
      }

      if (!config.external?.stripePublishableKey) {
        errors.push('Stripe publishable key is required in production');
      }
    }

    // Validate security configuration
    if (config.security?.level === 'high') {
      if (!config.security.enableCSRF) {
        errors.push('CSRF protection must be enabled for high security level');
      }

      if (!config.security.enableContentSecurityPolicy) {
        errors.push('Content Security Policy must be enabled for high security level');
      }
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:', errors);
      
      if (config.build?.environment === 'production') {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
      } else {
        console.warn('⚠️ Configuration warnings (non-production mode):', errors);
      }
    }

    return errors;
  }

  /**
   * Get stored value from localStorage
   */
  getStoredValue(key, defaultValue) {
    try {
      const storageKey = STORAGE_KEYS[key.toUpperCase()] || `techverse_${key}`;
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Failed to get stored value for ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Persist value to localStorage
   */
  persistValue(path, value) {
    const persistableKeys = ['ui.theme', 'ui.language', 'ui.compactMode', 'ui.accessibilityMode'];
    
    if (persistableKeys.includes(path)) {
      try {
        const key = path.split('.').pop();
        const storageKey = STORAGE_KEYS[key.toUpperCase()] || `techverse_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to persist value for ${path}:`, error);
      }
    }
  }

  /**
   * Clear cache for a specific path and related paths
   */
  clearCacheForPath(path) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(path) || path.startsWith(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached values
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Add configuration change listener
   */
  addListener(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of configuration changes
   */
  notifyListeners(path, newValue, oldValue) {
    const event = {
      path,
      newValue,
      oldValue,
      timestamp: new Date().toISOString()
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Configuration listener error:', error);
      }
    });
  }

  /**
   * Reload configuration from environment
   */
  reload() {
    const oldConfig = { ...this.config };
    this.config = this.initializeConfig();
    this.clearCache();
    
    // Notify listeners of full reload
    this.notifyListeners('*', this.config, oldConfig);
    
    return this.config;
  }

  /**
   * Get configuration summary for debugging
   */
  getSummary() {
    return {
      environment: this.get('build.environment'),
      apiBaseUrl: this.get('api.baseUrl'),
      features: Object.keys(this.get('features', {})).filter(key => 
        this.get(`features.${key}`)
      ),
      securityLevel: this.get('security.level'),
      buildInfo: {
        version: this.get('build.version'),
        buildTime: this.get('build.buildTime'),
        buildHash: this.get('build.buildHash')
      },
      cacheSize: this.cache.size,
      listenerCount: this.listeners.length
    };
  }

  /**
   * Export configuration for debugging or backup
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration (development only)
   */
  import(configJson) {
    if (this.get('build.environment') !== 'development') {
      throw new Error('Configuration import is only allowed in development mode');
    }

    try {
      const importedConfig = JSON.parse(configJson);
      this.validateConfig(importedConfig);
      
      const oldConfig = { ...this.config };
      this.config = importedConfig;
      this.clearCache();
      
      this.notifyListeners('*', this.config, oldConfig);
      
      return this.config;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const configManager = new ConfigManager();

// Log configuration summary in development
if (configManager.get('build.environment') === 'development') {
  console.log('🔧 Configuration Manager initialized:', configManager.getSummary());
}

export default configManager;
export { ConfigManager };