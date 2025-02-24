import { Application } from 'apps/applications/src/entities/applications.entity';
import { Company } from 'apps/jobs/src/entities/companies.entity';
import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { Message } from 'apps/messages/src/entities/messages.entity';
import { Notification } from 'apps/notifications/src/entities/notifications.entity';
import { Review } from 'apps/reviews/src/entities/reviews.entity';
import { Role } from 'apps/users/src/entities/roles.entity';
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

  @ManyToMany(
    () => Notification,
    (notification) => notification.userNotifications,
  )
  readonly notifications!: Notification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
