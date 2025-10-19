#!/usr/bin/env node

/**
 * Configuration Drift Detection Script
 * Detects differences between environment configurations and alerts on inconsistencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration file paths
const CLIENT_ENV_FILES = [
  '../client/.env.development',
  '../client/.env.staging', 
  '../client/.env.production',
  '../client/.env.example'
];

const SERVER_ENV_FILES = [
  '../server/.env.development',
  '../server/.env.staging',
  '../server/.env.production', 
  '../server/.env.example'
];

/**
 * Parse environment file into key-value pairs
 */
const parseEnvFile = (filePath) => {
  try {
    const content = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      
      // Skip comments and empty lines
      if (!line || line.startsWith('#')) return;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return env;
  } catch (error) {
    console.warn(`⚠️ Could not read ${filePath}: ${error.message}`);
    return {};
  }
};

/**
 * Get all unique keys from environment files
 */
const getAllKeys = (envFiles) => {
  const allKeys = new Set();
  
  envFiles.forEach(filePath => {
    const env = parseEnvFile(filePath);
    Object.keys(env).forEach(key => allKeys.add(key));
  });
  
  return Array.from(allKeys).sort();
};

/**
 * Detect configuration drift
 */
const detectDrift = (envFiles, type) => {
  console.log(`\n🔍 Analyzing ${type} configuration drift...`);
  
  const allKeys = getAllKeys(envFiles);
  const envConfigs = {};
  
  // Parse all environment files
  envFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    envConfigs[fileName] = parseEnvFile(filePath);
  });
  
  const driftReport = {
    missingKeys: {},
    differentValues: {},
    summary: {
      totalKeys: allKeys.length,
      missingKeyCount: 0,
      differentValueCount: 0
    }
  };
  
  // Check for missing keys
  allKeys.forEach(key => {
    const filesWithKey = [];
    const filesMissingKey = [];
    
    Object.entries(envConfigs).forEach(([fileName, config]) => {
      if (config.hasOwnProperty(key)) {
        filesWithKey.push(fileName);
      } else {
        filesMissingKey.push(fileName);
      }
    });
    
    if (filesMissingKey.length > 0) {
      driftReport.missingKeys[key] = {
        presentIn: filesWithKey,
        missingFrom: filesMissingKey
      };
      driftReport.summary.missingKeyCount++;
    }
  });
  
  // Check for different values (excluding environment-specific variables)
  const environmentSpecificKeys = [
    'NODE_ENV',
    'VITE_API_URL',
    'CLIENT_URL',
    'MONGODB_URI',
    'JWT_EXPIRE',
    'JWT_REFRESH_EXPIRE',
    'BCRYPT_ROUNDS',
    'RATE_LIMIT_MAX_REQUESTS',
    'LOG_LEVEL',
    'VITE_DEBUG_MODE',
    'VITE_ENABLE_LOGGING',
    'ENABLE_REQUEST_LOGGING',
    'ENABLE_RATE_LIMITING',
    'VITE_APP_NAME'
  ];
  
  allKeys.forEach(key => {
    if (environmentSpecificKeys.includes(key)) return;
    
    const values = {};
    Object.entries(envConfigs).forEach(([fileName, config]) => {
      if (config.hasOwnProperty(key)) {
        const value = config[key];
        if (!values[value]) values[value] = [];
        values[value].push(fileName);
      }
    });
    
    if (Object.keys(values).length > 1) {
      driftReport.differentValues[key] = values;
      driftReport.summary.differentValueCount++;
    }
  });
  
  return driftReport;
};

/**
 * Print drift report
 */
const printDriftReport = (report, type) => {
  console.log(`\n📋 ${type} Configuration Drift Report:`);
  console.log(`  Total Keys: ${report.summary.totalKeys}`);
  console.log(`  Missing Keys: ${report.summary.missingKeyCount}`);
  console.log(`  Different Values: ${report.summary.differentValueCount}`);
  
  if (report.summary.missingKeyCount > 0) {
    console.log('\n❌ Missing Keys:');
    Object.entries(report.missingKeys).forEach(([key, info]) => {
      console.log(`  ${key}:`);
      console.log(`    Present in: ${info.presentIn.join(', ')}`);
      console.log(`    Missing from: ${info.missingFrom.join(', ')}`);
    });
  }
  
  if (report.summary.differentValueCount > 0) {
    console.log('\n⚠️ Different Values (non-environment-specific):');
    Object.entries(report.differentValues).forEach(([key, values]) => {
      console.log(`  ${key}:`);
      Object.entries(values).forEach(([value, files]) => {
        console.log(`    "${value}" in: ${files.join(', ')}`);
      });
    });
  }
  
  if (report.summary.missingKeyCount === 0 && report.summary.differentValueCount === 0) {
    console.log('✅ No configuration drift detected');
  }
};

/**
 * Main execution
 */
const main = () => {
  console.log('🔧 Configuration Drift Detection');
  console.log('================================');
  
  // Detect client configuration drift
  const clientDrift = detectDrift(CLIENT_ENV_FILES, 'Client');
  printDriftReport(clientDrift, 'Client');
  
  // Detect server configuration drift
  const serverDrift = detectDrift(SERVER_ENV_FILES, 'Server');
  printDriftReport(serverDrift, 'Server');
  
  // Overall summary
  const totalIssues = clientDrift.summary.missingKeyCount + 
                     clientDrift.summary.differentValueCount +
                     serverDrift.summary.missingKeyCount + 
                     serverDrift.summary.differentValueCount;
  
  console.log('\n📊 Overall Summary:');
  console.log(`  Total Configuration Issues: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log('\n💡 Recommendations:');
    console.log('  - Review missing keys and add them to appropriate environment files');
    console.log('  - Ensure non-environment-specific values are consistent across files');
    console.log('  - Update .env.example files to include all required keys');
    console.log('  - Consider using environment-specific defaults in your configuration system');
    
    // Exit with error code if running in CI
    if (process.env.CI === 'true') {
      console.log('\n❌ Configuration drift detected in CI environment');
      process.exit(1);
    }
  } else {
    console.log('✅ All configurations are consistent');
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;