import { User } from 'apps/users/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role, { cascade: true })
  users!: User[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
