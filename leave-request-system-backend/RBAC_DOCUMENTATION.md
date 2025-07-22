# Role-Based Access Control (RBAC) Documentation

## Overview
The Leave Request System implements a comprehensive role-based access control system using decorators and guards to secure API endpoints based on user roles.

## Components

### 1. Roles Decorator (`@Roles`)
```typescript
@Roles(UserRole.MANAGER, UserRole.ADMIN)
```
- Used to specify which roles can access a particular endpoint
- Can accept multiple roles
- Applied at the method level in controllers

### 2. Roles Guard (`RolesGuard`)
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
```
- Implements `CanActivate` interface
- Checks if the authenticated user has the required role(s)
- Works in combination with JWT authentication

### 3. JWT Auth Guard (`JwtAuthGuard`)
```typescript
@UseGuards(JwtAuthGuard)
```
- Ensures the user is authenticated via JWT token
- Must be used before RolesGuard

## Role Definitions

### Employee (UserRole.EMPLOYEE)
**Permissions:**
- Submit leave requests
- View own leave requests
- Cancel own leave requests
- Update own pending leave requests

**Endpoints Access:**
- `POST /leave-request` ✅
- `GET /leave-request` ✅ (own requests only)
- `GET /leave-request/:id` ✅ (own requests only)
- `PATCH /leave-request/:id/cancel` ✅ (own requests only)

### Manager (UserRole.MANAGER)
**Permissions:**
- All Employee permissions
- View all leave requests
- Approve/reject leave requests
- Cancel any leave requests

**Endpoints Access:**
- All Employee endpoints ✅
- `GET /leave-request/all` ✅
- `PATCH /leave-request/:id` ✅ (approve/deny)
- `PATCH /leave-request/:id/approve` ✅
- `PATCH /leave-request/:id/reject` ✅
- `PATCH /leave-request/:id/cancel` ✅ (any request)

### Admin (UserRole.ADMIN)
**Permissions:**
- All Manager permissions
- Delete leave requests
- Full system access

**Endpoints Access:**
- All Manager endpoints ✅
- `DELETE /leave-request/:id` ✅

## Implementation Example

```typescript
@Controller('leave-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestController {
  
  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() dto: CreateLeaveRequestDto, @Request() req) {
    // All authenticated users can create requests
  }

  @Get('all')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  findAllRequests() {
    // Only managers and admins can see all requests
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    // Only admins can delete requests
  }
}
```

## Security Features

### 1. Automatic Employee ID Assignment
- When employees create leave requests, their user ID is automatically assigned
- Prevents employees from creating requests for other employees

### 2. Data Filtering
- Employees only see their own requests in GET endpoints
- Managers and admins see all requests

### 3. Role-Based Validation
- Service layer validates permissions before processing requests
- Guards prevent unauthorized access at the controller level

### 4. Error Handling
- Proper HTTP status codes for unauthorized access
- Clear error messages for permission violations

## Usage Guidelines

### Adding New Protected Endpoints
1. Apply `@UseGuards(JwtAuthGuard, RolesGuard)` to the controller or method
2. Use `@Roles(UserRole.ROLE1, UserRole.ROLE2)` to specify allowed roles
3. Implement business logic validation in the service layer

### Role Hierarchy
```
Admin (Full Access)
  ↓
Manager (Approval Powers)
  ↓
Employee (Basic Operations)
```

### Best Practices
- Always use JWT authentication before role checking
- Implement double-validation (guards + service layer)
- Use specific error messages for better UX
- Log authorization attempts for security auditing
