# Deployment Guide

This document provides comprehensive deployment instructions for the Leave Request System mono repo.

## 🎯 Deployment Options

### 1. Docker Compose (Recommended for Development/Small Production)

**Prerequisites:**
- Docker & Docker Compose
- Git

**Steps:**
```bash
# Clone repository
git clone https://github.com/yourusername/leave-request-system.git
cd leave-request-system

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Deploy
docker-compose up -d

# Check logs
docker-compose logs -f

# Health check
./scripts/health-check.sh
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:3306

### 2. Railway + Vercel (Recommended for Production)

#### Backend on Railway

1. **Create Railway Project:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and create project
   railway login
   railway init
   ```

2. **Configure Environment Variables:**
   ```bash
   # Set environment variables in Railway dashboard
   DATABASE_HOST=<railway-mysql-host>
   DATABASE_PORT=3306
   DATABASE_USERNAME=<username>
   DATABASE_PASSWORD=<password>
   DATABASE_NAME=leave_request_db
   JWT_SECRET=<your-secret>
   ```

3. **Deploy:**
   ```bash
   # Deploy from root directory
   railway up --service backend
   ```

#### Frontend on Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd leave-request-system-frontend
   vercel
   
   # Set environment variable
   vercel env add NEXT_PUBLIC_API_URL <your-railway-backend-url>
   ```

### 3. Kubernetes (Enterprise)

**Prerequisites:**
- Kubernetes cluster (GKE, EKS, AKS, or self-managed)
- kubectl configured
- Docker registry access

**Steps:**

1. **Build and Push Images:**
   ```bash
   # Build images
   docker build -f Dockerfile.backend -t your-registry/leave-request-backend:latest .
   docker build -f Dockerfile.frontend -t your-registry/leave-request-frontend:latest .
   
   # Push to registry
   docker push your-registry/leave-request-backend:latest
   docker push your-registry/leave-request-frontend:latest
   ```

2. **Update Kubernetes Manifests:**
   ```bash
   # Edit k8s/secrets.yaml with your base64 encoded secrets
   # Edit k8s/configmap.yaml with your configuration
   # Update image names in k8s/backend.yaml and k8s/frontend.yaml
   # Update domain names in k8s/ingress.yaml
   ```

3. **Deploy to Kubernetes:**
   ```bash
   kubectl apply -f k8s/
   
   # Check deployment status
   kubectl get pods -n leave-request-system
   kubectl get services -n leave-request-system
   ```

### 4. AWS ECS (Alternative)

**Prerequisites:**
- AWS CLI configured
- ECS cluster
- RDS MySQL instance
- Application Load Balancer

**Steps:**
1. Create ECS task definitions
2. Create ECS services
3. Configure load balancer
4. Set up auto-scaling

### 5. Digital Ocean App Platform

**Prerequisites:**
- Digital Ocean account
- GitHub repository

**Steps:**
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy with auto-scaling

## 🔧 Environment Configuration

### Required Environment Variables

#### Backend
```env
NODE_ENV=production
DATABASE_HOST=your-db-host
DATABASE_PORT=3306
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=leave_request_db
JWT_SECRET=your-super-secret-jwt-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-url.com
```

#### Frontend
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## 🔍 Health Checks

The system includes comprehensive health checks:

```bash
# Manual health check
./scripts/health-check.sh

# Health endpoints
GET /api/health          # Backend health
GET /                    # Frontend health
```

## 📊 Monitoring

### Logs
```bash
# Docker Compose logs
docker-compose logs -f [service-name]

# Kubernetes logs
kubectl logs -f deployment/backend-deployment -n leave-request-system
kubectl logs -f deployment/frontend-deployment -n leave-request-system
```

### Metrics
- Application performance monitoring with built-in health checks
- Database connection monitoring
- Error tracking and alerting

## 🔐 Security Considerations

### SSL/TLS
- Always use HTTPS in production
- Configure SSL certificates (Let's Encrypt recommended)
- Update CORS settings for production domains

### Database Security
- Use strong passwords
- Enable SSL for database connections
- Restrict database access to application servers only
- Regular backups

### Application Security
- Keep dependencies updated
- Use environment variables for secrets
- Enable rate limiting
- Implement proper logging

## 🚀 Performance Optimization

### Database
- Enable query caching
- Add appropriate indexes
- Monitor slow queries
- Connection pooling

### Application
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Monitor memory usage

### Frontend
- Enable static generation where possible
- Optimize images
- Minimize JavaScript bundle size
- Use service workers for caching

## 📈 Scaling

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database read replicas
- CDN for frontend assets
- Container orchestration (Kubernetes/ECS)

### Vertical Scaling
- Increase server resources
- Optimize database configuration
- Monitor resource usage

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows for:
- Automated testing
- Code quality checks
- Security scanning
- Automated deployment
- Rollback capabilities

### Required Secrets
```
RAILWAY_TOKEN
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
BACKEND_URL
DOCKER_USERNAME
DOCKER_PASSWORD
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify network connectivity
   - Check firewall settings

2. **Frontend Can't Connect to Backend**
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check CORS settings
   - Verify backend is running

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript compilation

### Debug Commands
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 [service-name]

# Connect to containers
docker-compose exec backend sh
docker-compose exec frontend sh

# Database connection test
docker-compose exec mysql mysql -u root -p
```

## 📞 Support

For deployment support:
- Check GitHub Issues
- Review deployment logs
- Contact support team
- Community Discord/Slack

## 📚 Additional Resources

- [Backend API Documentation](./leave-request-system-backend/API_DOCUMENTATION.md)
- [Frontend Components Guide](./leave-request-system-frontend/README.md)
- [Database Schema](./leave-request-system-backend/ENTITY_STRUCTURE.md)
- [Security Guidelines](./SECURITY.md)
