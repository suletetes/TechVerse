#!/usr/bin/env node

/**
 * Build Configuration Validation Script
 * Ensures consistent build configuration between environments and validates deployment readiness
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validate package.json consistency
 */
const validatePackageJson = () => {
  console.log('🔍 Validating package.json files...');
  
  const clientPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../client/package.json'), 'utf8'));
  const serverPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../server/package.json'), 'utf8'));
  
  const issues = [];
  
  // Check for required scripts
  const requiredClientScripts = ['dev', 'build', 'preview', 'validate-config'];
  const requiredServerScripts = ['start', 'dev', 'validate-config'];
  
  requiredClientScripts.forEach(script => {
    if (!clientPackage.scripts[script]) {
      issues.push(`Client package.json missing required script: ${script}`);
    }
  });
  
  requiredServerScripts.forEach(script => {
    if (!serverPackage.scripts[script]) {
      issues.push(`Server package.json missing required script: ${script}`);
    }
  });
  
  // Check for consistent dependencies versions (if shared)
  const sharedDeps = ['vitest'];
  sharedDeps.forEach(dep => {
    const clientVersion = clientPackage.devDependencies?.[dep] || clientPackage.dependencies?.[dep];
    const serverVersion = serverPackage.devDependencies?.[dep] || serverPackage.dependencies?.[dep];
    
    if (clientVersion && serverVersion && clientVersion !== serverVersion) {
      issues.push(`Inconsistent ${dep} versions: client=${clientVersion}, server=${serverVersion}`);
    }
  });
  
  return issues;
};

/**
 * Validate Vite configuration
 */
const validateViteConfig = () => {
  console.log('🔍 Validating Vite configuration...');
  
  const viteConfigPath = path.resolve(__dirname, '../client/vite.config.js');
  const issues = [];
  
  if (!fs.existsSync(viteConfigPath)) {
    issues.push('Vite configuration file not found');
    return issues;
  }
  
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Check for required configurations
  const requiredConfigs = [
    'plugins: [react()]',
    'build:',
    'server:',
    'preview:'
  ];
  
  requiredConfigs.forEach(config => {
    if (!viteConfig.includes(config.split(':')[0])) {
      issues.push(`Vite config missing: ${config}`);
    }
  });
  
  return issues;
};

/**
 * Validate environment file structure
 */
const validateEnvFiles = () => {
  console.log('🔍 Validating environment files...');
  
  const issues = [];
  
  // Required environment files
  const requiredFiles = [
    '../client/.env.example',
    '../client/.env.development',
    '../client/.env.staging',
    '../client/.env.production',
    '../server/.env.example',
    '../server/.env.development',
    '../server/.env.staging',
    '../server/.env.production'
  ];
  
  requiredFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      issues.push(`Missing environment file: ${filePath}`);
    }
  });
  
  // Validate critical environment variables
  const criticalClientVars = ['VITE_API_URL', 'VITE_APP_NAME'];
  const criticalServerVars = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET'];
  
  // Check client .env.example
  try {
    const clientEnvExample = fs.readFileSync(path.resolve(__dirname, '../client/.env.example'), 'utf8');
    criticalClientVars.forEach(varName => {
      if (!clientEnvExample.includes(varName)) {
        issues.push(`Client .env.example missing critical variable: ${varName}`);
      }
    });
  } catch (error) {
    issues.push('Could not validate client .env.example');
  }
  
  // Check server .env.example
  try {
    const serverEnvExample = fs.readFileSync(path.resolve(__dirname, '../server/.env.example'), 'utf8');
    criticalServerVars.forEach(varName => {
      if (!serverEnvExample.includes(varName)) {
        issues.push(`Server .env.example missing critical variable: ${varName}`);
      }
    });
  } catch (error) {
    issues.push('Could not validate server .env.example');
  }
  
  return issues;
};

/**
 * Validate deployment readiness
 */
const validateDeploymentReadiness = () => {
  console.log('🔍 Validating deployment readiness...');
  
  const issues = [];
  const warnings = [];
  
  // Check for production environment variables
  const productionEnvVars = process.env;
  
  if (process.env.NODE_ENV === 'production') {
    const requiredProdVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'CLIENT_URL'
    ];
    
    requiredProdVars.forEach(varName => {
      if (!productionEnvVars[varName]) {
        issues.push(`Missing required production environment variable: ${varName}`);
      }
    });
    
    // Security checks for production
    if (productionEnvVars.JWT_SECRET && productionEnvVars.JWT_SECRET.length < 32) {
      issues.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (productionEnvVars.CLIENT_URL && !productionEnvVars.CLIENT_URL.startsWith('https://')) {
      issues.push('CLIENT_URL must use HTTPS in production');
    }
    
    if (productionEnvVars.VITE_DEBUG_MODE === 'true') {
      warnings.push('Debug mode is enabled in production');
    }
    
    if (productionEnvVars.VITE_ENABLE_LOGGING === 'true') {
      warnings.push('Logging is enabled in production');
    }
  }
  
  // Check for build artifacts
  const clientDistPath = path.resolve(__dirname, '../client/dist');
  if (process.env.NODE_ENV === 'production' && !fs.existsSync(clientDistPath)) {
    issues.push('Client build artifacts not found (run npm run build)');
  }
  
  return { issues, warnings };
};

/**
 * Validate configuration consistency
 */
const validateConfigConsistency = async () => {
  console.log('🔍 Validating configuration consistency...');
  
  const issues = [];
  
  // Import and run drift detection
  try {
    const { default: detectDrift } = await import('./detect-config-drift.js');
    
    // Capture console output to check for drift
    const originalLog = console.log;
    let logOutput = '';
    console.log = (...args) => {
      logOutput += args.join(' ') + '\n';
    };
    
    detectDrift();
    
    console.log = originalLog;
    
    // Check if drift was detected
    if (logOutput.includes('Missing Keys:') || logOutput.includes('Different Values:')) {
      issues.push('Configuration drift detected between environment files');
    }
    
  } catch (error) {
    issues.push(`Could not run configuration drift detection: ${error.message}`);
  }
  
  return issues;
};

/**
 * Main validation function
 */
const main = async () => {
  console.log('🔧 Build Configuration Validation');
  console.log('=================================');
  
  const allIssues = [];
  const allWarnings = [];
  
  // Run all validations
  allIssues.push(...validatePackageJson());
  allIssues.push(...validateViteConfig());
  allIssues.push(...validateEnvFiles());
  allIssues.push(...await validateConfigConsistency());
  
  const deploymentValidation = validateDeploymentReadiness();
  allIssues.push(...deploymentValidation.issues);
  allWarnings.push(...deploymentValidation.warnings);
  
  // Report results
  console.log('\n📋 Validation Results:');
  console.log(`  Issues: ${allIssues.length}`);
  console.log(`  Warnings: ${allWarnings.length}`);
  
  if (allIssues.length > 0) {
    console.log('\n❌ Issues Found:');
    allIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (allWarnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    allWarnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
  
  if (allIssues.length === 0 && allWarnings.length === 0) {
    console.log('✅ All build configuration checks passed');
  }
  
  // Exit with appropriate code
  if (allIssues.length > 0) {
    console.log('\n❌ Build configuration validation failed');
    process.exit(1);
  } else if (allWarnings.length > 0) {
    console.log('\n⚠️ Build configuration validation passed with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ Build configuration validation passed');
    process.exit(0);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export default main;