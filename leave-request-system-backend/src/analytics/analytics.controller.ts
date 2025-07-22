import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AnalyticsService, AnalyticsFilters } from '../services/analytics.service';
import { LeaveType, LeaveStatus } from '../leave-request/entities/leave-request.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async getAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: number,
    @Query('employeeId') employeeId?: number,
    @Query('leaveType') leaveType?: LeaveType,
    @Query('status') status?: LeaveStatus,
  ) {
    const filters: AnalyticsFilters = {};
    
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (departmentId) filters.departmentId = departmentId;
    if (employeeId) filters.employeeId = employeeId;
    if (leaveType) filters.leaveType = leaveType;
    if (status) filters.status = status;

    return await this.analyticsService.getLeaveAnalytics(
      req.user.id,
      req.user.role,
      filters
    );
  }

  @Get('employee')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  async getEmployeeAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: AnalyticsFilters = {};
    
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // For employees, force their own data only
    const userId = req.user.role === UserRole.EMPLOYEE ? req.user.id : req.user.id;
    
    return await this.analyticsService.getLeaveAnalytics(
      userId,
      req.user.role === UserRole.EMPLOYEE ? UserRole.EMPLOYEE : req.user.role,
      filters
    );
  }
}
