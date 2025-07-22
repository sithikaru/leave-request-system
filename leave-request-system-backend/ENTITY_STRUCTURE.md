# Entity Structure Documentation

## Database Schema

### User Entity (`users` table)
- **id**: Primary key (auto-increment)
- **name**: User's full name (string, max 100 chars)
- **email**: Unique email address (string, max 255 chars)
- **password**: Hashed password (string, max 255 chars)
- **role**: User role enum (admin, manager, employee)
- **createdAt**: Timestamp of creation
- **updatedAt**: Timestamp of last update

### LeaveRequest Entity (`leave_requests` table)
- **id**: Primary key (auto-increment)
- **employeeId**: Foreign key to User (employee)
- **employee**: Many-to-One relationship with User entity
- **type**: Leave type enum (annual, sick, maternity, paternity, emergency, personal)
- **startDate**: Leave start date
- **endDate**: Leave end date
- **reason**: Text description of leave reason
- **status**: Leave status enum (pending, approved, rejected, cancelled)
- **createdAt**: Timestamp of request creation
- **updatedAt**: Timestamp of last update
- **approvedBy**: Foreign key to User (approver) - nullable
- **approver**: Many-to-One relationship with User entity - nullable
- **approvedAt**: Timestamp of approval/rejection - nullable
- **approvalComments**: Comments from approver - nullable

## Enums

### UserRole
- `ADMIN` - Full system access
- `MANAGER` - Can approve/reject leave requests
- `EMPLOYEE` - Can create and manage own leave requests

### LeaveType
- `ANNUAL` - Annual vacation leave
- `SICK` - Sick leave
- `MATERNITY` - Maternity leave
- `PATERNITY` - Paternity leave
- `EMERGENCY` - Emergency leave
- `PERSONAL` - Personal leave

### LeaveStatus
- `PENDING` - Awaiting approval
- `APPROVED` - Approved by manager/admin
- `REJECTED` - Rejected by manager/admin
- `CANCELLED` - Cancelled by employee or admin

## Relationships

1. **User ← LeaveRequest (employee)**
   - One user can have many leave requests as an employee
   - Each leave request belongs to one employee

2. **User ← LeaveRequest (approver)**
   - One user (manager/admin) can approve many leave requests
   - Each leave request can have one approver (nullable)

## Role-Based Access Control

### Employee
- Create their own leave requests
- View their own leave requests
- Edit pending leave requests (own only)
- Cancel their own leave requests

### Manager
- View all leave requests
- Approve/reject leave requests
- View user information
- Cancel any leave requests

### Admin
- Full access to all operations
- User management (create, update, delete users)
- Leave request management
- System configuration access

## Database Design Notes

- Uses role-based access control instead of separate Manager/Admin entities
- Soft relationships through foreign keys and TypeORM decorators
- Automatic timestamp management for audit trails
- Enum constraints for data integrity
- Nullable approver fields for flexible workflow
