import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject('MESSAGES_SERVICE')
    private readonly rabbitMqMessageClient: ClientProxy,
  ) {}

  public handleDeleteConversation = (user: User, conversationId: string) => {
    return this.rabbitMqMessageClient.send(
      { cmd: 'delete-conversation' },
      {
        user,
        conversationId,
      },
    );
  };
}
