import { UserNotification } from 'apps/notifications/src/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notification' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column()
  type!: string;

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.notification,
    { cascade: true },
  )
  userNotifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
