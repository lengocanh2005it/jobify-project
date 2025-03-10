import { Company } from 'apps/jobs/src/entities';
import { User } from 'apps/users/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'review' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'int' })
  ratings_number!: number;

  @Column({ type: 'text' })
  comment!: string;

  @ManyToOne(() => User, (user) => user.reviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: User;

  @ManyToOne(() => Company, (company) => company.reviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
