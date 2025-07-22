# Render Deployment Guide

This guide will walk you through deploying the Leave Request System backend to Render with automated CI/CD.

## 🚀 Step-by-Step Render Deployment

### 1. Create a Render Account
- Go to [render.com](https://render.com) and sign up
- Connect your GitHub account

### 2. Set Up MySQL Database on Render

1. **Create a PostgreSQL Database** (Render doesn't support MySQL, but we'll use PostgreSQL):
   - In Render dashboard, click "New" → "PostgreSQL"
   - Name: `leave-request-db`
   - Region: Choose closest to your users
   - Plan: Free tier or paid based on needs

2. **Update Backend for PostgreSQL** (we'll need to modify the database configuration):

### 3. Deploy Backend Service

1. **Create Web Service**:
   - In Render dashboard: "New" → "Web Service"
   - Connect your GitHub repository: `sithikaru/leave-request-system`
   - Name: `leave-request-backend`
   - Region: Same as your database
   - Branch: `main`
   - Root Directory: `leave-request-system-backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

2. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_HOST=<your-postgres-host>
   DATABASE_PORT=5432
   DATABASE_USERNAME=<your-postgres-username>
   DATABASE_PASSWORD=<your-postgres-password>
   DATABASE_NAME=<your-postgres-database>
   JWT_SECRET=<your-super-secret-jwt-key>
   JWT_EXPIRES_IN=24h
   FRONTEND_URL=<your-frontend-url>
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=<your-email>
   EMAIL_PASS=<your-email-password>
   ```

### 4. Update Database Configuration for PostgreSQL

Since Render uses PostgreSQL instead of MySQL, we need to update the backend:

1. **Install PostgreSQL driver**:
   ```bash
   cd leave-request-system-backend
   npm install pg @types/pg
   npm uninstall mysql2
   ```

2. **Update TypeORM configuration** in your app module or config files.

### 5. GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```env
RENDER_SERVICE_ID=<your-render-service-id>
RENDER_API_KEY=<your-render-api-key>
RENDER_SERVICE_URL=<your-render-service-url>
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

## 🔧 Alternative: Use PlanetScale MySQL

If you prefer to stick with MySQL, use PlanetScale (MySQL-compatible):

### 1. Create PlanetScale Database
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get connection string

### 2. Update Environment Variables
```env
DATABASE_URL=<your-planetscale-connection-string>
```

## 📋 Render Service Configuration

Create a `render.yaml` in your root directory (already created):

```yaml
services:
- type: web
  name: leave-request-backend
  runtime: node
  rootDir: leave-request-system-backend
  buildCommand: npm install && npm run build
  startCommand: npm run start:prod
  healthCheckPath: /api/health
  envVars:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: 10000
```

## 🎯 Deployment Process

1. **Push to GitHub**: Any push to `main` branch will trigger deployment
2. **Automatic Build**: GitHub Actions will test and deploy
3. **Health Check**: System will verify deployment success
4. **Rollback**: If deployment fails, previous version remains active

## 📊 Monitoring Your Deployment

### Render Dashboard
- View logs in real-time
- Monitor performance metrics
- Set up alerts

### Health Checks
- Endpoint: `https://your-service.onrender.com/api/health`
- Automatic monitoring included

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to GitHub
2. **CORS**: Configure for your frontend domain
3. **Database**: Use connection pooling
4. **SSL**: Render provides automatic HTTPS

## 💰 Pricing Considerations

### Render Free Tier:
- Web services sleep after 15 minutes of inactivity
- 750 hours/month free
- Good for development/testing

### Render Paid Plans:
- Always-on services
- Better performance
- Custom domains
- Required for production

## 🚨 Common Issues & Solutions

### 1. **Service Won't Start**
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure start command is correct

### 2. **Database Connection Issues**
- Verify database credentials
- Check if database is in same region
- Test connection string locally

### 3. **CORS Errors**
- Update FRONTEND_URL environment variable
- Check CORS configuration in main.ts

## 📞 Getting Help

1. **Render Docs**: [docs.render.com](https://docs.render.com)
2. **GitHub Issues**: Check repository issues
3. **Render Support**: Available in dashboard

## ✅ Deployment Checklist

- [ ] Render account created and GitHub connected
- [ ] Database created (PostgreSQL or PlanetScale)
- [ ] Backend service configured
- [ ] Environment variables set
- [ ] GitHub secrets configured
- [ ] CI/CD pipeline tested
- [ ] Health check endpoint working
- [ ] CORS configured for frontend
- [ ] Frontend deployed and connected

Your backend will be available at: `https://your-service-name.onrender.com`
