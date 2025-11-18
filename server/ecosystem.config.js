module.exports = {
  apps: [
    {
      name: 'techverse-api',
      script: 'server.js',
      cwd: '/var/www/techverse/server',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment configuration
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000
      },
      
      // Logging configuration
      error_file: '/var/log/techverse/api-error.log',
      out_file: '/var/log/techverse/api-out.log',
      log_file: '/var/log/techverse/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Performance and reliability
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Monitoring
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git',
        'coverage',
        'tests'
      ],
      
      // Auto restart configuration
      autorestart: true,
      
      // Kill timeout
      kill_timeout: 5000,
      
      // Listen timeout
      listen_timeout: 8000,
      
      // Source map support
      source_map_support: true,
      
      // Merge logs
      merge_logs: true,
      
      // Instance variables
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'techverse',
      host: ['api1.techverse.com', 'api2.techverse.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/techverse.git',
      path: '/var/www/techverse',
      'pre-deploy-local': '',
      'post-deploy': 'cd server && npm ci --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'techverse',
      host: 'staging.techverse.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/techverse.git',
      path: '/var/www/techverse-staging',
      'post-deploy': 'cd server && npm ci && pm2 reload ecosystem.config.js --env staging',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};