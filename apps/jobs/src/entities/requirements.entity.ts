import { Job } from 'apps/jobs/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'requirement' })
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'text' })
  requirement!: string;

  @ManyToMany(() => Job, (job) => job.requirements, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable({
    name: 'job_requirements',
    joinColumn: {
      name: 'requirement_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'job_id',
      referencedColumnName: 'id',
    },
  })
  jobs!: Job[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
