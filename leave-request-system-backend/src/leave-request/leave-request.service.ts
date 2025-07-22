import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequest, LeaveType, LeaveStatus, LeaveDuration } from './entities/leave-request.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EmailService } from '../services/email.service';
import { ReportsService } from '../services/reports.service';

export interface CreateLeaveRequestDto {
  employeeId: number;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  duration: LeaveDuration;
  reason: string;
}

export interface UpdateLeaveRequestDto {
  type?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  duration?: LeaveDuration;
  reason?: string;
  status?: LeaveStatus;
  approvalComments?: string;
}

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly reportsService: ReportsService,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const employee = await this.userRepository.findOne({
      where: { id: createLeaveRequestDto.employeeId }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Calculate total days (without public holidays for now)
    const totalDays = this.reportsService.calculateLeaveDays(
      createLeaveRequestDto.startDate,
      createLeaveRequestDto.endDate,
      createLeaveRequestDto.duration,
      [] // Empty array for holidays
    );

    // Check leave balance
    await this.checkLeaveBalance(employee, createLeaveRequestDto.type, totalDays);

    // Create leave request
    const leaveRequest = this.leaveRequestRepository.create({
      ...createLeaveRequestDto,
      totalDays
    });

    const savedRequest = await this.leaveRequestRepository.save(leaveRequest);

    // Load the complete request with relations
    const completeRequest = await this.findOne(savedRequest.id);

    // Send email notification to managers
    const managers = await this.userRepository.find({
      where: { role: UserRole.MANAGER }
    });

    for (const manager of managers) {
      await this.emailService.sendLeaveRequestNotification(completeRequest, manager);
    }

    return completeRequest;
  }

  private async checkLeaveBalance(employee: User, leaveType: LeaveType, requestedDays: number): Promise<void> {
    let availableBalance = 0;

    switch (leaveType) {
      case LeaveType.ANNUAL:
        availableBalance = employee.annualLeaveBalance;
        break;
      case LeaveType.SICK:
        availableBalance = employee.sickLeaveBalance;
        break;
      case LeaveType.PERSONAL:
        availableBalance = employee.personalLeaveBalance;
        break;
      case LeaveType.EMERGENCY:
        availableBalance = employee.emergencyLeaveBalance;
        break;
      default:
        // Maternity/Paternity leave doesn't check balance
        return;
    }

    if (requestedDays > availableBalance) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${availableBalance} days, Requested: ${requestedDays} days`
      );
    }
  }

  private async updateLeaveBalance(employee: User, leaveType: LeaveType, days: number): Promise<void> {
    switch (leaveType) {
      case LeaveType.ANNUAL:
        employee.annualLeaveBalance -= days;
        break;
      case LeaveType.SICK:
        employee.sickLeaveBalance -= days;
        break;
      case LeaveType.PERSONAL:
        employee.personalLeaveBalance -= days;
        break;
      case LeaveType.EMERGENCY:
        employee.emergencyLeaveBalance -= days;
        break;
    }

    await this.userRepository.save(employee);
  }

  async findAll(): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.find({
      relations: ['employee', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmployee(employeeId: number): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.find({
      where: { employeeId },
      relations: ['employee', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approver'],
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return leaveRequest;
  }

  async update(
    id: number, 
    updateLeaveRequestDto: UpdateLeaveRequestDto,
    userId: number,
    userRole: UserRole
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    // Only allow employees to edit their own pending requests
    if (userRole === UserRole.EMPLOYEE && leaveRequest.employeeId !== userId) {
      throw new ForbiddenException('You can only edit your own leave requests');
    }

    // Only allow editing of pending requests (unless admin/manager changing status)
    if (leaveRequest.status !== LeaveStatus.PENDING && !updateLeaveRequestDto.status) {
      throw new ForbiddenException('Cannot edit leave request that is not pending');
    }

    Object.assign(leaveRequest, updateLeaveRequestDto);

    if (updateLeaveRequestDto.status && updateLeaveRequestDto.status !== LeaveStatus.PENDING) {
      leaveRequest.approvedBy = userId;
      leaveRequest.approvedAt = new Date();
    }

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async approve(id: number, approverId: number, comments?: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);
    
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new ForbiddenException('Leave request is not pending approval');
    }

    leaveRequest.status = LeaveStatus.APPROVED;
    leaveRequest.approvedBy = approverId;
    leaveRequest.approvedAt = new Date();
    if (comments) {
      leaveRequest.approvalComments = comments;
    }

    const savedRequest = await this.leaveRequestRepository.save(leaveRequest);

    // Update employee's leave balance
    await this.updateLeaveBalance(leaveRequest.employee, leaveRequest.type, leaveRequest.totalDays);

    // Send email notification
    await this.emailService.sendLeaveStatusUpdate(savedRequest);

    return savedRequest;
  }

  async reject(id: number, approverId: number, comments?: string): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);
    
    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new ForbiddenException('Leave request is not pending approval');
    }

    leaveRequest.status = LeaveStatus.REJECTED;
    leaveRequest.approvedBy = approverId;
    leaveRequest.approvedAt = new Date();
    if (comments) {
      leaveRequest.approvalComments = comments;
    }

    const savedRequest = await this.leaveRequestRepository.save(leaveRequest);

    // Send email notification
    await this.emailService.sendLeaveStatusUpdate(savedRequest);

    return savedRequest;
  }

  async cancel(id: number, userId: number, userRole: UserRole): Promise<LeaveRequest> {
    const leaveRequest = await this.findOne(id);

    // Only allow employees to cancel their own requests, or admin/manager to cancel any
    if (userRole === UserRole.EMPLOYEE && leaveRequest.employeeId !== userId) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (leaveRequest.status === LeaveStatus.CANCELLED) {
      throw new ForbiddenException('Leave request is already cancelled');
    }

    leaveRequest.status = LeaveStatus.CANCELLED;
    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async remove(id: number): Promise<void> {
    const leaveRequest = await this.findOne(id);
    await this.leaveRequestRepository.remove(leaveRequest);
  }

  // Reports
  async generateLeaveReport(filters: any): Promise<Buffer> {
    let query = this.leaveRequestRepository.createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('leave.approver', 'approver');

    if (filters.startDate && filters.endDate) {
      query = query.andWhere('leave.startDate >= :startDate', { startDate: filters.startDate })
                   .andWhere('leave.endDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.status) {
      query = query.andWhere('leave.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query = query.andWhere('leave.type = :type', { type: filters.type });
    }

    if (filters.userId) {
      query = query.andWhere('leave.employeeId = :userId', { userId: filters.userId });
    }

    const leaveRequests = await query.getMany();
    return await this.reportsService.generateLeaveReportExcel(leaveRequests, filters);
  }

  async generateLeaveBalanceReport(): Promise<Buffer> {
    const users = await this.userRepository.find({
      order: { name: 'ASC' }
    });
    return await this.reportsService.generateUserLeaveBalanceExcel(users);
  }

  async generateLeaveReportPDF(filters: any): Promise<Buffer> {
    let query = this.leaveRequestRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('leave.approver', 'approver')
      .orderBy('leave.createdAt', 'DESC');

    if (filters.startDate) {
      query = query.andWhere('leave.startDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query = query.andWhere('leave.endDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.status) {
      query = query.andWhere('leave.status = :status', { status: filters.status });
    }

    if (filters.type) {
      query = query.andWhere('leave.type = :type', { type: filters.type });
    }

    if (filters.userId) {
      query = query.andWhere('leave.employeeId = :userId', { userId: filters.userId });
    }

    const leaveRequests = await query.getMany();
    return await this.reportsService.generateLeaveReportPDF(leaveRequests, filters);
  }

  async generateLeaveBalanceReportPDF(): Promise<Buffer> {
    const users = await this.userRepository.find({
      order: { name: 'ASC' }
    });
    return await this.reportsService.generateBalanceReportPDF(users);
  }
}
