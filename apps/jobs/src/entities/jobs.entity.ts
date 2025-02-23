import { Application } from 'apps/applications/src/entities/applications.entity';
import { Requirement } from 'apps/jobs/src/entities/requirements.entity';
import { User } from 'apps/users/src/entities/users.entity';
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

  @ManyToOne(() => User, (user) => user.jobs, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'recruiter_id' })
  readonly user!: User;

  @OneToMany(() => Application, (application) => application.job, {
    cascade: true,
  })
  readonly applications!: Application[];

  @ManyToMany(() => Requirement, (requirement) => requirement.jobs)
  readonly requirements!: Requirement[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
