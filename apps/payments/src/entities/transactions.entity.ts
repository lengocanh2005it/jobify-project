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

@Entity({ name: 'transaction' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING',
  })
  status!: string;

  @Column({
    type: 'timestamp',
  })
  payment_date!: Date;

  @Column({
    type: 'timestamp',
  })
  expiry_date!: Date;

  @ManyToOne(() => User, (user) => user.transactions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
