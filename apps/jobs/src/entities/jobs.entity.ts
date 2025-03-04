import { Application } from 'apps/applications/src/entities/applications.entity';
import { Interview } from 'apps/interviews/src/entities/interviews.entity';
import { Requirement } from 'apps/jobs/src/entities/requirements.entity';
import { SavedJob } from 'apps/jobs/src/entities/saved-jobs.entity';
import { Notification } from 'apps/notifications/src/entities/notifications.entity';
import { UserNotification } from 'apps/notifications/src/entities/user-notification.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'job' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  readonly title!: string;

  @Column()
  readonly address!: string;

  @Column({ type: 'enum', enum: ['full_time', 'part_time', 'remote'] })
  readonly job_type!: string;

  @Column({ type: 'decimal', scale: 2, precision: 10 })
  readonly salary_min!: number;

  @Column({ type: 'decimal', scale: 2, precision: 10 })
  readonly salary_max!: number;

  @Column({ type: 'text' })
  readonly description!: string;

  @Column({ type: 'enum', enum: ['open', 'closed'] })
  readonly status!: string;

  @Column({ type: 'timestamp' })
  readonly posted_at!: Date;

  @Column({ type: 'timestamp' })
  readonly expired_at!: Date;

  @Column({ type: 'boolean', default: false })
  readonly is_approved!: boolean;

  @ManyToOne(() => User, (user) => user.jobs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'recruiter_id' })
  readonly recruiter!: User;

  @OneToMany(() => Application, (application) => application.job, {
    cascade: true,
  })
  readonly applications!: Application[];

  @ManyToMany(() => Requirement, (requirement) => requirement.jobs, {
    cascade: true,
  })
  readonly requirements!: Requirement[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.job, { cascade: true })
  readonly savedByUsers!: SavedJob[];

  @OneToMany(() => Interview, (interview) => interview.job, {
    cascade: true,
  })
  readonly interviews!: Interview[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.job,
    { cascade: true },
  )
  readonly userNotifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
