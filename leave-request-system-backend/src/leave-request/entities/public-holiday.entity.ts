import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('public_holidays')
export class PublicHoliday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 2, default: 'LK' })
  country: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
