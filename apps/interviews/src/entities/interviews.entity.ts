import { Job } from 'apps/jobs/src/entities';
import { UserNotification } from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
import {
  ApprovalStatus,
  InterviewResult,
  InterviewStatus,
  InterviewType,
  Role,
} from 'libs/common/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'interview' })
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: InterviewType })
  interview_type!: InterviewType;

  @Column({ nullable: true })
  interview_link?: string;

  @Column({ nullable: true })
  interview_address!: string;

  @Column({ nullable: true })
  cancel_reason?: string;

  @Column({ type: 'timestamp' })
  interview_date!: Date;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  status!: InterviewStatus;

  @Column({ nullable: true })
  note?: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approval_status!: ApprovalStatus;

  @Column({ type: 'enum', enum: Role, nullable: true })
  cancelled_by?: Role;

  @Column({
    type: 'enum',
    enum: InterviewResult,
    default: InterviewResult.PENDING,
  })
  result!: InterviewResult;

  @Column({ type: 'text', nullable: true })
  result_note?: string;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @ManyToOne(() => User, (user) => user.candidate_interviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: User;

  @ManyToOne(() => User, (user) => user.recruiter_interviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter!: User;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.interview,
    { cascade: true },
  )
  userNotifications!: UserNotification[];

  @ManyToOne(() => Job, (job) => job.interviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
