import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ConversationsService {
  constructor(
    @Inject('MESSAGES_SERVICE')
    private readonly rabbitMqMessageClient: ClientProxy,
  ) {}

  public handleDeleteConversation = async (
    user: User,
    conversationId: string,
  ) => {
    return await lastValueFrom(
      this.rabbitMqMessageClient.send(
        { cmd: 'delete-conversation' },
        {
          user,
          conversationId,
        },
      ),
    );
  };
}
