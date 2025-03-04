import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { UserNotification } from 'apps/notifications/src/entities/user-notification.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
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

  @Column()
  readonly type!: string;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.notification,
    { cascade: true },
  )
  readonly userNotifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
