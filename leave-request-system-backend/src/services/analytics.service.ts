import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LeaveRequest, LeaveType, LeaveStatus } from '../leave-request/entities/leave-request.entity';
import { User, UserRole } from '../users/entities/user.entity';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  departmentId?: number;
  employeeId?: number;
  leaveType?: LeaveType;
  status?: LeaveStatus;
}

export interface LeaveAnalytics {
  // Leave Distribution Data
  leaveTypeDistribution: { type: string; count: number; percentage: number }[];
  leaveStatusDistribution: { status: string; count: number; percentage: number }[];
  
  // Time-based Analytics
  monthlyLeaveData: { month: string; annual: number; sick: number; personal: number; emergency: number; total: number }[];
  quarterlyTrends: { quarter: string; approved: number; rejected: number; pending: number }[];
  
  // Department Analytics
  departmentLeaveData: { department: string; totalRequests: number; approvedRequests: number; averageDays: number }[];
  
  // Employee Analytics
  topLeaveUsers: { employeeName: string; totalDays: number; totalRequests: number }[];
  
  // Leave Balance Analytics
  leaveBalanceData: { balanceRange: string; employeeCount: number }[];
  
  // Manager Performance
  managerPerformance: { managerName: string; avgResponseTime: number; approvalRate: number; totalRequests: number }[];
  
  // Summary Stats
  totalStats: {
    totalRequests: number;
    totalApproved: number;
    totalRejected: number;
    totalPending: number;
    averageRequestDays: number;
    averageResponseTime: number;
    mostPopularLeaveType: string;
    peakLeaveMonth: string;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getLeaveAnalytics(
    userId: number,
    userRole: UserRole,
    filters: AnalyticsFilters = {}
  ): Promise<LeaveAnalytics> {
    // Build base query
    let query = this.leaveRequestRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('leave.approver', 'approver');

    // Apply role-based filtering
    if (userRole === UserRole.EMPLOYEE) {
      query = query.where('leave.employeeId = :userId', { userId });
    } else if (userRole === UserRole.MANAGER) {
      // Managers can see all data (as per your requirement)
      // If you want department-specific filtering, add it here
    }
    // Admins see everything by default

    // Apply date filters
    if (filters.startDate && filters.endDate) {
      query = query.andWhere('leave.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    // Apply other filters
    if (filters.employeeId) {
      query = query.andWhere('leave.employeeId = :employeeId', { employeeId: filters.employeeId });
    }

    if (filters.leaveType) {
      query = query.andWhere('leave.type = :leaveType', { leaveType: filters.leaveType });
    }

    if (filters.status) {
      query = query.andWhere('leave.status = :status', { status: filters.status });
    }

    const leaveRequests = await query.getMany();

    // Calculate analytics
    return {
      leaveTypeDistribution: await this.calculateLeaveTypeDistribution(leaveRequests),
      leaveStatusDistribution: await this.calculateLeaveStatusDistribution(leaveRequests),
      monthlyLeaveData: await this.calculateMonthlyLeaveData(leaveRequests),
      quarterlyTrends: await this.calculateQuarterlyTrends(leaveRequests),
      departmentLeaveData: await this.calculateDepartmentLeaveData(leaveRequests),
      topLeaveUsers: await this.calculateTopLeaveUsers(leaveRequests),
      leaveBalanceData: await this.calculateLeaveBalanceData(),
      managerPerformance: await this.calculateManagerPerformance(leaveRequests),
      totalStats: await this.calculateTotalStats(leaveRequests),
    };
  }

  private async calculateLeaveTypeDistribution(requests: LeaveRequest[]) {
    const typeCount = requests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = requests.length;
    return Object.entries(typeCount).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  private async calculateLeaveStatusDistribution(requests: LeaveRequest[]) {
    const statusCount = requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = requests.length;
    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  private async calculateMonthlyLeaveData(requests: LeaveRequest[]) {
    const monthlyData = {} as Record<string, any>;
    
    requests.forEach(req => {
      const month = new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, annual: 0, sick: 0, personal: 0, emergency: 0, total: 0 };
      }
      
      monthlyData[month][req.type] += req.totalDays;
      monthlyData[month].total += req.totalDays;
    });

    return Object.values(monthlyData).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }

  private async calculateQuarterlyTrends(requests: LeaveRequest[]) {
    const quarterlyData = {} as Record<string, any>;
    
    requests.forEach(req => {
      const date = new Date(req.createdAt);
      const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
      
      if (!quarterlyData[quarter]) {
        quarterlyData[quarter] = { quarter, approved: 0, rejected: 0, pending: 0 };
      }
      
      quarterlyData[quarter][req.status]++;
    });

    return Object.values(quarterlyData).sort((a: any, b: any) => 
      a.quarter.localeCompare(b.quarter)
    );
  }

  private async calculateDepartmentLeaveData(requests: LeaveRequest[]) {
    // For now, we'll group by role since we don't have departments in the User entity
    const deptData = {} as Record<string, any>;
    
    requests.forEach(req => {
      const dept = req.employee.role.charAt(0).toUpperCase() + req.employee.role.slice(1);
      if (!deptData[dept]) {
        deptData[dept] = { department: dept, totalRequests: 0, approvedRequests: 0, totalDays: 0 };
      }
      
      deptData[dept].totalRequests++;
      if (req.status === LeaveStatus.APPROVED) {
        deptData[dept].approvedRequests++;
        deptData[dept].totalDays += req.totalDays;
      }
    });

    return Object.values(deptData).map((dept: any) => ({
      ...dept,
      averageDays: dept.approvedRequests > 0 ? Math.round(dept.totalDays / dept.approvedRequests * 10) / 10 : 0,
    }));
  }

  private async calculateTopLeaveUsers(requests: LeaveRequest[]) {
    const userStats = {} as Record<number, any>;
    
    requests.forEach(req => {
      if (!userStats[req.employeeId]) {
        userStats[req.employeeId] = {
          employeeName: req.employee.name,
          totalDays: 0,
          totalRequests: 0,
        };
      }
      
      userStats[req.employeeId].totalRequests++;
      if (req.status === LeaveStatus.APPROVED) {
        userStats[req.employeeId].totalDays += req.totalDays;
      }
    });

    return Object.values(userStats)
      .sort((a: any, b: any) => b.totalDays - a.totalDays)
      .slice(0, 10);
  }

  private async calculateLeaveBalanceData() {
    const users = await this.userRepository.find({
      select: ['id', 'name', 'annualLeaveBalance', 'sickLeaveBalance', 'personalLeaveBalance', 'emergencyLeaveBalance'],
    });

    const balanceRanges = {
      '0-10 days': 0,
      '11-20 days': 0,
      '21-30 days': 0,
      '31+ days': 0,
    };

    users.forEach(user => {
      const totalBalance = user.annualLeaveBalance + user.sickLeaveBalance + user.personalLeaveBalance + user.emergencyLeaveBalance;
      
      if (totalBalance <= 10) balanceRanges['0-10 days']++;
      else if (totalBalance <= 20) balanceRanges['11-20 days']++;
      else if (totalBalance <= 30) balanceRanges['21-30 days']++;
      else balanceRanges['31+ days']++;
    });

    return Object.entries(balanceRanges).map(([balanceRange, employeeCount]) => ({
      balanceRange,
      employeeCount,
    }));
  }

  private async calculateManagerPerformance(requests: LeaveRequest[]) {
    const managerStats = {} as Record<number, any>;
    
    requests.forEach(req => {
      if (req.approver && req.approvedAt) {
        if (!managerStats[req.approvedBy]) {
          managerStats[req.approvedBy] = {
            managerName: req.approver.name,
            totalRequests: 0,
            approvedRequests: 0,
            totalResponseTime: 0,
          };
        }
        
        managerStats[req.approvedBy].totalRequests++;
        if (req.status === LeaveStatus.APPROVED) {
          managerStats[req.approvedBy].approvedRequests++;
        }
        
        const responseTime = Math.ceil((new Date(req.approvedAt).getTime() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        managerStats[req.approvedBy].totalResponseTime += responseTime;
      }
    });

    return Object.values(managerStats).map((manager: any) => ({
      managerName: manager.managerName,
      avgResponseTime: manager.totalRequests > 0 ? Math.round(manager.totalResponseTime / manager.totalRequests * 10) / 10 : 0,
      approvalRate: manager.totalRequests > 0 ? Math.round((manager.approvedRequests / manager.totalRequests) * 100) : 0,
      totalRequests: manager.totalRequests,
    }));
  }

  private async calculateTotalStats(requests: LeaveRequest[]) {
    const approved = requests.filter(r => r.status === LeaveStatus.APPROVED);
    const rejected = requests.filter(r => r.status === LeaveStatus.REJECTED);
    const pending = requests.filter(r => r.status === LeaveStatus.PENDING);
    
    const avgRequestDays = approved.length > 0 
      ? Math.round((approved.reduce((sum, r) => sum + r.totalDays, 0) / approved.length) * 10) / 10 
      : 0;

    // Calculate average response time
    const processedRequests = requests.filter(r => r.approvedAt);
    const avgResponseTime = processedRequests.length > 0
      ? Math.round((processedRequests.reduce((sum, r) => {
          return sum + Math.ceil((new Date(r.approvedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / processedRequests.length) * 10) / 10
      : 0;

    // Most popular leave type
    const typeCount = requests.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostPopularLeaveType = Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, 'annual');

    // Peak leave month
    const monthCount = requests.reduce((acc, req) => {
      const month = new Date(req.createdAt).toLocaleDateString('en-US', { month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const peakLeaveMonth = Object.keys(monthCount).reduce((a, b) => monthCount[a] > monthCount[b] ? a : b, 'January');

    return {
      totalRequests: requests.length,
      totalApproved: approved.length,
      totalRejected: rejected.length,
      totalPending: pending.length,
      averageRequestDays: avgRequestDays,
      averageResponseTime: avgResponseTime,
      mostPopularLeaveType: mostPopularLeaveType.charAt(0).toUpperCase() + mostPopularLeaveType.slice(1),
      peakLeaveMonth,
    };
  }
}
