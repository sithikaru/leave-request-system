#!/bin/bash

# Setup script for Leave Request System Mono Repo
# This script initializes the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_MIN_VERSION="18"
MYSQL_MIN_VERSION="8"

echo -e "${BLUE}🚀 Setting up Leave Request System Mono Repo${NC}"
echo "================================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
        if [ "$NODE_VERSION" -ge "$NODE_MIN_VERSION" ]; then
            echo -e "${GREEN}✅ Node.js v$(node -v) is installed${NC}"
            return 0
        else
            echo -e "${RED}❌ Node.js version $NODE_MIN_VERSION+ required, found v$(node -v)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Node.js is not installed${NC}"
        return 1
    fi
}

# Function to check MySQL
check_mysql() {
    if command_exists mysql; then
        echo -e "${GREEN}✅ MySQL is installed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ MySQL is not installed or not in PATH${NC}"
        echo "Please install MySQL 8.0+ manually"
        return 1
    fi
}

# Function to setup environment files
setup_env_files() {
    echo -e "${YELLOW}📝 Setting up environment files...${NC}"
    
    # Root .env
    if [ ! -f ".env" ]; then
        cp ".env.example" ".env"
        echo -e "${GREEN}✅ Created root .env file${NC}"
    else
        echo -e "${YELLOW}⚠️ Root .env file already exists${NC}"
    fi
    
    # Backend .env
    if [ ! -f "leave-request-system-backend/.env" ]; then
        cat > "leave-request-system-backend/.env" << EOF
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=rootpassword
DATABASE_NAME=leave_request_db
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
        echo -e "${GREEN}✅ Created backend .env file${NC}"
    else
        echo -e "${YELLOW}⚠️ Backend .env file already exists${NC}"
    fi
    
    # Frontend .env
    if [ ! -f "leave-request-system-frontend/.env.local" ]; then
        cat > "leave-request-system-frontend/.env.local" << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
        echo -e "${GREEN}✅ Created frontend .env.local file${NC}"
    else
        echo -e "${YELLOW}⚠️ Frontend .env.local file already exists${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    # Check for package manager preference
    if command_exists pnpm; then
        echo -e "${GREEN}Using pnpm${NC}"
        pnpm install
    elif command_exists yarn; then
        echo -e "${GREEN}Using yarn${NC}"
        yarn install
    else
        echo -e "${GREEN}Using npm${NC}"
        npm install
    fi
    
    # Install backend dependencies
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd leave-request-system-backend
    npm install
    cd ..
    
    # Install frontend dependencies
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd leave-request-system-frontend
    npm install
    cd ..
    
    echo -e "${GREEN}✅ All dependencies installed${NC}"
}

# Function to setup database
setup_database() {
    echo -e "${YELLOW}🗄️ Setting up database...${NC}"
    
    if command_exists mysql; then
        echo "Please enter MySQL root password to create the database:"
        mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS leave_request_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Database created successfully${NC}"
        else
            echo -e "${RED}❌ Failed to create database. Please create it manually:${NC}"
            echo "mysql -u root -p"
            echo "CREATE DATABASE IF NOT EXISTS leave_request_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        fi
    else
        echo -e "${YELLOW}⚠️ MySQL not found. Please create the database manually${NC}"
    fi
}

# Function to setup git hooks
setup_git_hooks() {
    echo -e "${YELLOW}🔗 Setting up Git hooks...${NC}"
    
    if [ -d ".git" ]; then
        # Initialize husky if package.json exists and husky is installed
        if [ -f "package.json" ] && npm list husky >/dev/null 2>&1; then
            npx husky install
            echo -e "${GREEN}✅ Git hooks initialized${NC}"
        else
            echo -e "${YELLOW}⚠️ Husky not found, skipping git hooks setup${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Not a git repository, skipping git hooks setup${NC}"
    fi
}

# Function to make scripts executable
setup_scripts() {
    echo -e "${YELLOW}🛠️ Making scripts executable...${NC}"
    
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x .husky/* 2>/dev/null || true
    
    echo -e "${GREEN}✅ Scripts are now executable${NC}"
}

# Function to run initial tests
run_tests() {
    echo -e "${YELLOW}🧪 Running initial tests...${NC}"
    
    # Test backend compilation
    cd leave-request-system-backend
    if npm run build >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend builds successfully${NC}"
    else
        echo -e "${RED}❌ Backend build failed${NC}"
    fi
    cd ..
    
    # Test frontend compilation  
    cd leave-request-system-frontend
    if npm run lint >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend linting passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Frontend linting issues found${NC}"
    fi
    cd ..
}

# Main setup function
main() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! check_node_version; then
        echo -e "${RED}Please install Node.js $NODE_MIN_VERSION+ and try again${NC}"
        exit 1
    fi
    
    # Check MySQL (optional)
    check_mysql
    
    # Setup environment files
    setup_env_files
    
    # Install dependencies
    install_dependencies
    
    # Setup database (optional)
    read -p "Do you want to setup the MySQL database now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    fi
    
    # Setup git hooks
    setup_git_hooks
    
    # Setup scripts
    setup_scripts
    
    # Run tests
    run_tests
    
    echo
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo "================================================================"
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Review and update .env files with your configuration"
    echo "2. Start the development servers: ${YELLOW}npm run dev${NC}"
    echo "3. Access frontend at: ${YELLOW}http://localhost:3000${NC}"
    echo "4. Access backend API at: ${YELLOW}http://localhost:3001${NC}"
    echo "5. API documentation at: ${YELLOW}http://localhost:3001/api/docs${NC}"
    echo
    echo -e "${BLUE}Available commands:${NC}"
    echo "• ${YELLOW}npm run dev${NC} - Start both backend and frontend"
    echo "• ${YELLOW}npm run backend:dev${NC} - Start only backend"
    echo "• ${YELLOW}npm run frontend:dev${NC} - Start only frontend"
    echo "• ${YELLOW}npm run build${NC} - Build both applications"
    echo "• ${YELLOW}npm run test${NC} - Run tests"
    echo "• ${YELLOW}npm run docker:up${NC} - Start with Docker"
    echo "• ${YELLOW}./scripts/health-check.sh${NC} - Check application health"
    echo
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Run the main function
main "$@"
