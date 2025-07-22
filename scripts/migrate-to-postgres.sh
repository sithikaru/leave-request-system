#!/bin/bash

# Script to migrate from MySQL to PostgreSQL for Render deployment
# This script updates the backend to use PostgreSQL instead of MySQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Migrating Backend from MySQL to PostgreSQL for Render${NC}"
echo "================================================================"

# Change to backend directory
cd leave-request-system-backend

echo -e "${YELLOW}📦 Updating package dependencies...${NC}"

# Remove MySQL dependencies and add PostgreSQL
npm uninstall mysql2 || true
npm install pg @types/pg

echo -e "${GREEN}✅ Dependencies updated${NC}"

echo -e "${YELLOW}📝 Creating PostgreSQL configuration...${NC}"

# Create a new environment file for PostgreSQL
cat > ".env.postgres" << EOF
NODE_ENV=development
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=leave_request_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_request_db
JWT_SECRET=your-super-secret-jwt-key-here-please-change-in-production
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=./uploads
API_PORT=3001
API_PREFIX=api/v1
BCRYPT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=10
EOF

echo -e "${GREEN}✅ PostgreSQL environment configuration created${NC}"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Update your app.module.ts to use PostgreSQL configuration"
echo "2. Install PostgreSQL locally for development:"
echo "   ${YELLOW}brew install postgresql${NC} (macOS)"
echo "   ${YELLOW}sudo apt install postgresql${NC} (Ubuntu)"
echo "3. Start PostgreSQL service"
echo "4. Create database: ${YELLOW}createdb leave_request_db${NC}"
echo "5. Copy .env.postgres to .env when ready to use PostgreSQL"
echo "6. Test locally before deploying to Render"

echo -e "${BLUE}🔧 Alternative: Use PlanetScale MySQL${NC}"
echo "If you prefer to keep MySQL, consider using PlanetScale:"
echo "1. Create account at planetscale.com"
echo "2. Create database and get connection string"
echo "3. Use DATABASE_URL environment variable"

echo -e "${GREEN}✅ Migration preparation complete!${NC}"

cd ..
