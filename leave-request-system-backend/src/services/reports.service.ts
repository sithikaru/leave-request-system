import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';
import { LeaveRequest, LeaveDuration } from '../leave-request/entities/leave-request.entity';
import { User } from '../users/entities/user.entity';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  status?: string;
  type?: string;
  userId?: number;
}

@Injectable()
export class ReportsService {
  async generateLeaveReportExcel(leaveRequests: LeaveRequest[], filters: ReportFilters): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leave Report');

    // Add title and filters info
    worksheet.addRow(['Leave Report']);
    worksheet.addRow([]);
    if (filters.startDate && filters.endDate) {
      worksheet.addRow([`Period: ${filters.startDate.toDateString()} to ${filters.endDate.toDateString()}`]);
    }
    worksheet.addRow([]);

    // Add headers
    const headers = [
      'Employee Name',
      'Email',
      'Leave Type',
      'Duration',
      'Start Date',
      'End Date',
      'Total Days',
      'Status',
      'Reason',
      'Approved By',
      'Approved Date',
      'Comments'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    leaveRequests.forEach(request => {
      worksheet.addRow([
        request.employee.name,
        request.employee.email,
        request.type,
        request.duration,
        request.startDate.toDateString(),
        request.endDate.toDateString(),
        request.totalDays,
        request.status,
        request.reason,
        request.approver?.name || '',
        request.approvedAt?.toDateString() || '',
        request.approvalComments || ''
      ]);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Add summary section
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    
    const totalRequests = leaveRequests.length;
    const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
    const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
    const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;
    
    worksheet.addRow(['Total Requests:', totalRequests]);
    worksheet.addRow(['Approved:', approvedRequests]);
    worksheet.addRow(['Pending:', pendingRequests]);
    worksheet.addRow(['Rejected:', rejectedRequests]);

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async generateUserLeaveBalanceExcel(users: User[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leave Balances');

    // Add title
    worksheet.addRow(['Employee Leave Balances']);
    worksheet.addRow([]);

    // Add headers
    const headers = [
      'Employee Name',
      'Email',
      'Role',
      'Annual Leave Balance',
      'Sick Leave Balance',
      'Personal Leave Balance',
      'Emergency Leave Balance'
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    users.forEach(user => {
      worksheet.addRow([
        user.name,
        user.email,
        user.role,
        user.annualLeaveBalance,
        user.sickLeaveBalance,
        user.personalLeaveBalance,
        user.emergencyLeaveBalance
      ]);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  async generateLeaveReportPDF(leaveRequests: LeaveRequest[], filters: ReportFilters): Promise<Buffer> {
    const html = this.generateLeaveReportHTML(leaveRequests, filters);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true
    });
    
    await browser.close();
    return Buffer.from(pdf);
  }

  async generateBalanceReportPDF(users: User[]): Promise<Buffer> {
    const html = this.generateBalanceReportHTML(users);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: false,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true
    });
    
    await browser.close();
    return Buffer.from(pdf);
  }

  private generateLeaveReportHTML(leaveRequests: LeaveRequest[], filters: ReportFilters): string {
    const filterInfo = filters.startDate && filters.endDate 
      ? `Period: ${filters.startDate.toDateString()} to ${filters.endDate.toDateString()}`
      : 'All Time';

    const rows = leaveRequests.map(request => `
      <tr>
        <td>${request.employee?.name || 'N/A'}</td>
        <td>${request.employee?.email || 'N/A'}</td>
        <td>${request.type.replace('_', ' ')}</td>
        <td>${request.duration === LeaveDuration.HALF_DAY_MORNING || request.duration === LeaveDuration.HALF_DAY_AFTERNOON ? 'Half Day' : 'Full Day'}</td>
        <td>${new Date(request.startDate).toLocaleDateString()}</td>
        <td>${new Date(request.endDate).toLocaleDateString()}</td>
        <td>${request.totalDays || this.calculateDays(request.startDate, request.endDate)}</td>
        <td style="color: ${this.getStatusColor(request.status)}">${request.status.toUpperCase()}</td>
        <td>${request.reason}</td>
        <td>${request.approver?.name || 'N/A'}</td>
        <td>${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A'}</td>
        <td>${request.approvalComments || 'N/A'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Leave Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
          th { background-color: #f3f4f6; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Leave Requests Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>${filterInfo}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Email</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Approved By</th>
              <th>Approved Date</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          <p>Total requests: ${leaveRequests.length}</p>
          <p>This report was generated automatically by the Leave Request System</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateBalanceReportHTML(users: User[]): string {
    const rows = users.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role.toUpperCase()}</td>
        <td>${user.annualLeaveBalance || 21}</td>
        <td>${user.sickLeaveBalance || 10}</td>
        <td>${user.personalLeaveBalance || 5}</td>
        <td>${user.emergencyLeaveBalance || 3}</td>
        <td>${(user.annualLeaveBalance || 21) + (user.sickLeaveBalance || 10) + (user.personalLeaveBalance || 5) + (user.emergencyLeaveBalance || 3)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Leave Balance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          .summary { margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Employee Leave Balance Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Annual Leave</th>
              <th>Sick Leave</th>
              <th>Personal Leave</th>
              <th>Emergency Leave</th>
              <th>Total Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="summary">
          <p><strong>Total Employees:</strong> ${users.length}</p>
          <p><strong>Average Annual Leave:</strong> ${Math.round(users.reduce((sum, user) => sum + (user.annualLeaveBalance || 21), 0) / users.length)} days</p>
        </div>
        <div class="footer">
          <p>This report shows current leave balances for all employees</p>
          <p>Generated automatically by the Leave Request System</p>
        </div>
      </body>
      </html>
    `;
  }

  private calculateDays(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return '#16a34a';
      case 'rejected': return '#dc2626';
      case 'pending': return '#eab308';
      case 'cancelled': return '#6b7280';
      default: return '#000000';
    }
  }

  calculateLeaveDays(
    startDate: Date, 
    endDate: Date, 
    duration: LeaveDuration, 
    publicHolidays: Date[] = []
  ): number {
    let totalDays = this.calculateDays(startDate, endDate);
    
    // For half-day leaves, return 0.5
    if (duration === LeaveDuration.HALF_DAY_MORNING || duration === LeaveDuration.HALF_DAY_AFTERNOON) {
      return 0.5;
    }
    
    // Remove public holidays from the count
    const start = new Date(startDate);
    const end = new Date(endDate);
    let holidaysInRange = 0;
    
    for (const holiday of publicHolidays) {
      const holidayDate = new Date(holiday);
      if (holidayDate >= start && holidayDate <= end) {
        holidaysInRange++;
      }
    }
    
    return Math.max(0, totalDays - holidaysInRange);
  }
}
