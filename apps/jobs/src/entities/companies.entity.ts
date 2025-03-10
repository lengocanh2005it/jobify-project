import { Review } from 'apps/reviews/src/entities';
import { User } from 'apps/users/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'company' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  bio?: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  website?: string;

  @OneToMany(() => User, (user) => user.company, { cascade: true })
  recruiters!: User[];

  @OneToMany(() => Review, (review) => review.company, { cascade: true })
  reviews!: Review[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
