#!/bin/bash

# Leave Request System - Development Setup Script
echo "🚀 Starting Leave Request System Development Environment"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

# Check if MySQL is running
if ! pgrep mysql &> /dev/null; then
    echo "⚠️  MySQL doesn't appear to be running. Please start MySQL first."
    echo "   macOS: brew services start mysql"
    echo "   Linux: sudo systemctl start mysql"
    echo ""
fi

# Function to start backend
start_backend() {
    echo "📦 Starting Backend Server..."
    cd leave-request-system-backend
    
    if [ ! -f ".env" ]; then
        echo "⚠️  .env file not found. Creating from template..."
        cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=
DATABASE_NAME=leave_system
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
EOF
        echo "✅ Created .env file. Please update it with your MySQL credentials."
        echo ""
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing backend dependencies..."
        npm install
    fi
    
    echo "🔥 Starting backend in development mode..."
    npm run start:dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server..."
    cd leave-request-system-frontend
    
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing frontend dependencies..."
        npm install
    fi
    
    echo "🔥 Starting frontend in development mode..."
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
}

# Start both servers
start_backend
sleep 3
start_frontend

echo ""
echo "🎉 Development servers are starting up!"
echo ""
echo "📍 Backend API: http://localhost:3001"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "⏳ Please wait a few seconds for servers to fully initialize..."
echo ""
echo "🛑 To stop both servers, press Ctrl+C"
echo ""

# Wait for user to stop
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Keep script running
wait
