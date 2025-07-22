# Leave Request System - Full Stack Application

A comprehensive leave management system built with NestJS backend and Next.js frontend, featuring role-based access control, JWT authentication, and modern UI components.

## 🚀 Features

### Backend (NestJS)
- **JWT Authentication** with secure token-based login
- **Role-based Access Control (RBAC)** - Admin, Manager, Employee roles
- **User Management** - CRUD operations for user accounts
- **Leave Request Management** - Submit, approve, reject, and cancel requests
- **MySQL Database** with TypeORM integration
- **Password Hashing** with bcryptjs
- **Comprehensive API** with validation and error handling

### Frontend (Next.js)
- **Modern UI** with ShadCN UI components and Tailwind CSS
- **Role-based Dashboard** - Different views for Admin, Manager, Employee
- **Authentication Pages** - Login and Registration with form validation
- **Leave Management** - Submit new requests and view request history
- **Admin Panel** - User management with create, edit, delete operations
- **Manager Panel** - Approve/reject leave requests with comments
- **Responsive Design** - Mobile-first approach with sidebar navigation
- **Toast Notifications** - Success/error feedback for all actions

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LeaveRequestSystem
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd leave-request-system-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Configure Environment Variables
Edit `.env` file with your database credentials:
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=leave_system
JWT_SECRET=your_super_secret_jwt_key_here
```

#### Setup MySQL Database
```sql
-- Create database
CREATE DATABASE leave_system;

-- The application will automatically create tables on startup
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd leave-request-system-frontend

# Install dependencies
npm install
```

## 🚦 Running the Application

### Start Backend Server
```bash
cd leave-request-system-backend

# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod
```
Backend will be available at `http://localhost:3001`

### Start Frontend Development Server
```bash
cd leave-request-system-frontend

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
Frontend will be available at `http://localhost:3000`

## 👥 User Roles & Access

### Employee
- Submit leave requests
- View own request history
- Cancel pending requests
- Update personal profile

### Manager
- All Employee permissions
- View all team leave requests
- Approve/reject leave requests
- Add comments to approvals/rejections

### Admin
- All Manager permissions
- Manage all users (create, edit, delete)
- System-wide leave request management
- Access to admin panel

## 🎯 Usage Guide

### First Time Setup
1. Start both backend and frontend servers
2. Visit `http://localhost:3000`
3. Click "Register" to create your first admin account
4. Login with your admin credentials
5. Navigate to "Manage Users" to create additional users

### Creating Test Data
You can register users with different roles:
- **Admin**: Full system access
- **Manager**: Can approve requests + employee features
- **Employee**: Basic leave request functionality

### API Endpoints
The backend provides a comprehensive REST API. See `/API_DOCUMENTATION.md` for complete endpoint details.

Key endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /leave-request` - Get user's leave requests
- `POST /leave-request` - Submit new request
- `PATCH /leave-request/:id/approve` - Approve request (Manager+)
- `GET /users` - Get all users (Admin)

## 🎨 UI Components

### ShadCN UI Components Used
- **Forms**: Input, Label, Select, Textarea, Button
- **Layout**: Card, Dialog, Table, Badge, Separator
- **Navigation**: Sidebar navigation with role-based menu items
- **Feedback**: Toast notifications (Sonner), Loading states
- **Data Display**: Tables with sorting, Modal dialogs, Status badges

### Pages & Features
- **`/login`** - Authentication with form validation
- **`/register`** - User registration with role selection
- **`/dashboard`** - Role-based dashboard with stats and quick actions
- **`/leave-request/new`** - Submit new leave requests
- **`/leave-request/view`** - View and manage personal requests
- **`/admin/users`** - User management (Admin only)
- **`/manager/approvals`** - Approve/reject requests (Manager+)

## 🧪 Testing

### Backend Tests
```bash
cd leave-request-system-backend

# Run unit tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npm run test roles.guard.spec.ts
```

### Frontend Testing
```bash
cd leave-request-system-frontend

# Build test (checks for compilation errors)
npm run build

# Lint code
npm run lint
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database `leave_system` exists

2. **Frontend API Calls Failing**
   - Ensure backend server is running on port 3001
   - Check CORS configuration if running on different domains

3. **Authentication Issues**
   - Clear browser localStorage and cookies
   - Verify JWT_SECRET is set in backend `.env`

4. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Ensure all required dependencies are installed

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload in development mode
2. **Database Changes**: TypeORM synchronization is enabled in development - schema changes will auto-update
3. **Environment**: Use different `.env` files for development, staging, and production
4. **Logging**: Backend includes comprehensive logging for debugging

## 📁 Project Structure

```
LeaveRequestSystem/
├── leave-request-system-backend/
│   ├── src/
│   │   ├── auth/                 # Authentication module
│   │   ├── users/                # User management
│   │   ├── leave-request/        # Leave request logic
│   │   └── app.module.ts         # Main application module
│   ├── .env                      # Environment variables
│   └── API_DOCUMENTATION.md      # API reference
└── leave-request-system-frontend/
    ├── app/
    │   ├── admin/users/          # Admin user management
    │   ├── dashboard/            # Role-based dashboard
    │   ├── leave-request/        # Leave request pages
    │   ├── login/                # Login page
    │   ├── register/             # Registration page
    │   └── manager/approvals/    # Manager approval page
    ├── components/
    │   ├── ui/                   # ShadCN UI components
    │   └── DashboardLayout.tsx   # Main layout component
    └── lib/                      # Utility functions
```

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcryptjs
- **Role-based Access Control** with route guards
- **Input Validation** on both frontend and backend
- **CORS Protection** for API endpoints
- **SQL Injection Prevention** with TypeORM parameterized queries

## 🚀 Deployment

### Backend Deployment
1. Set `synchronize: false` in TypeORM config for production
2. Use environment-specific configuration files
3. Set up database migrations for schema changes
4. Configure reverse proxy (nginx) for production

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy static files to CDN or static hosting
3. Configure environment variables for API endpoints
4. Set up proper routing for SPA behavior

## 📚 Additional Resources

- [NestJS Documentation](https://nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [ShadCN UI Components](https://ui.shadcn.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
