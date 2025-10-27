// Debug server to identify problematic imports
console.log('Starting debug server...');

try {
  console.log('1. Importing express...');
  const express = await import('express');
  console.log('✓ Express imported');

  console.log('2. Importing cors...');
  const cors = await import('cors');
  console.log('✓ CORS imported');

  console.log('3. Importing dotenv...');
  const dotenv = await import('dotenv');
  dotenv.default.config();
  console.log('✓ Dotenv imported and configured');

  console.log('4. Importing helmet...');
  const helmet = await import('helmet');
  console.log('✓ Helmet imported');

  console.log('5. Importing compression...');
  const compression = await import('compression');
  console.log('✓ Compression imported');

  console.log('6. Importing database config...');
  const connectDB = await import('./src/config/database.js');
  console.log('✓ Database config imported');

  console.log('7. Importing logger...');
  const logger = await import('./src/utils/logger.js');
  console.log('✓ Logger imported');

  console.log('8. Importing enhanced logger...');
  const enhancedLogger = await import('./src/utils/enhancedLogger.js');
  console.log('✓ Enhanced logger imported');

  console.log('9. Importing sentry config...');
  const sentryConfig = await import('./src/config/sentry.js');
  console.log('✓ Sentry config imported');

  console.log('10. Importing security monitor...');
  const securityMonitor = await import('./src/utils/securityMonitor.js');
  console.log('✓ Security monitor imported');

  console.log('11. Importing passport config...');
  const passport = await import('./src/config/passport.js');
  console.log('✓ Passport config imported');

  console.log('12. Importing session config...');
  const sessionConfig = await import('./src/config/session.js');
  console.log('✓ Session config imported');

  console.log('All core imports successful!');

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
}