import { Review } from 'apps/reviews/src/entities/reviews.entity';
import { User } from 'apps/users/src/entities/users.entity';
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
  readonly name!: string;

  @Column({ nullable: true })
  readonly bio?: string;

  @Column()
  readonly address!: string;

  @Column({ nullable: true })
  readonly website?: string;

  @OneToMany(() => User, (user) => user.company, { cascade: true })
  readonly recruiters!: User[];

  @OneToMany(() => Review, (review) => review.company, { cascade: true })
  readonly reviews!: Review[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
