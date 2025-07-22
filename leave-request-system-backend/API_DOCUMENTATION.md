# Leave Request System - Backend API

## Overview
This is the NestJS backend for the Leave Request System with JWT authentication and user management.

## Features
- JWT Authentication
- User Management (CRUD)
- Role-based Access Control (Admin, Manager, Employee)
- MySQL Database with TypeORM
- Password Hashing with bcryptjs
- Custom Role Guards and Decorators
- Comprehensive Leave Request Management
- Automatic Employee ID Assignment
- Role-based Data Filtering

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile (requires JWT)

### Users (Requires Authentication)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Leave Requests (Requires Authentication)
- `POST /leave-request` - Submit a leave request (Employee, Manager, Admin)
- `GET /leave-request` - Get own leave requests (Employee, Manager, Admin)
- `GET /leave-request/all` - Get all leave requests (Manager, Admin only)
- `GET /leave-request/:id` - Get leave request by ID (role-based access)
- `PATCH /leave-request/:id` - Approve/Deny leave request (Manager, Admin only)
- `PATCH /leave-request/:id/approve` - Approve leave request (Manager, Admin only)
- `PATCH /leave-request/:id/reject` - Reject leave request (Manager, Admin only)
- `PATCH /leave-request/:id/cancel` - Cancel leave request (Employee for own, Manager/Admin for any)
- `DELETE /leave-request/:id` - Delete leave request (Admin only)

## Request Examples

### Register User
```json
POST /auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee"
}
```

### Login
```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Leave Request
```json
POST /leave-request
{
  "type": "annual",
  "startDate": "2025-08-01",
  "endDate": "2025-08-05",
  "reason": "Family vacation"
}
```

### Approve Leave Request
```json
PATCH /leave-request/1/approve
{
  "comments": "Approved for vacation period"
}
```

### Reject Leave Request
```json
PATCH /leave-request/1/reject
{
  "comments": "Too many people on leave during this period"
}
```

## Environment Variables
Make sure to update the `.env` file with your database credentials:

```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=leave_system
JWT_SECRET=your_super_secret_key
```

## Running the Application
```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Database Setup
1. Create a MySQL database named `leave_system`
2. Update the `.env` file with your database credentials
3. The application will automatically create the necessary tables on startup using TypeORM synchronization

## TypeORM Configuration
The application uses TypeORM with the following configuration:
- **Type**: MySQL
- **Entity Discovery**: Automatic scanning for `*.entity.ts` files
- **Synchronization**: Enabled for development (disable in production)
- **Environment Variables**: Database connection loaded from `.env` file

```typescript
TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: +process.env.DATABASE_PORT,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true, // disable in production
});
```
