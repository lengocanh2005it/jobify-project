import { Application } from 'apps/applications/src/entities/applications.entity';
import { Interview } from 'apps/interviews/src/entities/interviews.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
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

  @ManyToOne(() => Job, (job) => job.userNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'job_id' })
  readonly job?: Job;

  @ManyToOne(
    () => Application,
    (application) => application.userNotifications,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'application_id' })
  readonly application!: Application;

  @ManyToOne(() => Interview, (interview) => interview.userNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'interview_id' })
  readonly interview!: Interview;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
