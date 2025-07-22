import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LeaveRequestService, CreateLeaveRequestDto, UpdateLeaveRequestDto } from './leave-request.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('leave-request')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() createLeaveRequestDto: CreateLeaveRequestDto, @Request() req) {
    // Automatically set employeeId to current user's ID for employees
    createLeaveRequestDto.employeeId = req.user.id;
    return this.leaveRequestService.create(createLeaveRequestDto);
  }

  @Get()
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  findOwnRequests(@Request() req) {
    // Employees can only see their own requests
    return this.leaveRequestService.findByEmployee(req.user.id);
  }

  @Get('all')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  findAllRequests() {
    // Only managers and admins can see all requests
    return this.leaveRequestService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  async findOne(@Param('id') id: string, @Request() req) {
    const leaveRequest = await this.leaveRequestService.findOne(+id);
    
    // Employees can only view their own requests
    if (req.user.role === UserRole.EMPLOYEE && leaveRequest.employeeId !== req.user.id) {
      throw new Error('You can only view your own leave requests');
    }
    
    return leaveRequest;
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  approveOrDeny(
    @Param('id') id: string, 
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
    @Request() req
  ) {
    // Managers and admins can approve/deny requests
    return this.leaveRequestService.update(+id, updateLeaveRequestDto, req.user.id, req.user.role);
  }

  @Patch(':id/approve')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  approve(
    @Param('id') id: string, 
    @Body('comments') comments: string,
    @Request() req
  ) {
    return this.leaveRequestService.approve(+id, req.user.id, comments);
  }

  @Patch(':id/reject')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  reject(
    @Param('id') id: string, 
    @Body('comments') comments: string,
    @Request() req
  ) {
    return this.leaveRequestService.reject(+id, req.user.id, comments);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  cancel(@Param('id') id: string, @Request() req) {
    return this.leaveRequestService.cancel(+id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    // Only admins can delete leave requests
    return this.leaveRequestService.remove(+id);
  }

  // Reports
  @Get('reports/leave-report')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async downloadLeaveReport(
    @Query() filters: any,
    @Res() res: Response
  ) {
    const buffer = await this.leaveRequestService.generateLeaveReport(filters);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leave-report.xlsx"',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('reports/balance-report')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async downloadBalanceReport(@Res() res: Response) {
    const buffer = await this.leaveRequestService.generateLeaveBalanceReport();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leave-balances.xlsx"',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  // PDF Reports
  @Get('reports/leave-report-pdf')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async downloadLeaveReportPDF(
    @Query() filters: any,
    @Res() res: Response
  ) {
    const buffer = await this.leaveRequestService.generateLeaveReportPDF(filters);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="leave-report.pdf"',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }

  @Get('reports/balance-report-pdf')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async downloadBalanceReportPDF(@Res() res: Response) {
    const buffer = await this.leaveRequestService.generateLeaveBalanceReportPDF();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="leave-balances.pdf"',
      'Content-Length': buffer.length,
    });
    
    res.send(buffer);
  }
}
