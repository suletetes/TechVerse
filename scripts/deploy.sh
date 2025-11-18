#!/bin/bash

# TechVerse Production Deployment Script
# This script handles the complete deployment process for the TechVerse platform

set -e

# Configuration
APP_NAME="techverse"
APP_DIR="/var/www/techverse"
REPO_URL="https://github.com/your-org/techverse.git"
BRANCH="main"
BACKUP_DIR="/var/backups/techverse"
LOG_FILE="/var/log/techverse/deploy.log"
HEALTH_CHECK_URL="https://api.techverse.com/health"
HEALTH_CHECK_TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p /var/log/techverse
    sudo mkdir -p /etc/techverse
    
    # Set proper ownership
    sudo chown -R techverse:techverse $APP_DIR
    sudo chown -R techverse:techverse /var/log/techverse
    sudo chown -R techverse:techverse $BACKUP_DIR
}

# Pre-deployment checks
pre_deploy_checks() {
    log "Running pre-deployment checks..."
    
    # Check if running as correct user
    if [ "$USER" != "techverse" ] && [ "$USER" != "root" ]; then
        error "This script should be run as 'techverse' user or root"
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed. Please install PM2 first: npm install -g pm2"
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18.x or higher"
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_VERSION -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node -v)"
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        error "Git is not installed. Please install Git first"
    fi
    
    # Check disk space (require at least 2GB free)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=2097152  # 2GB in KB
    
    if [ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]; then
        error "Insufficient disk space. At least 2GB free space is required"
    fi
    
    # Check disk usage
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 85 ]; then
        error "Disk usage is above 85% ($DISK_USAGE%). Please free up space before deployment."
    fi
    
    # Check memory usage
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEM_USAGE -gt 90 ]; then
        warn "Memory usage is above 90% ($MEM_USAGE%). Consider restarting services after deployment."
    fi
    
    # Check if environment file exists
    if [ ! -f "/etc/techverse/.env.production" ]; then
        error "Production environment file not found at /etc/techverse/.env.production"
    fi
    
    # Check if Nginx is running
    if ! systemctl is-active --quiet nginx; then
        warn "Nginx is not running. Starting Nginx..."
        sudo systemctl start nginx
    fi
    
    log "Pre-deployment checks completed successfully"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p $BACKUP_PATH
    
    if [ -d "$APP_DIR" ]; then
        # Backup application files
        cp -r $APP_DIR $BACKUP_PATH/app
        
        # Backup PM2 configuration
        pm2 save --force
        cp ~/.pm2/dump.pm2 $BACKUP_PATH/pm2_dump.pm2 2>/dev/null || true
        
        # Backup environment file
        cp /etc/techverse/.env.production $BACKUP_PATH/env.production 2>/dev/null || true
        
        # Create backup info file
        cat > $BACKUP_PATH/backup_info.txt << EOF
Backup created: $(date)
Git commit: $(cd $APP_DIR && git rev-parse HEAD 2>/dev/null || echo "unknown")
Git branch: $(cd $APP_DIR && git branch --show-current 2>/dev/null || echo "unknown")
Node version: $(node -v)
PM2 version: $(pm2 -v)
EOF
        
        log "Backup created at $BACKUP_PATH"
        echo "BACKUP_PATH=$BACKUP_PATH" > /tmp/techverse_backup_path
    else
        log "No existing deployment to backup"
    fi
}

# Deploy application
deploy_app() {
    log "Starting application deployment..."
    
    # Ensure we're in the app directory
    cd $APP_DIR
    
    # Clone or pull latest code
    if [ -d ".git" ]; then
        log "Pulling latest changes from $BRANCH branch..."
        git fetch origin
        git reset --hard origin/$BRANCH
        git clean -fd
    else
        log "Cloning repository..."
        git clone -b $BRANCH $REPO_URL .
    fi
    
    # Get current commit info
    COMMIT_HASH=$(git rev-parse HEAD)
    COMMIT_MESSAGE=$(git log -1 --pretty=%B)
    log "Deploying commit: $COMMIT_HASH"
    log "Commit message: $COMMIT_MESSAGE"
    
    # Install server dependencies
    log "Installing server dependencies..."
    cd server
    
    # Clear npm cache to avoid issues
    npm cache clean --force
    
    # Install dependencies
    npm ci --production --no-audit
    
    # Install client dependencies and build
    log "Installing client dependencies..."
    cd ../client
    npm ci --no-audit
    
    # Build client application
    log "Building client application..."
    npm run build
    
    # Copy built files to server public directory (if needed)
    if [ -d "build" ]; then
        log "Copying built client files..."
        mkdir -p ../server/public
        cp -r build/* ../server/public/
    fi
    
    # Setup environment configuration
    log "Setting up environment configuration..."
    cd ../server
    cp /etc/techverse/.env.production .env
    
    # Set proper file permissions
    chmod 600 .env
    
    log "Application deployment completed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd $APP_DIR/server
    
    # Check if migration script exists
    if [ -f "scripts/migrate.js" ]; then
        log "Running migration script..."
        node scripts/migrate.js
        log "Database migrations completed"
    else
        log "No migration script found, skipping migrations"
    fi
    
    # Run database optimization
    if [ -f "scripts/optimize-db.js" ]; then
        log "Running database optimization..."
        node scripts/optimize-db.js
        log "Database optimization completed"
    fi
}

# Start/restart services
restart_services() {
    log "Restarting services..."
    
    cd $APP_DIR/server
    
    # Stop existing PM2 processes gracefully
    if pm2 list | grep -q "techverse-api"; then
        log "Stopping existing PM2 processes..."
        pm2 stop ecosystem.config.js || true
        sleep 5
        pm2 delete ecosystem.config.js || true
    fi
    
    # Start PM2 processes
    log "Starting PM2 processes..."
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save --force
    
    # Setup PM2 startup script
    pm2 startup systemd -u techverse --hp /home/techverse || true
    
    # Wait for processes to start
    sleep 10
    
    # Reload Nginx configuration
    log "Reloading Nginx configuration..."
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        log "Nginx reloaded successfully"
    else
        error "Nginx configuration test failed"
    fi
    
    log "Services restarted successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=6
    local attempt=1
    local wait_time=10
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        # Check if PM2 processes are running
        if ! pm2 list | grep -q "online"; then
            warn "PM2 processes are not online yet, waiting..."
        else
            # Check API health endpoint
            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time $HEALTH_CHECK_TIMEOUT $HEALTH_CHECK_URL)
            
            if [ $HTTP_STATUS -eq 200 ]; then
                log "Health check passed - API is responding (HTTP $HTTP_STATUS)"
                
                # Additional checks
                log "Running additional health checks..."
                
                # Check database connectivity
                if curl -s --max-time 10 "$HEALTH_CHECK_URL" | grep -q "database.*healthy"; then
                    log "Database connectivity check passed"
                else
                    warn "Database connectivity check failed"
                fi
                
                # Check Redis connectivity
                if curl -s --max-time 10 "$HEALTH_CHECK_URL" | grep -q "redis.*healthy"; then
                    log "Redis connectivity check passed"
                else
                    warn "Redis connectivity check failed"
                fi
                
                return 0
            else
                warn "Health check failed - API returned status $HTTP_STATUS"
            fi
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            log "Waiting $wait_time seconds before next attempt..."
            sleep $wait_time
        fi
        
        attempt=$((attempt + 1))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 5 backups
    cd $BACKUP_DIR
    if [ "$(ls -1 | wc -l)" -gt 5 ]; then
        ls -t | tail -n +6 | xargs -r rm -rf
        log "Old backups cleaned up"
    else
        log "No old backups to clean up"
    fi
}

# Send deployment notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send Slack notification if webhook is configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        if [ "$status" != "success" ]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"TechVerse Deployment $status\",\"text\":\"$message\",\"footer\":\"$(hostname)\",\"ts\":$(date +%s)}]}" \
            $SLACK_WEBHOOK_URL 2>/dev/null || true
    fi
    
    log "Notification sent: $status - $message"
}

# Rollback function
rollback() {
    local backup_path=$1
    
    if [ -z "$backup_path" ]; then
        if [ -f "/tmp/techverse_backup_path" ]; then
            backup_path=$(cat /tmp/techverse_backup_path | cut -d'=' -f2)
        else
            error "No backup path provided and no recent backup found"
        fi
    fi
    
    if [ ! -d "$backup_path" ]; then
        error "Backup directory not found: $backup_path"
    fi
    
    log "Rolling back to backup: $backup_path"
    
    # Stop current services
    pm2 stop all || true
    
    # Restore application files
    if [ -d "$backup_path/app" ]; then
        rm -rf $APP_DIR
        cp -r $backup_path/app $APP_DIR
        chown -R techverse:techverse $APP_DIR
    fi
    
    # Restore environment file
    if [ -f "$backup_path/env.production" ]; then
        cp $backup_path/env.production /etc/techverse/.env.production
    fi
    
    # Restore PM2 configuration
    if [ -f "$backup_path/pm2_dump.pm2" ]; then
        cp $backup_path/pm2_dump.pm2 ~/.pm2/dump.pm2
        pm2 resurrect
    else
        # Start services normally
        cd $APP_DIR/server
        pm2 start ecosystem.config.js --env production
    fi
    
    log "Rollback completed successfully"
    send_notification "rollback" "Application rolled back to backup: $backup_path"
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --rollback PATH     Rollback to specified backup"
    echo "  --branch BRANCH     Deploy specific branch (default: main)"
    echo "  --skip-backup       Skip backup creation"
    echo "  --skip-health       Skip health check"
    echo "  --dry-run          Show what would be done without executing"
    echo ""
    echo "Examples:"
    echo "  $0                  # Normal deployment"
    echo "  $0 --branch develop # Deploy develop branch"
    echo "  $0 --rollback /var/backups/techverse/backup_20231201_120000"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    SKIP_BACKUP=false
    SKIP_HEALTH=false
    DRY_RUN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_usage
                exit 0
                ;;
            --rollback)
                rollback "$2"
                exit 0
                ;;
            --branch)
                BRANCH="$2"
                shift 2
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-health)
                SKIP_HEALTH=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
}

# Main deployment process
main() {
    log "Starting TechVerse deployment process..."
    log "Branch: $BRANCH"
    log "Skip backup: $SKIP_BACKUP"
    log "Skip health check: $SKIP_HEALTH"
    log "Dry run: $DRY_RUN"
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN MODE - No actual changes will be made"
        return 0
    fi
    
    # Trap errors and send notification
    trap 'send_notification "failed" "Deployment failed at step: $BASH_COMMAND"' ERR
    
    setup_directories
    pre_deploy_checks
    
    if [ "$SKIP_BACKUP" = false ]; then
        backup_current
    fi
    
    deploy_app
    run_migrations
    restart_services
    
    if [ "$SKIP_HEALTH" = false ]; then
        health_check
    fi
    
    cleanup_backups
    
    log "Deployment completed successfully!"
    log "Application is available at: $HEALTH_CHECK_URL"
    
    # Show deployment summary
    echo ""
    echo "=== Deployment Summary ==="
    echo "Branch: $BRANCH"
    echo "Commit: $(cd $APP_DIR && git rev-parse HEAD)"
    echo "Deployed at: $(date)"
    echo "Health check: $HEALTH_CHECK_URL"
    echo "=========================="
    
    send_notification "success" "Deployment completed successfully. Branch: $BRANCH, Commit: $(cd $APP_DIR && git rev-parse --short HEAD)"
}

# Parse arguments and run deployment
parse_arguments "$@"
main