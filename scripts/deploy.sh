#!/bin/bash

# Deployment script for production environments
# This script handles the deployment process with proper error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${NODE_ENV:-"production"}
BACKUP_DIR="/tmp/backups"
DEPLOYMENT_LOG="/tmp/deployment.log"

echo -e "${BLUE}🚀 Starting deployment for environment: $ENVIRONMENT${NC}"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$DEPLOYMENT_LOG"
}

# Function to create backup
create_backup() {
    log "${YELLOW}📦 Creating backup...${NC}"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "docker-compose.yml" ]; then
        # Docker deployment
        docker-compose down
        
        # Backup database if possible
        if command -v mysqldump &> /dev/null && [ -n "$DATABASE_NAME" ]; then
            mysqldump -h "$DATABASE_HOST" -u "$DATABASE_USERNAME" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" > "$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
            log "${GREEN}✅ Database backup created${NC}"
        fi
    fi
}

# Function to deploy application
deploy() {
    log "${YELLOW}🔨 Building and deploying application...${NC}"
    
    # Install dependencies
    npm run install:all
    
    # Run tests
    log "${YELLOW}🧪 Running tests...${NC}"
    npm run test
    
    # Build applications
    log "${YELLOW}🏗️ Building applications...${NC}"
    npm run build
    
    # Start services
    if [ -f "docker-compose.yml" ]; then
        log "${YELLOW}🐳 Starting Docker services...${NC}"
        docker-compose up -d
        
        # Wait for services to be healthy
        sleep 30
        
        # Run health check
        if [ -f "scripts/health-check.sh" ]; then
            ./scripts/health-check.sh
        fi
    else
        log "${YELLOW}▶️ Starting services...${NC}"
        # Start services in background
        npm run start &
    fi
    
    log "${GREEN}✅ Deployment completed successfully!${NC}"
}

# Function to rollback
rollback() {
    log "${RED}🔄 Rolling back deployment...${NC}"
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
        
        # Restore database backup if available
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -n1)
        if [ -n "$LATEST_BACKUP" ] && command -v mysql &> /dev/null; then
            mysql -h "$DATABASE_HOST" -u "$DATABASE_USERNAME" -p"$DATABASE_PASSWORD" "$DATABASE_NAME" < "$LATEST_BACKUP"
            log "${GREEN}✅ Database restored from backup${NC}"
        fi
        
        docker-compose up -d
    fi
    
    log "${GREEN}✅ Rollback completed${NC}"
}

# Main deployment process
main() {
    trap 'log "${RED}❌ Deployment failed. Check logs at $DEPLOYMENT_LOG${NC}"; exit 1' ERR
    
    # Create backup
    create_backup
    
    # Deploy
    deploy
    
    log "${GREEN}🎉 Deployment successful!${NC}"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        if [ -f "scripts/health-check.sh" ]; then
            ./scripts/health-check.sh
        else
            log "${RED}❌ Health check script not found${NC}"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health}"
        exit 1
        ;;
esac
