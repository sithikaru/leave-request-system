import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure with your email service (Gmail, SendGrid, etc.)
    this.transporter = nodemailer.createTransport({
      // For development, you can use ethereal email or configure your SMTP
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass',
      },
    });
  }

  async sendLeaveRequestNotification(leaveRequest: LeaveRequest, manager: User) {
    if (!manager.emailNotifications) return;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@company.com',
      to: manager.email,
      subject: `New Leave Request from ${leaveRequest.employee.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Leave Request</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <p><strong>Employee:</strong> ${leaveRequest.employee.name}</p>
            <p><strong>Type:</strong> ${leaveRequest.type}</p>
            <p><strong>Duration:</strong> ${leaveRequest.duration}</p>
            <p><strong>Dates:</strong> ${leaveRequest.startDate} to ${leaveRequest.endDate}</p>
            <p><strong>Total Days:</strong> ${leaveRequest.totalDays}</p>
            <p><strong>Reason:</strong> ${leaveRequest.reason}</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/manager/approvals" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Review Request
            </a>
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${manager.email} for leave request ${leaveRequest.id}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendLeaveStatusUpdate(leaveRequest: LeaveRequest) {
    if (!leaveRequest.employee.emailNotifications) return;

    const status = leaveRequest.status.toUpperCase();
    const statusColor = leaveRequest.status === 'approved' ? '#28a745' : '#dc3545';

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@company.com',
      to: leaveRequest.employee.email,
      subject: `Leave Request ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColor};">Leave Request ${status}</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <p><strong>Type:</strong> ${leaveRequest.type}</p>
            <p><strong>Duration:</strong> ${leaveRequest.duration}</p>
            <p><strong>Dates:</strong> ${leaveRequest.startDate} to ${leaveRequest.endDate}</p>
            <p><strong>Total Days:</strong> ${leaveRequest.totalDays}</p>
            ${leaveRequest.approvalComments ? `<p><strong>Comments:</strong> ${leaveRequest.approvalComments}</p>` : ''}
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Status update email sent to ${leaveRequest.employee.email}`);
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  }
}
