import { Conversation } from 'apps/messages/src/entities/conversations.entity';
import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'message' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string;

  @Column({ type: 'text', nullable: true })
  readonly content!: string;

  @Column({ nullable: true })
  readonly type!: string;

  @Column({ type: 'text', nullable: true })
  readonly attachment_url?: string;

  @Column({ type: 'boolean', default: false })
  readonly is_read!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readonly read_at?: Date;

  @ManyToOne(() => Message, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'replied_message_id' })
  readonly repliedMessage?: Message;

  @ManyToOne(() => User, (user) => user.sent_messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  readonly sender!: User;

  @ManyToOne(() => User, (user) => user.received_messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'receiver_id' })
  readonly receiver!: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  readonly conversation!: Conversation;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  readonly deletedAt?: Date;
}
