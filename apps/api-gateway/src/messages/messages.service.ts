import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import {
  CreateMessagesDto,
  SearchMessagesDto,
  UpdateMessageDto,
} from 'libs/common/dtos';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('MESSAGES_SERVICE')
    private readonly rabbitMqMessageClient: ClientProxy,
  ) {}

  public handleCreateMessage = async (
    user: User,
    createMessagesDto: CreateMessagesDto,
    file?: Express.Multer.File,
  ) => {
    return await lastValueFrom(
      this.rabbitMqMessageClient.send(
        { cmd: 'create-message' },
        {
          user,
          createMessagesDto,
          file,
        },
      ),
    );
  };

  public handleGetMessages = async (user: User) => {
    return await lastValueFrom(
      this.rabbitMqMessageClient.send({ cmd: 'get-messages' }, user),
    );
  };

  public handleGetMessagesOfConversation = async (
    otherUserId: string,
    user: User,
    searchMessagesDto?: SearchMessagesDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqMessageClient.send(
        { cmd: 'get-messages-conversation' },
        { user, otherUserId, searchMessagesDto },
      ),
    );
  };

  public handleUpdateMessage = async (
    user: User,
    conversationId: string,
    messageId: string,
    updateMessageDto: UpdateMessageDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqMessageClient.send(
        { cmd: 'update-message' },
        {
          user,
          conversationId,
          updateMessageDto,
          messageId,
        },
      ),
    );
  };

  public handleDeleteMessage = async (user: User, messageId: string) => {
    return await lastValueFrom(
      this.rabbitMqMessageClient.send(
        { cmd: 'delete-message' },
        {
          user,
          messageId,
        },
      ),
    );
  };
}
