import { Conversation } from 'apps/messages/src/entities';
import { User } from 'apps/users/src/entities';
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
  content!: string;

  @Column({ nullable: true })
  type!: string;

  @Column({ type: 'text', nullable: true })
  attachment_url?: string;

  @Column({ type: 'boolean', default: false })
  is_read!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @ManyToOne(() => Message, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'replied_message_id' })
  repliedMessage?: Message;

  @ManyToOne(() => User, (user) => user.sent_messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @ManyToOne(() => User, (user) => user.received_messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  readonly deletedAt?: Date;
}
