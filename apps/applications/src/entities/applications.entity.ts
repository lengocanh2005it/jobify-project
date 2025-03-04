import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { UserNotification } from 'apps/notifications/src/entities/user-notification.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'application' })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'text' })
  readonly resume_link!: string;

  @Column({ type: 'text', nullable: true })
  readonly cover_letter_link?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  readonly status!: string;

  @Column({ type: 'timestamp' })
  readonly applied_at!: Date;

  @ManyToOne(() => User, (user) => user.applications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  readonly candidate!: User;

  @ManyToOne(() => Job, (job) => job.applications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  readonly job!: Job;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.application,
    {
      cascade: true,
    },
  )
  readonly userNotifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
