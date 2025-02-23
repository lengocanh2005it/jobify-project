import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notification' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  readonly title!: string;

  @Column({ type: 'text' })
  readonly message!: string;

  @Column({ type: 'boolean', default: false })
  readonly is_read!: boolean;

  @Column({
    type: 'enum',
    enum: ['job_application', 'message', 'job_suggestion'],
  })
  readonly type!: string;

  @ManyToMany(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable({
    name: 'user_notification',
    joinColumn: {
      name: 'notification_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  readonly userNotifications!: User[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
