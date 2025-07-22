import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaidLeave, PaidLeaveType } from './entities/paid-leave.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EmailService } from '../services/email.service';

export interface CreatePaidLeaveDto {
  employeeId: number;
  type: PaidLeaveType;
  days: number;
  reason: string;
  notes?: string;
  deductFromBalance: boolean;
}

export interface UpdatePaidLeaveDto {
  type?: PaidLeaveType;
  days?: number;
  reason?: string;
  notes?: string;
  deductFromBalance?: boolean;
}

@Injectable()
export class PaidLeaveService {
  constructor(
    @InjectRepository(PaidLeave)
    private readonly paidLeaveRepository: Repository<PaidLeave>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(createPaidLeaveDto: CreatePaidLeaveDto, granterId: number): Promise<PaidLeave> {
    const employee = await this.userRepository.findOne({
      where: { id: createPaidLeaveDto.employeeId }
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const granter = await this.userRepository.findOne({
      where: { id: granterId }
    });

    if (!granter) {
      throw new NotFoundException('Granter not found');
    }

    // Create paid leave record
    const paidLeave = this.paidLeaveRepository.create({
      ...createPaidLeaveDto,
      grantedBy: granterId,
    });

    const savedPaidLeave = await this.paidLeaveRepository.save(paidLeave);

    // Update employee leave balance if not deducting
    if (!createPaidLeaveDto.deductFromBalance) {
      // Add to annual leave balance by default
      employee.annualLeaveBalance = Number(employee.annualLeaveBalance) + Number(createPaidLeaveDto.days);
      await this.userRepository.save(employee);
    }

    // Load complete record with relations
    const completePaidLeave = await this.paidLeaveRepository.findOne({
      where: { id: savedPaidLeave.id },
      relations: ['employee', 'granter'],
    });

    // Send email notification to employee
    await this.emailService.sendPaidLeaveNotification(completePaidLeave!);

    return completePaidLeave!;
  }

  async findAll(): Promise<PaidLeave[]> {
    return await this.paidLeaveRepository.find({
      relations: ['employee', 'granter'],
      order: { grantedAt: 'DESC' },
    });
  }

  async findByEmployee(employeeId: number): Promise<PaidLeave[]> {
    return await this.paidLeaveRepository.find({
      where: { employeeId },
      relations: ['employee', 'granter'],
      order: { grantedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PaidLeave> {
    const paidLeave = await this.paidLeaveRepository.findOne({
      where: { id },
      relations: ['employee', 'granter'],
    });

    if (!paidLeave) {
      throw new NotFoundException(`Paid leave record with ID ${id} not found`);
    }

    return paidLeave;
  }

  async update(id: number, updatePaidLeaveDto: UpdatePaidLeaveDto, userId: number, userRole: UserRole): Promise<PaidLeave> {
    const paidLeave = await this.findOne(id);

    // Only admin or the granter can update paid leave records
    if (userRole !== UserRole.ADMIN && paidLeave.grantedBy !== userId) {
      throw new ForbiddenException('You can only update your own granted paid leaves');
    }

    Object.assign(paidLeave, updatePaidLeaveDto);
    return await this.paidLeaveRepository.save(paidLeave);
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<void> {
    const paidLeave = await this.findOne(id);

    // Only admin or the granter can remove paid leave records
    if (userRole !== UserRole.ADMIN && paidLeave.grantedBy !== userId) {
      throw new ForbiddenException('You can only remove your own granted paid leaves');
    }

    await this.paidLeaveRepository.remove(paidLeave);
  }

  async getStatsByEmployee(employeeId: number): Promise<{
    totalDaysGranted: number;
    totalRecords: number;
    typeBreakdown: { type: string; days: number; count: number }[];
  }> {
    const paidLeaves = await this.findByEmployee(employeeId);

    const stats = {
      totalDaysGranted: 0,
      totalRecords: paidLeaves.length,
      typeBreakdown: [] as { type: string; days: number; count: number }[]
    };

    const typeMap = new Map();

    paidLeaves.forEach(pl => {
      stats.totalDaysGranted += Number(pl.days);

      if (typeMap.has(pl.type)) {
        const existing = typeMap.get(pl.type);
        typeMap.set(pl.type, {
          days: existing.days + Number(pl.days),
          count: existing.count + 1
        });
      } else {
        typeMap.set(pl.type, {
          days: Number(pl.days),
          count: 1
        });
      }
    });

    stats.typeBreakdown = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      days: data.days,
      count: data.count
    }));

    return stats;
  }
}
