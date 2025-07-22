# Leave Request System - Mono Repo

A full-stack leave request management system built with **NestJS** (backend) and **Next.js** (frontend), designed as a production-ready mono repo with comprehensive deployment configurations.

## 🏗️ Architecture

- **Backend**: NestJS with TypeScript, MySQL, JWT Authentication, RBAC
- **Frontend**: Next.js with TypeScript, Shadcn/UI, Tailwind CSS, Zustand
- **Database**: MySQL 8.0
- **Authentication**: JWT with Role-Based Access Control (RBAC)
- **Deployment**: Docker, Railway, Vercel, with CI/CD pipeline

## 📁 Project Structure

```
leave-request-system/
├── .github/workflows/          # CI/CD pipeline
├── leave-request-system-backend/   # NestJS backend
├── leave-request-system-frontend/  # Next.js frontend
├── docker-compose.yml          # Docker orchestration
├── Dockerfile.backend          # Backend Docker image
├── Dockerfile.frontend         # Frontend Docker image
├── nginx.conf                  # Reverse proxy config
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0
- Docker & Docker Compose (optional)
- pnpm (recommended) or npm

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/leave-request-system.git
cd leave-request-system

# Install dependencies
npm run install:all
# or with pnpm
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configurations
```

### 3. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE leave_request_db;
```

### 4. Development

```bash
# Run both backend and frontend in development
npm run dev

# Or run them separately
npm run backend:dev  # Backend on http://localhost:3001
npm run frontend:dev # Frontend on http://localhost:3000
```

## 🐳 Docker Deployment

### Local Development with Docker

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down

# Clean up (removes volumes)
npm run docker:clean
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:3306

## ☁️ Production Deployment

### Option 1: Railway + Vercel (Recommended)

1. **Backend on Railway**:
   ```bash
   # Connect your GitHub repo to Railway
   # Set environment variables in Railway dashboard
   # Deploy will happen automatically on push to main
   ```

2. **Frontend on Vercel**:
   ```bash
   # Connect your GitHub repo to Vercel
   # Set NEXT_PUBLIC_API_URL to your Railway backend URL
   # Deploy will happen automatically on push to main
   ```

### Option 2: Docker Compose on VPS

```bash
# On your server
git clone https://github.com/yourusername/leave-request-system.git
cd leave-request-system

# Set production environment variables
cp .env.example .env
# Edit .env with production values

# Deploy
docker-compose up -d

# Set up SSL with Let's Encrypt (recommended)
# Update nginx.conf with your domain
```

### Option 3: Kubernetes (Advanced)

Kubernetes manifests are available in the `k8s/` directory for enterprise deployment.

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend in development
- `npm run build` - Build both applications
- `npm run test` - Run all tests
- `npm run docker:up` - Start with Docker Compose
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

### Backend Specific
- `npm run backend:dev` - Start backend in development
- `npm run backend:build` - Build backend
- `npm run backend:test` - Run backend tests
- `npm run backend:start` - Start backend in production

### Frontend Specific
- `npm run frontend:dev` - Start frontend in development  
- `npm run frontend:build` - Build frontend
- `npm run frontend:lint` - Lint frontend code
- `npm run frontend:start` - Start frontend in production

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=leave_request_db
JWT_SECRET=your-super-secret-jwt-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🔄 CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow:

- **Testing**: Runs on Node.js 18.x and 20.x
- **Linting**: ESLint and Prettier checks
- **Building**: Builds both applications
- **Deployment**: Automatic deployment to Railway (backend) and Vercel (frontend)

### Required GitHub Secrets

- `RAILWAY_TOKEN` - Railway deployment token
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `BACKEND_URL` - Your deployed backend URL

## 📊 Features

### Backend Features
- JWT Authentication & Authorization
- Role-Based Access Control (RBAC)
- Leave Request Management
- User Management
- Email Notifications
- PDF Report Generation
- Excel Export
- RESTful API with Swagger documentation

### Frontend Features
- Modern React with Next.js 15
- Responsive design with Tailwind CSS
- Shadcn/UI components
- Form validation with React Hook Form + Zod
- State management with Zustand
- Dark/Light theme support
- TypeScript for type safety

## 🧪 Testing

```bash
# Run backend tests
npm run backend:test

# Run backend tests with coverage
cd leave-request-system-backend && npm run test:cov

# Run e2e tests
npm run backend:test:e2e
```

## 📝 API Documentation

API documentation is available at:
- Development: http://localhost:3001/api/docs
- Production: https://your-backend-url/api/docs

## 🛡️ Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention with TypeORM
- XSS protection
- HTTPS enforcement (production)

## 🔍 Monitoring & Logging

- Application logs with Winston
- Error tracking
- Performance monitoring
- Health check endpoints
- Database connection monitoring

## 📚 Documentation

- [Backend API Documentation](./leave-request-system-backend/API_DOCUMENTATION.md)
- [Entity Structure](./leave-request-system-backend/ENTITY_STRUCTURE.md)
- [RBAC Documentation](./leave-request-system-backend/RBAC_DOCUMENTATION.md)
- [Features Overview](./FEATURES.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💡 Support

For support, email your-email@example.com or create an issue in this repository.

## 🚀 Quick Deploy Buttons

[![Deploy Backend to Railway](https://railway.app/button.svg)](https://railway.app/new/template/your-template-id)

[![Deploy Frontend to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/leave-request-system)

---

Built with ❤️ using NestJS, Next.js, and modern web technologies.
