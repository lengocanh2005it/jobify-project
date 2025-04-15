import { Permission, User } from 'apps/users/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role, { cascade: true })
  users!: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  permissions!: Permission[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
