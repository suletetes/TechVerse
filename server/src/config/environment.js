/**
 * Server Environment Configuration Manager
 * Handles dynamic environment detection and configuration validation
 */

import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Environment detection
const detectEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging' || nodeEnv === 'test') return 'staging';
  if (nodeEnv === 'development' || nodeEnv === 'dev') return 'development';
  
  // Default to development if not specified
  return 'development';
};

// Required environment variables by environment
const requiredEnvVars = {
  development: [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT'
  ],
  staging: [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT',
    'CLIENT_URL'
  ],
  production: [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'PORT',
    'CLIENT_URL',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS'
  ]
};

// Environment-specific default configurations
const environmentDefaults = {
  development: {
    PORT: 5000,
    CLIENT_URL: 'http://localhost:5173',
    CORS_ORIGINS: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 1000,
    JWT_EXPIRE: '7d',
    JWT_REFRESH_EXPIRE: '30d',
    BCRYPT_ROUNDS: 10,
    MAX_FILE_SIZE: 10485760, // 10MB
    ENABLE_CORS: true,
    ENABLE_RATE_LIMITING: false,
    ENABLE_HELMET: true,
    ENABLE_COMPRESSION: true,
    LOG_LEVEL: 'debug',
    ENABLE_REQUEST_LOGGING: true,
    ENABLE_PERFORMANCE_MONITORING: true
  },
  
  staging: {
    PORT: 5000,
    CLIENT_URL: process.env.CLIENT_URL,
    CORS_ORIGINS: [process.env.CLIENT_URL].filter(Boolean),
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 500,
    JWT_EXPIRE: '24h',
    JWT_REFRESH_EXPIRE: '7d',
    BCRYPT_ROUNDS: 12,
    MAX_FILE_SIZE: 5242880, // 5MB
    ENABLE_CORS: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_HELMET: true,
    ENABLE_COMPRESSION: true,
    LOG_LEVEL: 'info',
    ENABLE_REQUEST_LOGGING: true,
    ENABLE_PERFORMANCE_MONITORING: true
  },
  
  production: {
    PORT: process.env.PORT || 5000,
    CLIENT_URL: process.env.CLIENT_URL,
    CORS_ORIGINS: [process.env.CLIENT_URL].filter(Boolean),
    RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    JWT_EXPIRE: '1h',
    JWT_REFRESH_EXPIRE: '7d',
    BCRYPT_ROUNDS: 12,
    MAX_FILE_SIZE: 5242880, // 5MB
    ENABLE_CORS: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_HELMET: true,
    ENABLE_COMPRESSION: true,
    LOG_LEVEL: 'warn',
    ENABLE_REQUEST_LOGGING: false,
    ENABLE_PERFORMANCE_MONITORING: true
  }
};

// Configuration validation
const validateConfiguration = (config) => {
  const errors = [];
  const warnings = [];
  
  // Check required environment variables
  const required = requiredEnvVars[config.ENVIRONMENT] || [];
  required.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Validate specific configurations
  if (config.ENVIRONMENT === 'production') {
    // Production-specific validations
    if (!config.CLIENT_URL || !config.CLIENT_URL.startsWith('https://')) {
      errors.push('Production CLIENT_URL must use HTTPS');
    }
    
    if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (config.BCRYPT_ROUNDS < 12) {
      warnings.push('BCRYPT_ROUNDS should be at least 12 in production');
    }
  }
  
  // Validate URLs
  if (config.CLIENT_URL && !config.CLIENT_URL.startsWith('http')) {
    errors.push('CLIENT_URL must be a valid URL');
  }
  
  if (config.MONGODB_URI && !config.MONGODB_URI.startsWith('mongodb')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }
  
  // Validate numeric values
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }
  
  if (config.BCRYPT_ROUNDS < 4 || config.BCRYPT_ROUNDS > 20) {
    warnings.push('BCRYPT_ROUNDS should be between 4 and 20');
  }
  
  return { errors, warnings };
};

// Create configuration object
const createConfiguration = () => {
  const environment = detectEnvironment();
  const defaults = environmentDefaults[environment] || environmentDefaults.development;
  
  const config = {
    // Environment info
    ENVIRONMENT: environment,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Server configuration
    PORT: parseInt(process.env.PORT) || defaults.PORT,
    CLIENT_URL: process.env.CLIENT_URL || defaults.CLIENT_URL,
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI,
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || defaults.JWT_EXPIRE,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || defaults.JWT_REFRESH_EXPIRE,
    
    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || defaults.BCRYPT_ROUNDS,
    
    // CORS Configuration
    CORS_ORIGINS: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
      defaults.CORS_ORIGINS,
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || defaults.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || defaults.RATE_LIMIT_MAX_REQUESTS,
    
    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || defaults.MAX_FILE_SIZE,
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    
    // Email Configuration
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    
    // External Services
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    
    // Feature Flags
    ENABLE_CORS: (process.env.ENABLE_CORS || defaults.ENABLE_CORS.toString()) === 'true',
    ENABLE_RATE_LIMITING: (process.env.ENABLE_RATE_LIMITING || defaults.ENABLE_RATE_LIMITING.toString()) === 'true',
    ENABLE_HELMET: (process.env.ENABLE_HELMET || defaults.ENABLE_HELMET.toString()) === 'true',
    ENABLE_COMPRESSION: (process.env.ENABLE_COMPRESSION || defaults.ENABLE_COMPRESSION.toString()) === 'true',
    ENABLE_REQUEST_LOGGING: (process.env.ENABLE_REQUEST_LOGGING || defaults.ENABLE_REQUEST_LOGGING.toString()) === 'true',
    ENABLE_PERFORMANCE_MONITORING: (process.env.ENABLE_PERFORMANCE_MONITORING || defaults.ENABLE_PERFORMANCE_MONITORING.toString()) === 'true',
    
    // Maintenance
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || defaults.LOG_LEVEL,
    
    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    
    // Build info
    BUILD_TIME: new Date().toISOString(),
    BUILD_HASH: process.env.BUILD_HASH || 'dev-build'
  };
  
  return config;
};

// Initialize configuration
let config;
try {
  config = createConfiguration();
  
  // Validate configuration
  const validation = validateConfiguration(config);
  
  if (validation.errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (config.ENVIRONMENT === 'production') {
      process.exit(1);
    }
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Log configuration summary
  if (config.ENVIRONMENT === 'development') {
    console.log('🔧 Server Configuration:', {
      environment: config.ENVIRONMENT,
      port: config.PORT,
      clientUrl: config.CLIENT_URL,
      corsOrigins: config.CORS_ORIGINS,
      rateLimiting: config.ENABLE_RATE_LIMITING,
      buildTime: config.BUILD_TIME
    });
  }
  
} catch (error) {
  console.error('❌ Failed to initialize server configuration:', error);
  process.exit(1);
}

// Configuration utilities
export const getConfig = () => config;

export const isProduction = () => config.ENVIRONMENT === 'production';
export const isDevelopment = () => config.ENVIRONMENT === 'development';
export const isStaging = () => config.ENVIRONMENT === 'staging';

export const validateEnvVar = (name, value, required = false) => {
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value;
};

export const getEnvVar = (name, defaultValue = null, required = false) => {
  const value = process.env[name] || defaultValue;
  return validateEnvVar(name, value, required);
};

// Configuration change detection for hot reload (development only)
export const detectConfigDrift = () => {
  if (config.ENVIRONMENT !== 'development') {
    return [];
  }
  
  const currentConfig = createConfiguration();
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
  
  return driftItems;
};

export default config;