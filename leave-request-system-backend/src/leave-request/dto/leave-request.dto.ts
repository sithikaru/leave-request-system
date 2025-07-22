import { LeaveType } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  employeeId?: number; // Auto-filled for employees
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export class UpdateLeaveRequestDto {
  type?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  reason?: string;
}

export class ApprovalDto {
  comments?: string;
}
