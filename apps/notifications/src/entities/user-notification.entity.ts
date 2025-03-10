import { Application } from 'apps/applications/src/entities';
import { Interview } from 'apps/interviews/src/entities';
import { Job } from 'apps/jobs/src/entities';
import { Conversation } from 'apps/messages/src/entities';
import { Notification } from 'apps/notifications/src/entities';
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

@Entity({ name: 'user_notification' })
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @ManyToOne(() => User, (user) => user.userNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(
    () => Notification,
    (notification) => notification.userNotifications,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'notification_id' })
  notification!: Notification;

  @ManyToOne(() => Job, (job) => job.userNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'job_id' })
  job?: Job;

  @ManyToOne(
    () => Application,
    (application) => application.userNotifications,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'application_id' })
  application!: Application;

  @ManyToOne(() => Interview, (interview) => interview.userNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'interview_id' })
  interview!: Interview;

  @ManyToOne(
    () => Conversation,
    (conversation) => conversation.messages_notifications,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
