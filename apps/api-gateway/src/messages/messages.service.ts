import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateMessagesDto } from 'libs/common/dtos/create-messages.dto';
import { SearchMessagesDto } from 'libs/common/dtos/search-messages.dto';
import { UpdateMessageDto } from 'libs/common/dtos/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('MESSAGES_SERVICE')
    private readonly rabbitMqMessageClient: ClientProxy,
  ) {}

  public handleCreateMessage = (
    user: User,
    createMessagesDto: CreateMessagesDto,
    file?: Express.Multer.File,
  ) => {
    return this.rabbitMqMessageClient.send(
      { cmd: 'create-message' },
      {
        user,
        createMessagesDto,
        file,
      },
    );
  };

  public handleGetMessages = (user: User) => {
    return this.rabbitMqMessageClient.send({ cmd: 'get-messages' }, user);
  };

  public handleGetMessagesOfConversation = (
    otherUserId: string,
    user: User,
    searchMessagesDto?: SearchMessagesDto,
  ) => {
    return this.rabbitMqMessageClient.send(
      { cmd: 'get-messages-conversation' },
      { user, otherUserId, searchMessagesDto },
    );
  };

  public handleUpdateMessage = (
    user: User,
    conversationId: string,
    messageId: string,
    updateMessageDto: UpdateMessageDto,
  ) => {
    return this.rabbitMqMessageClient.send(
      { cmd: 'update-message' },
      {
        user,
        conversationId,
        updateMessageDto,
        messageId,
      },
    );
  };

  public handleDeleteMessage = (user: User, messageId: string) => {
    return this.rabbitMqMessageClient.send(
      { cmd: 'delete-message' },
      {
        user,
        messageId,
      },
    );
  };
}
