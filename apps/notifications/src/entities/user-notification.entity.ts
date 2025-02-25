import { Notification } from 'apps/notifications/src/entities/notifications.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_notification' })
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'boolean', default: false })
  readonly is_read!: boolean;

  @ManyToOne(() => User, (user) => user.userNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  readonly user!: User;

  @ManyToOne(
    () => Notification,
    (notification) => notification.userNotifications,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'notification_id' })
  readonly notification!: Notification;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
