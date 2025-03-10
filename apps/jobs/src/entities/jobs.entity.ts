import { Application } from 'apps/applications/src/entities';
import { Interview } from 'apps/interviews/src/entities';
import { Requirement, SavedJob } from 'apps/jobs/src/entities';
import { UserNotification } from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'job' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  title!: string;

  @Column()
  address!: string;

  @Column({ type: 'enum', enum: ['full_time', 'part_time', 'remote'] })
  job_type!: string;

  @Column({ type: 'decimal', scale: 2, precision: 10 })
  salary_min!: number;

  @Column({ type: 'decimal', scale: 2, precision: 10 })
  salary_max!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: ['open', 'closed'] })
  status!: string;

  @Column({ type: 'timestamp' })
  posted_at!: Date;

  @Column({ type: 'timestamp' })
  expired_at!: Date;

  @Column({ type: 'boolean', default: false })
  is_approved!: boolean;

  @Column({ nullable: true })
  cancel_reason?: string;

  @Column({ nullable: true })
  cancelled_by?: string;

  @ManyToOne(() => User, (user) => user.jobs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter!: User;

  @OneToMany(() => Application, (application) => application.job, {
    cascade: true,
  })
  applications!: Application[];

  @ManyToMany(() => Requirement, (requirement) => requirement.jobs, {
    cascade: true,
  })
  requirements!: Requirement[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.job, { cascade: true })
  savedByUsers!: SavedJob[];

  @OneToMany(() => Interview, (interview) => interview.job, {
    cascade: true,
  })
  interviews!: Interview[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.job,
    { cascade: true },
  )
  userNotifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
