# TechVerse Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the TechVerse e-commerce platform, including infrastructure setup, environment configuration, security hardening, and monitoring.

## Table of Contents

1. [Infrastructure Requirements](#infrastructure-requirements)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Maintenance and Updates](#maintenance-and-updates)

## Infrastructure Requirements

### Minimum System Requirements

**Backend Server:**
- CPU: 4 cores (8 recommended)
- RAM: 8GB (16GB recommended)
- Storage: 100GB SSD (500GB recommended)
- OS: Ubuntu 20.04 LTS or CentOS 8

**Database Server:**
- CPU: 4 cores (8 recommended)
- RAM: 16GB (32GB recommended)
- Storage: 200GB SSD with backup storage
- OS: Ubuntu 20.04 LTS

**Load Balancer/Reverse Proxy:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD

### Recommended Architecture

```
Internet
    ↓
Load Balancer (Nginx/HAProxy)
    ↓
Application Servers (2+ instances)
    ↓
Database Cluster (MongoDB Replica Set)
    ↓
Redis Cache Cluster
    ↓
File Storage (AWS S3/MinIO)
```

## Environment Setup

### Production Environment Variables

Create a `.env.production` file:

```bash
# Application
NODE_ENV=production
PORT=5000
APP_NAME=TechVerse
APP_URL=https://api.techverse.com
CLIENT_URL=https://techverse.com

# Database
MONGODB_URI=mongodb://username:password@mongo1.techverse.com:27017,mongo2.techverse.com:27017,mongo3.techverse.com:27017/techverse?replicaSet=rs0&authSource=admin
MONGODB_TEST_URI=mongodb://localhost:27017/techverse_test

# Redis
REDIS_URL=redis://username:password@redis.techverse.com:6379
REDIS_CLUSTER_NODES=redis1.techverse.com:6379,redis2.techverse.com:6379,redis3.techverse.com:6379

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-min-32-chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-key-min-32-chars
SESSION_NAME=techverse_session
SESSION_DOMAIN=.techverse.com
SESSION_SECURE=true

# Email Configuration (Production SMTP)
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.techverse.com
SMTP_PASS=your-mailgun-password
FROM_EMAIL=noreply@techverse.com
FROM_NAME=TechVerse

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=techverse-uploads
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://techverse.com,https://admin.techverse.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/techverse.crt
SSL_KEY_PATH=/etc/ssl/private/techverse.key

# Health Checks
HEALTH_CHECK_INTERVAL=30000
DATABASE_TIMEOUT=5000
REDIS_TIMEOUT=3000
```

### System Dependencies

Install required system packages:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget gnupg2 software-properties-common

# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 Process Manager
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx

# Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Monitoring tools
sudo apt install -y htop iotop nethogs
```

## Database Configuration

### MongoDB Production Setup

1. **Install MongoDB**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org
```

2. **Configure Replica Set**
```javascript
// /etc/mongod.conf
replication:
  replSetName: "rs0"

net:
  port: 27017
  bindIp: 0.0.0.0

security:
  authorization: enabled
  keyFile: /etc/mongodb-keyfile

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8
```

3. **Initialize Replica Set**
```javascript
// Connect to primary node
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1.techverse.com:27017", priority: 2 },
    { _id: 1, host: "mongo2.techverse.com:27017", priority: 1 },
    { _id: 2, host: "mongo3.techverse.com:27017", priority: 1 }
  ]
});

// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "secure-admin-password",
  roles: ["root"]
});

// Create application user
use techverse
db.createUser({
  user: "techverse_app",
  pwd: "secure-app-password",
  roles: [
    { role: "readWrite", db: "techverse" }
  ]
});
```

### Redis Configuration

1. **Install Redis**
```bash
sudo apt install -y redis-server
```

2. **Configure Redis Cluster**
```bash
# /etc/redis/redis.conf
bind 0.0.0.0
port 6379
cluster-enabled yes
cluster-config-file nodes-6379.conf
cluster-node-timeout 15000
appendonly yes
requirepass your-redis-password
maxmemory 4gb
maxmemory-policy allkeys-lru
```

## Application Deployment

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'techverse-api',
      script: 'server.js',
      cwd: '/var/www/techverse/server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/techverse/api-error.log',
      out_file: '/var/log/techverse/api-out.log',
      log_file: '/var/log/techverse/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### Nginx Configuration

Create `/etc/nginx/sites-available/techverse-api`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# Upstream servers
upstream techverse_api {
    least_conn;
    server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5001 max_fails=3 fail_timeout=30s backup;
}

server {
    listen 80;
    server_name api.techverse.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.techverse.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.techverse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.techverse.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Request size limits
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://techverse_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth routes with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        
        proxy_pass http://techverse_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://techverse_api;
        access_log off;
    }

    # Static files (if served by API)
    location /uploads/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

### Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

set -e

# Configuration
APP_NAME="techverse"
APP_DIR="/var/www/techverse"
REPO_URL="https://github.com/your-org/techverse.git"
BRANCH="main"
BACKUP_DIR="/var/backups/techverse"
LOG_FILE="/var/log/techverse/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Pre-deployment checks
pre_deploy_checks() {
    log "Running pre-deployment checks..."
    
    # Check if PM2 is running
    if ! pm2 list | grep -q "techverse-api"; then
        warn "PM2 process not found, will start fresh"
    fi
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        error "Disk usage is above 80%. Please free up space before deployment."
    fi
    
    # Check memory usage
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEM_USAGE -gt 90 ]; then
        warn "Memory usage is above 90%. Consider restarting services after deployment."
    fi
    
    log "Pre-deployment checks completed"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p $BACKUP_PATH
    
    if [ -d "$APP_DIR" ]; then
        cp -r $APP_DIR $BACKUP_PATH/
        log "Backup created at $BACKUP_PATH"
    else
        log "No existing deployment to backup"
    fi
}

# Deploy application
deploy_app() {
    log "Starting deployment..."
    
    # Create app directory if it doesn't exist
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone or pull latest code
    if [ -d ".git" ]; then
        log "Pulling latest changes..."
        git fetch origin
        git reset --hard origin/$BRANCH
    else
        log "Cloning repository..."
        git clone -b $BRANCH $REPO_URL .
    fi
    
    # Install dependencies
    log "Installing server dependencies..."
    cd server
    npm ci --production
    
    log "Installing client dependencies..."
    cd ../client
    npm ci
    
    # Build client
    log "Building client application..."
    npm run build
    
    # Copy environment file
    log "Setting up environment configuration..."
    cd ../server
    if [ -f "/etc/techverse/.env.production" ]; then
        cp /etc/techverse/.env.production .env
    else
        error "Production environment file not found at /etc/techverse/.env.production"
    fi
    
    log "Application deployment completed"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    cd $APP_DIR/server
    
    # Run any database setup scripts
    if [ -f "scripts/migrate.js" ]; then
        node scripts/migrate.js
        log "Database migrations completed"
    else
        log "No migration scripts found"
    fi
}

# Start/restart services
restart_services() {
    log "Restarting services..."
    
    cd $APP_DIR/server
    
    # Stop existing PM2 processes
    pm2 stop ecosystem.config.js || true
    pm2 delete ecosystem.config.js || true
    
    # Start PM2 processes
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    # Reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
    
    log "Services restarted successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    sleep 10  # Wait for services to start
    
    # Check API health
    HEALTH_URL="https://api.techverse.com/health"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    
    if [ $HTTP_STATUS -eq 200 ]; then
        log "Health check passed - API is responding"
    else
        error "Health check failed - API returned status $HTTP_STATUS"
    fi
    
    # Check PM2 processes
    if pm2 list | grep -q "online"; then
        log "PM2 processes are running"
    else
        error "PM2 processes are not running properly"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm -rf
    
    log "Backup cleanup completed"
}

# Main deployment process
main() {
    log "Starting TechVerse deployment process..."
    
    pre_deploy_checks
    backup_current
    deploy_app
    run_migrations
    restart_services
    health_check
    cleanup_backups
    
    log "Deployment completed successfully!"
    log "Application is available at: https://api.techverse.com"
}

# Run deployment
main "$@"
```

## Security Configuration

### SSL/TLS Setup

1. **Install SSL Certificate**
```bash
# Using Let's Encrypt
sudo certbot --nginx -d api.techverse.com

# Or upload custom certificate
sudo mkdir -p /etc/ssl/certs /etc/ssl/private
sudo cp techverse.crt /etc/ssl/certs/
sudo cp techverse.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/techverse.key
```

2. **Configure SSL Security**
```bash
# Generate strong DH parameters
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Add to Nginx configuration
ssl_dhparam /etc/ssl/certs/dhparam.pem;
```

### Firewall Configuration

```bash
# UFW Firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 27017  # MongoDB (internal network only)
sudo ufw allow from 10.0.0.0/8 to any port 6379   # Redis (internal network only)
sudo ufw enable
```

### Application Security

1. **Environment Security**
```bash
# Secure environment file
sudo mkdir -p /etc/techverse
sudo chown root:root /etc/techverse
sudo chmod 700 /etc/techverse
sudo chmod 600 /etc/techverse/.env.production
```

2. **Process Security**
```bash
# Create dedicated user
sudo useradd -r -s /bin/false techverse
sudo chown -R techverse:techverse /var/www/techverse
sudo chown -R techverse:techverse /var/log/techverse
```

## Monitoring and Logging

### Log Configuration

1. **Application Logs**
```bash
# Create log directories
sudo mkdir -p /var/log/techverse
sudo chown techverse:techverse /var/log/techverse

# Logrotate configuration
sudo tee /etc/logrotate.d/techverse << EOF
/var/log/techverse/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 techverse techverse
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

2. **System Monitoring**
```bash
# Install monitoring tools
sudo apt install -y prometheus-node-exporter
sudo systemctl enable prometheus-node-exporter
sudo systemctl start prometheus-node-exporter
```

### Health Monitoring Script

Create `monitor.sh`:

```bash
#!/bin/bash

# Health monitoring script
HEALTH_URL="https://api.techverse.com/health"
LOG_FILE="/var/log/techverse/monitor.log"
ALERT_EMAIL="admin@techverse.com"

check_health() {
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 $HEALTH_URL)
    
    if [ $HTTP_STATUS -ne 200 ]; then
        echo "[$(date)] ALERT: API health check failed - Status: $HTTP_STATUS" >> $LOG_FILE
        
        # Send alert email
        echo "TechVerse API health check failed. Status: $HTTP_STATUS" | \
        mail -s "TechVerse API Alert" $ALERT_EMAIL
        
        # Restart services if needed
        pm2 restart ecosystem.config.js
    else
        echo "[$(date)] OK: API health check passed" >> $LOG_FILE
    fi
}

check_health
```

Add to crontab:
```bash
# Check every 5 minutes
*/5 * * * * /var/www/techverse/scripts/monitor.sh
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        env:
          MONGO_INITDB_ROOT_USERNAME: root
          MONGO_INITDB_ROOT_PASSWORD: password
        ports:
          - 27017:27017
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json
      
      - name: Install dependencies
        run: |
          cd server
          npm ci
      
      - name: Run tests
        run: |
          cd server
          npm test
        env:
          NODE_ENV: test
          MONGODB_TEST_URI: mongodb://root:password@localhost:27017/techverse_test?authSource=admin
          REDIS_URL: redis://localhost:6379

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /var/www/techverse
            sudo -u techverse ./deploy.sh
```

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Daily Tasks**
```bash
#!/bin/bash
# daily-maintenance.sh

# Check disk space
df -h

# Check memory usage
free -h

# Check PM2 processes
pm2 status

# Check logs for errors
tail -n 100 /var/log/techverse/api-error.log | grep -i error

# Database backup
mongodump --uri="mongodb://username:password@localhost:27017/techverse" --gzip --archive=/var/backups/mongodb/techverse_$(date +%Y%m%d).gz
```

2. **Weekly Tasks**
```bash
#!/bin/bash
# weekly-maintenance.sh

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up old logs
find /var/log/techverse -name "*.log" -mtime +30 -delete

# Clean up old backups
find /var/backups -name "*.gz" -mtime +7 -delete

# Restart services for memory cleanup
pm2 restart all
```

### Update Process

1. **Application Updates**
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm ci --production

# Run migrations if needed
node scripts/migrate.js

# Restart services
pm2 restart all
```

2. **Security Updates**
```bash
# Update Node.js security patches
npm audit fix --production

# Update system security patches
sudo apt update && sudo apt upgrade -y

# Update SSL certificates
sudo certbot renew
```

### Rollback Procedure

```bash
#!/bin/bash
# rollback.sh

BACKUP_PATH=$1

if [ -z "$BACKUP_PATH" ]; then
    echo "Usage: ./rollback.sh /var/backups/techverse/backup_TIMESTAMP"
    exit 1
fi

# Stop current services
pm2 stop all

# Restore from backup
cp -r $BACKUP_PATH/techverse/* /var/www/techverse/

# Restart services
cd /var/www/techverse/server
pm2 start ecosystem.config.js

echo "Rollback completed to $BACKUP_PATH"
```

This deployment guide provides a comprehensive approach to production deployment with security, monitoring, and maintenance considerations.