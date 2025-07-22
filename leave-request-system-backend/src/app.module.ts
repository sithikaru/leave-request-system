import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ServicesModule } from './services/services.module';
import { TestController } from './test/test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: +(process.env.DATABASE_PORT || 3306),
      username: process.env.DATABASE_USERNAME || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'leave_system',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // disable in production
    }),
    AuthModule,
    UsersModule,
    LeaveRequestModule,
    AnalyticsModule,
    ServicesModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
