import { Application } from 'apps/applications/src/entities';
import { Interview } from 'apps/interviews/src/entities';
import { Company, Job, SavedJob } from 'apps/jobs/src/entities';
import { Conversation, Message } from 'apps/messages/src/entities';
import { UserNotification } from 'apps/notifications/src/entities';
import { Transaction } from 'apps/payments/src/entities';
import { Review } from 'apps/reviews/src/entities';
import { Role, Skill } from 'apps/users/src/entities';
import { Provider } from 'libs/common/constants';
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

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  phone_number?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column()
  full_name!: string;

  @Column({ type: 'text' })
  avatar_url!: string;

  @Column({
    type: 'decimal',
    scale: 2,
    precision: 10,
    nullable: true,
  })
  expected_salary?: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_premium?: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  premium_expiry?: Date;

  @Column({
    nullable: true,
    type: 'json',
  })
  certifications?: string[];

  @Column({ type: 'text', nullable: true })
  resume_link?: string;

  @Column({ type: 'int', nullable: true })
  job_posted_count?: number;

  @Column({ type: 'int', nullable: true })
  application_applied_count?: number;

  @Column({ type: 'enum', enum: Provider })
  provider!: Provider;

  @Column({ nullable: true, type: 'text' })
  provider_id?: string;

  @OneToMany(() => Transaction, (transaction) => transaction.user, {
    cascade: true,
  })
  transactions!: Transaction[];

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToMany(() => Job, (job) => job.recruiter, { cascade: true })
  jobs!: Job[];

  @ManyToOne(() => Company, (company) => company.recruiters, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @OneToMany(() => Application, (application) => application.candidate, {
    cascade: true,
  })
  applications!: Application[];

  @OneToMany(() => Review, (review) => review.candidate, { cascade: true })
  reviews!: Review[];

  @OneToMany(() => Message, (message) => message.sender, { cascade: true })
  sent_messages!: Message[];

  @OneToMany(() => Message, (message) => message.receiver, { cascade: true })
  received_messages!: Message[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
    { cascade: true },
  )
  userNotifications!: UserNotification[];

  @ManyToMany(() => Skill, (skill) => skill.users)
  skills!: Skill[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.user, { cascade: true })
  savedJobs!: SavedJob[];

  @OneToMany(() => Interview, (interview) => interview.candidate, {
    cascade: true,
  })
  candidate_interviews!: Interview[];

  @OneToMany(() => Interview, (interview) => interview.recruiter, {
    cascade: true,
  })
  recruiter_interviews!: Interview[];

  @ManyToMany(() => Conversation, (conversation) => conversation.participants)
  conversations!: Conversation[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
