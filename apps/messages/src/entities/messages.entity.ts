import { User } from 'apps/users/src/entities/users.entity';
import {
  Column,
  CreateDateColumn,
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

  @Column({ type: 'text' })
  readonly content!: string;

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

  @ManyToOne(() => Message, (message) => message.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  readonly parent?: Message;

  readonly replies?: Message[];

  @CreateDateColumn({ type: 'timestamp' })
  readonly createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  readonly updatedAt!: Date;
}
