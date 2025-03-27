import { User } from 'apps/users/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'device' })
export class Device {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  fingerprint!: string;

  @Column()
  ipAddress!: string;

  @Column()
  userAgent!: string;

  @Column({ type: 'timestamp' })
  lastLogin!: Date;

  @Column({ type: 'boolean', default: false })
  is_trusted!: boolean;

  @Column({ nullable: true })
  phone_number?: string;

  @Column()
  device_type!: string;

  @ManyToOne(() => User, (user) => user.devices, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
