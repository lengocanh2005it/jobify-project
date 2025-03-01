import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  ApprovalStatus,
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from 'libs/common/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'interview' })
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  readonly title!: string;

  @Column({ nullable: true })
  readonly description?: string;

  @Column({ type: 'enum', enum: InterviewType })
  readonly interview_type!: InterviewType;

  @Column({ nullable: true })
  readonly interview_link?: string;

  @Column({ nullable: true })
  readonly interview_address!: string;

  @Column({ nullable: true })
  readonly cancel_reason?: string;

  @Column({ type: 'timestamp' })
  readonly interview_date!: Date;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.SCHEDULED,
  })
  readonly status!: InterviewStatus;

  @Column({ nullable: true })
  readonly note?: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  readonly approval_status!: ApprovalStatus;

  @Column({
    type: 'enum',
    enum: InterviewResult,
    default: InterviewResult.PENDING,
  })
  readonly result!: InterviewResult;

  @Column({ type: 'text', nullable: true })
  readonly result_note?: string;

  @Column({ type: 'int', nullable: true })
  readonly score?: number;

  @ManyToOne(() => User, (user) => user.candidate_interviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  readonly candidate!: User;

  @ManyToOne(() => User, (user) => user.recruiter_interviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'recruiter_id' })
  readonly recruiter!: User;

  @ManyToOne(() => Job, (job) => job.interviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  readonly job!: Job;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
