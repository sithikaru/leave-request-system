import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  // Leave quota tracking
  @Column({ type: 'decimal', precision: 4, scale: 1, default: 25.0 })
  annualLeaveBalance: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 10.0 })
  sickLeaveBalance: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 3.0 })
  personalLeaveBalance: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 5.0 })
  emergencyLeaveBalance: number;

  @Column({ type: 'boolean', default: true })
  emailNotifications: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
