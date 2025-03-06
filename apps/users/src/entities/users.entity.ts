import { Application } from 'apps/applications/src/entities/applications.entity';
import { Interview } from 'apps/interviews/src/entities/interviews.entity';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { SavedJob } from 'apps/jobs/src/entities/saved-jobs.entity';
import { Conversation } from 'apps/messages/src/entities/conversations.entity';
import { Message } from 'apps/messages/src/entities/messages.entity';
import { UserNotification } from 'apps/notifications/src/entities/user-notification.entity';
import { Transaction } from 'apps/payments/src/entities/transactions.entity';
import { Review } from 'apps/reviews/src/entities/reviews.entity';
import { Role } from 'apps/users/src/entities/roles.entity';
import { Skill } from 'apps/users/src/entities/skills.entity';
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

  @Column({ unique: true })
  readonly email!: string;

  @Column()
  readonly password!: string;

  @Column()
  readonly phone_number!: string;

  @Column()
  readonly address!: string;

  @Column({ nullable: true, type: 'text' })
  readonly bio?: string;

  @Column()
  readonly full_name!: string;

  @Column({ type: 'text' })
  readonly avatar_url!: string;

  @Column({
    type: 'decimal',
    scale: 2,
    precision: 10,
    nullable: true,
  })
  readonly expected_salary?: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  readonly is_premium?: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  readonly premium_expiry?: Date;

  @Column({
    nullable: true,
    type: 'json',
  })
  readonly certifications?: string[];

  @Column({ type: 'text', nullable: true })
  readonly resume_link?: string;

  @Column({ type: 'int', nullable: true })
  readonly job_posted_count?: number;

  @Column({ type: 'int', nullable: true })
  readonly application_applied_count?: number;

  @OneToMany(() => Transaction, (transaction) => transaction.user, {
    cascade: true,
  })
  readonly transactions!: Transaction[];

  @ManyToOne(() => Role, (role) => role.users, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  readonly role!: Role;

  @OneToMany(() => Job, (job) => job.recruiter, { cascade: true })
  readonly jobs!: Job[];

  @ManyToOne(() => Company, (company) => company.recruiters, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'company_id' })
  readonly company!: Company;

  @OneToMany(() => Application, (application) => application.candidate, {
    cascade: true,
  })
  readonly applications!: Application[];

  @OneToMany(() => Review, (review) => review.candidate, { cascade: true })
  readonly reviews!: Review[];

  @OneToMany(() => Message, (message) => message.sender, { cascade: true })
  readonly sent_messages!: Message[];

  @OneToMany(() => Message, (message) => message.receiver, { cascade: true })
  readonly received_messages!: Message[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
    { cascade: true },
  )
  readonly userNotifications!: UserNotification[];

  @ManyToMany(() => Skill, (skill) => skill.users)
  readonly skills!: Skill[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.user, { cascade: true })
  readonly savedJobs!: SavedJob[];

  @OneToMany(() => Interview, (interview) => interview.candidate, {
    cascade: true,
  })
  readonly candidate_interviews!: Interview[];

  @OneToMany(() => Interview, (interview) => interview.recruiter, {
    cascade: true,
  })
  readonly recruiter_interviews!: Interview[];

  @ManyToMany(() => Conversation, (conversation) => conversation.participants)
  readonly conversations!: Conversation[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
