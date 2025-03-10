import { Job } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
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
  user!: User;

  @ManyToOne(() => Job, (job) => job.savedByUsers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job!: Job;

  @CreateDateColumn({ type: 'timestamp' })
  readonly savedAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
