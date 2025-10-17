#!/usr/bin/env node

/**
 * TechVerse Development Startup Script
 * 
 * This script helps start the development environment with proper checks
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('\n🔍 Checking Prerequisites...', 'cyan');
  
  const checks = [
    {
      name: 'Server .env file',
      path: 'server/.env',
      required: true
    },
    {
      name: 'Client .env file', 
      path: 'client/.env',
      required: true
    },
    {
      name: 'Server node_modules',
      path: 'server/node_modules',
      required: true
    },
    {
      name: 'Client node_modules',
      path: 'client/node_modules',
      required: true
    }
  ];

  let allGood = true;

  checks.forEach(check => {
    if (existsSync(check.path)) {
      log(`   ✅ ${check.name}`, 'green');
    } else {
      log(`   ❌ ${check.name} - Missing!`, 'red');
      if (check.required) {
        allGood = false;
      }
    }
  });

  return allGood;
}

function showInstructions() {
  log('\n📋 Setup Instructions:', 'yellow');
  log('   1. Install dependencies:', 'yellow');
  log('      npm run install:all', 'cyan');
  log('   2. Create environment files:', 'yellow');
  log('      cp server/.env.example server/.env', 'cyan');
  log('      cp client/.env.example client/.env', 'cyan');
  log('   3. Start MongoDB:', 'yellow');
  log('      mongod (or start MongoDB service)', 'cyan');
  log('   4. Seed the database:', 'yellow');
  log('      npm run seed', 'cyan');
  log('   5. Run this script again:', 'yellow');
  log('      node start-dev.js', 'cyan');
}

function startServer() {
  return new Promise((resolve, reject) => {
    log('\n🚀 Starting Server...', 'blue');
    
    const server = spawn('node', ['server.js'], {
      cwd: 'server',
      stdio: 'pipe'
    });

    let serverReady = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[SERVER] ${output.trim()}`);
      
      if (output.includes('Server running at') && !serverReady) {
        serverReady = true;
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Warning')) {
        console.error(`[SERVER ERROR] ${output.trim()}`);
      }
    });

    server.on('error', (error) => {
      reject(new Error(`Failed to start server: ${error.message}`));
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

function startClient() {
  return new Promise((resolve, reject) => {
    log('\n🎨 Starting Client...', 'magenta');
    
    const client = spawn('npm', ['run', 'dev'], {
      cwd: 'client',
      stdio: 'pipe',
      shell: true
    });

    let clientReady = false;

    client.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[CLIENT] ${output.trim()}`);
      
      if ((output.includes('Local:') || output.includes('localhost')) && !clientReady) {
        clientReady = true;
        resolve(client);
      }
    });

    client.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`[CLIENT] ${output.trim()}`);
    });

    client.on('error', (error) => {
      reject(new Error(`Failed to start client: ${error.message}`));
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!clientReady) {
        reject(new Error('Client startup timeout'));
      }
    }, 60000);
  });
}

async function main() {
  log('🚀 TechVerse Development Environment', 'cyan');
  log('===================================\n', 'cyan');

  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites not met!', 'red');
    showInstructions();
    process.exit(1);
  }

  log('\n✅ All prerequisites met!', 'green');

  try {
    // Start server first
    const serverProcess = await startServer();
    log('✅ Server started successfully!', 'green');

    // Wait a bit for server to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start client
    const clientProcess = await startClient();
    log('✅ Client started successfully!', 'green');

    // Show success message
    log('\n🎉 Development environment is ready!', 'green');
    log('=====================================', 'green');
    log('🌐 Server: http://localhost:5000', 'cyan');
    log('🎨 Client: http://localhost:5173', 'cyan');
    log('📚 API Health: http://localhost:5000/api/health', 'cyan');
    log('\n📋 Test Accounts:', 'yellow');
    log('   Admin: admin@techverse.com / Admin123!', 'cyan');
    log('   User:  john.smith@example.com / User123!', 'cyan');
    log('\n🛠️  Press Ctrl+C to stop both services', 'yellow');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down development environment...', 'yellow');
      
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
      
      if (clientProcess) {
        clientProcess.kill('SIGTERM');
      }
      
      setTimeout(() => {
        log('👋 Goodbye!', 'cyan');
        process.exit(0);
      }, 1000);
    });

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    log(`\n💥 Startup failed: ${error.message}`, 'red');
    log('\n🔧 Troubleshooting:', 'yellow');
    log('   1. Check if MongoDB is running', 'cyan');
    log('   2. Verify .env files are configured', 'cyan');
    log('   3. Check if ports 5000 and 5173 are available', 'cyan');
    log('   4. Run: npm run seed (to seed database)', 'cyan');
    process.exit(1);
  }
}

main();