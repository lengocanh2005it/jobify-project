import { Job } from 'apps/jobs/src/entities';
import { UserNotification } from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
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
  resume_link!: string;

  @Column({ type: 'text', nullable: true })
  cover_letter_link?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: string;

  @Column({ type: 'timestamp' })
  applied_at!: Date;

  @ManyToOne(() => User, (user) => user.applications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: User;

  @ManyToOne(() => Job, (job) => job.applications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.application,
    {
      cascade: true,
    },
  )
  userNotifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
