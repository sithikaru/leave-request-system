import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Configure with your email service
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // For development only
      },
    });

    // Verify SMTP connection configuration
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection verification failed:', error.message);
      this.logger.warn('Email notifications will not work. Please check your SMTP configuration.');
    }
  }

  async sendLeaveRequestNotification(leaveRequest: LeaveRequest, manager: User) {
    if (!manager.emailNotifications) {
      this.logger.log(`Manager ${manager.email} has email notifications disabled`);
      return;
    }

    this.logger.log(`Attempting to send leave request notification to ${manager.email}`);

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
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${manager.email} for leave request ${leaveRequest.id}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${manager.email}:`, error.message);
      throw error;
    }
  }

  async sendLeaveStatusUpdate(leaveRequest: LeaveRequest) {
    if (!leaveRequest.employee.emailNotifications) {
      this.logger.log(`Employee ${leaveRequest.employee.email} has email notifications disabled`);
      return;
    }

    this.logger.log(`Attempting to send leave status update to ${leaveRequest.employee.email}`);

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
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Status update email sent to ${leaveRequest.employee.email}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send status update email to ${leaveRequest.employee.email}:`, error.message);
      throw error;
    }
  }
}
