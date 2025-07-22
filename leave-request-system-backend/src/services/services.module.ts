import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ReportsService } from './reports.service';

@Module({
  providers: [EmailService, ReportsService],
  exports: [EmailService, ReportsService],
})
export class ServicesModule {}
