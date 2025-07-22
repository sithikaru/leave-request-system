import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { PaidLeaveService, CreatePaidLeaveDto, UpdatePaidLeaveDto } from './paid-leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('paid-leave')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaidLeaveController {
  constructor(private readonly paidLeaveService: PaidLeaveService) {}

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() createPaidLeaveDto: CreatePaidLeaveDto, @Request() req) {
    return this.paidLeaveService.create(createPaidLeaveDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  findAll() {
    return this.paidLeaveService.findAll();
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  findMy(@Request() req) {
    return this.paidLeaveService.findByEmployee(req.user.id);
  }

  @Get('employee/:id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  findByEmployee(@Param('id') employeeId: string) {
    return this.paidLeaveService.findByEmployee(+employeeId);
  }

  @Get('stats/:id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  getStatsByEmployee(@Param('id') employeeId: string) {
    return this.paidLeaveService.getStatsByEmployee(+employeeId);
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.paidLeaveService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updatePaidLeaveDto: UpdatePaidLeaveDto, @Request() req) {
    return this.paidLeaveService.update(+id, updatePaidLeaveDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.paidLeaveService.remove(+id, req.user.id, req.user.role);
  }
}
