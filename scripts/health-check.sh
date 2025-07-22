#!/bin/bash

# Health check script for the application
# This script can be used by Docker, Kubernetes, or monitoring systems

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BACKEND_URL=${BACKEND_URL:-"http://localhost:3001"}
FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3000"}
DATABASE_HOST=${DATABASE_HOST:-"localhost"}
DATABASE_PORT=${DATABASE_PORT:-3306}

echo -e "${YELLOW}🔍 Running health checks...${NC}"

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local service_name=$2
    
    if curl -f -s --max-time 10 "$url" > /dev/null; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not responding${NC}"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    if command -v mysqladmin &> /dev/null; then
        if mysqladmin ping -h "$DATABASE_HOST" -P "$DATABASE_PORT" --silent; then
            echo -e "${GREEN}✅ Database is healthy${NC}"
            return 0
        else
            echo -e "${RED}❌ Database is not responding${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ mysqladmin not found, skipping database check${NC}"
        return 0
    fi
}

# Run health checks
HEALTH_STATUS=0

# Check backend
if ! check_http "$BACKEND_URL/api/health" "Backend API"; then
    HEALTH_STATUS=1
fi

# Check frontend
if ! check_http "$FRONTEND_URL" "Frontend"; then
    HEALTH_STATUS=1
fi

# Check database
if ! check_database; then
    HEALTH_STATUS=1
fi

# Summary
if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some services are unhealthy${NC}"
    exit 1
fi
