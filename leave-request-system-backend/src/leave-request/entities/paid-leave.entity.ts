import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PaidLeaveType {
  BONUS = 'bonus',
  COMPENSATION = 'compensation',
  AWARD = 'award',
  OTHER = 'other',
}

@Entity('paid_leaves')
export class PaidLeave {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'employee_id' })
  employee: User;

  @Column({ name: 'granted_by' })
  grantedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  granter: User;

  @Column({
    type: 'enum',
    enum: PaidLeaveType,
    default: PaidLeaveType.BONUS,
  })
  type: PaidLeaveType;

  @Column({ type: 'decimal', precision: 4, scale: 1 })
  days: number;

  @Column({ length: 255 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false, name: 'deduct_from_balance' })
  deductFromBalance: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'granted_at' })
  grantedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;
}
