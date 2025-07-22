import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { PublicHolidaysService } from './public-holidays.service';
import { PublicHolidaysController } from './public-holidays.controller';
import { PaidLeaveService } from './paid-leave.service';
import { PaidLeaveController } from './paid-leave.controller';
import { LeaveRequest } from './entities/leave-request.entity';
import { PublicHoliday } from './entities/public-holiday.entity';
import { PaidLeave } from './entities/paid-leave.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest, PublicHoliday, PaidLeave, User]),
    UsersModule,
    AuthModule,
    ServicesModule,
  ],
  providers: [LeaveRequestService, PublicHolidaysService, PaidLeaveService],
  controllers: [LeaveRequestController, PublicHolidaysController, PaidLeaveController],
  exports: [LeaveRequestService, PublicHolidaysService, PaidLeaveService],
})
export class LeaveRequestModule {}
