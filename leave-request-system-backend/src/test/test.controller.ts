import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailService } from '../services/email.service';
import { UserRole } from '../users/entities/user.entity';

interface TestEmailDto {
  to: string;
  subject?: string;
  message?: string;
}

@Controller('test')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestController {
  constructor(private readonly emailService: EmailService) {}

  @Post('email')
  @Roles(UserRole.ADMIN)
  async testEmail(@Body() testEmailDto: TestEmailDto) {
    try {
      // Create a test transporter just for this endpoint
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      await transporter.verify();

      // Send test email
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@company.com',
        to: testEmailDto.to,
        subject: testEmailDto.subject || 'Test Email from Leave Request System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Test Email</h2>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              <p>${testEmailDto.message || 'This is a test email to verify that email notifications are working correctly.'}</p>
              <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
            </div>
          </div>
        `,
      });

      return {
        success: true,
        message: 'Test email sent successfully',
        messageId: info.messageId,
        smtpConfig: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'Not set',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
        smtpConfig: {
          host: process.env.SMTP_HOST || 'Not set',
          port: process.env.SMTP_PORT || 'Not set',
          user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'Not set',
        },
      };
    }
  }
}
