import { Message } from 'apps/messages/src/entities/messages.entity';
import { UserNotification } from 'apps/notifications/src/entities/user-notification.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'conversation' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'text', nullable: true })
  readonly conversation_name?: string;

  @ManyToMany(() => User, (user) => user.conversations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinTable({
    name: 'user_conversation',
    joinColumn: {
      name: 'conversation_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  readonly participants!: User[];

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  readonly messages!: Message[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.conversation,
    {
      cascade: true,
      orphanedRowAction: 'delete',
    },
  )
  readonly messages_notifications!: UserNotification[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  readonly deletedAt?: Date;
}
