#!/usr/bin/env node

/**
 * Build-time configuration validation script
 * Validates environment variables and configuration before build
 */

import { createConfig, validateConfig } from '../config/environment.js';

const validateBuildConfig = () => {
  console.log('🔍 Validating build configuration...');
  
  try {
    // Create configuration
    const config = createConfig();
    
    // Validate configuration
    const errors = validateConfig(config);
    
    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      
      if (config.ENVIRONMENT === 'production') {
        console.error('❌ Build failed due to configuration errors');
        process.exit(1);
      } else {
        console.warn('⚠️ Build continuing with warnings (development mode)');
      }
    } else {
      console.log('✅ Configuration validation passed');
    }
    
    // Log configuration summary
    console.log('📋 Configuration Summary:');
    console.log(`  Environment: ${config.ENVIRONMENT}`);
    console.log(`  API Base URL: ${config.API_BASE_URL}`);
    console.log(`  Debug Mode: ${config.DEBUG_MODE}`);
    console.log(`  App Name: ${config.APP_NAME}`);
    console.log(`  App Version: ${config.APP_VERSION}`);
    console.log(`  Build Time: ${config.BUILD_TIME}`);
    
    // Check for missing optional environment variables
    const optionalVars = [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_ANALYTICS_ID',
      'VITE_FACEBOOK_PIXEL_ID'
    ];
    
    const missingOptional = optionalVars.filter(varName => !process.env[varName]);
    if (missingOptional.length > 0) {
      console.log('ℹ️ Optional environment variables not set:');
      missingOptional.forEach(varName => console.log(`  - ${varName}`));
    }
    
    return config;
    
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
};

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateBuildConfig();
}

export default validateBuildConfig;