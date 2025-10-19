#!/usr/bin/env node

/**
 * Server configuration validation script
 * Validates environment variables and configuration before startup
 */

import config from '../config/environment.js';

const validateServerConfig = () => {
  console.log('🔍 Validating server configuration...');
  
  try {
    // Configuration is already validated during import
    console.log('✅ Server configuration validation passed');
    
    // Log configuration summary
    console.log('📋 Server Configuration Summary:');
    console.log(`  Environment: ${config.ENVIRONMENT}`);
    console.log(`  Port: ${config.PORT}`);
    console.log(`  Client URL: ${config.CLIENT_URL}`);
    console.log(`  CORS Origins: ${config.CORS_ORIGINS.join(', ')}`);
    console.log(`  Rate Limiting: ${config.ENABLE_RATE_LIMITING ? 'Enabled' : 'Disabled'}`);
    console.log(`  Database: ${config.MONGODB_URI ? 'Configured' : 'Not configured'}`);
    console.log(`  JWT: ${config.JWT_SECRET ? 'Configured' : 'Not configured'}`);
    console.log(`  Email: ${config.EMAIL_HOST ? 'Configured' : 'Not configured'}`);
    console.log(`  Cloudinary: ${config.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`);
    console.log(`  Stripe: ${config.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`  Redis: ${config.REDIS_URL ? 'Configured' : 'Not configured'}`);
    console.log(`  Build Time: ${config.BUILD_TIME}`);
    
    // Environment-specific checks
    if (config.ENVIRONMENT === 'production') {
      console.log('🔒 Production environment checks:');
      
      const productionChecks = [
        { name: 'HTTPS Client URL', check: config.CLIENT_URL?.startsWith('https://') },
        { name: 'Strong JWT Secret', check: config.JWT_SECRET?.length >= 32 },
        { name: 'Secure Bcrypt Rounds', check: config.BCRYPT_ROUNDS >= 12 },
        { name: 'Rate Limiting Enabled', check: config.ENABLE_RATE_LIMITING },
        { name: 'Helmet Enabled', check: config.ENABLE_HELMET },
        { name: 'Request Logging Disabled', check: !config.ENABLE_REQUEST_LOGGING }
      ];
      
      productionChecks.forEach(({ name, check }) => {
        console.log(`  ${check ? '✅' : '❌'} ${name}`);
      });
    }
    
    return config;
    
  } catch (error) {
    console.error('❌ Server configuration validation failed:', error.message);
    process.exit(1);
  }
};

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateServerConfig();
}

export default validateServerConfig;