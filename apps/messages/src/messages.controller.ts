import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateMessagesDto } from 'libs/common/dtos/create-messages.dto';
import { SearchMessagesDto } from 'libs/common/dtos/search-messages.dto';
import { UpdateMessageDto } from 'libs/common/dtos/update-message.dto';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @MessagePattern({ cmd: 'create-message' })
  async createMessage(
    @Payload('user') user: User,
    @Payload('createMessagesDto') createMessagesDto: CreateMessagesDto,
    @Payload('file') file?: Express.Multer.File,
  ) {
    return this.messagesService.handleCreateMessage(
      user,
      createMessagesDto,
      file,
    );
  }

  @MessagePattern({ cmd: 'get-messages' })
  async getMessages(@Payload() user: User) {
    return this.messagesService.handleGetMessages(user);
  }

  @MessagePattern({ cmd: 'get-messages-conversation' })
  async getMessagesOfConversation(
    @Payload('user') user: User,
    @Payload('otherUserId') otherUserId: string,
    @Payload('searchMessagesDto') searchMessagesDto?: SearchMessagesDto,
  ) {
    return this.messagesService.handleGetMessageOfConversation(
      otherUserId,
      user,
      searchMessagesDto,
    );
  }

  @MessagePattern({ cmd: 'delete-conversation' })
  async deleteConversation(
    @Payload('user') user: User,
    @Payload('conversationId') conversationId: string,
  ) {
    return this.messagesService.handleDeleteConversation(user, conversationId);
  }

  @MessagePattern({ cmd: 'update-message' })
  async handleUpdateMessage(
    @Payload('user') user: User,
    @Payload('messageId') messageId: string,
    @Payload('conversationId') conversationId: string,
    @Payload('updateMessageDto') updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.handleUpdateMessage(
      user,
      messageId,
      conversationId,
      updateMessageDto,
    );
  }

  @MessagePattern({ cmd: 'delete-message' })
  async handleDeleteMessage(
    @Payload('user') user: User,
    @Payload('messageId') messageId: string,
  ) {
    return this.messagesService.handleDeleteMessage(user, messageId);
  }
}
