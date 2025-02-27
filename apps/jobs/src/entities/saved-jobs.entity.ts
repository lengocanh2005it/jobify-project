import { Job } from 'apps/jobs/src/entities/jobs.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'saved_job' })
export class SavedJob {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @ManyToOne(() => User, (user) => user.savedJobs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  readonly user!: User;

  @ManyToOne(() => Job, (job) => job.savedByUsers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  readonly job!: Job;

  @CreateDateColumn({ type: 'timestamp' })
  readonly savedAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
