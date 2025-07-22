import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequest } from './entities/leave-request.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest, User]),
    UsersModule,
    AuthModule,
    ServicesModule,
  ],
  providers: [LeaveRequestService],
  controllers: [LeaveRequestController],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
