import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from 'apps/api-gateway/src/messages/messages.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateMessagesDto,
  SearchMessagesDto,
  UpdateMessageDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard, PremiumGuard } from 'libs/common/guards';

@Controller('messages')
@UseGuards(JwtAuthGuard, RoleAuthGuard, PremiumGuard)
@Roles(Role.CANDIDATE, Role.RECRUITER)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ResponseMessage('New message created successfully!')
  @UseInterceptors(FileInterceptor('file'))
  async createMessage(
    @Req() request: Request,
    @Body() createMessageDto: CreateMessagesDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = request.user as User;

    return this.messagesService.handleCreateMessage(
      user,
      createMessageDto,
      file,
    );
  }

  @Get()
  @ResponseMessage('Messages fetched successfully!')
  async getMessages(@Req() request: Request) {
    const user = request.user as User;

    return this.messagesService.handleGetMessages(user);
  }

  @Get('/users/:otherUserId')
  @ResponseMessage(
    'Messages in the conversation with the user have been retrieved successfully!',
  )
  async getMessagesOfConversation(
    @Req() request: Request,
    @Param('otherUserId', ParseUUIDPipe) otherUserId: string,
    @Query() searchMessagesDto?: SearchMessagesDto,
  ) {
    const user = request.user as User;

    return this.messagesService.handleGetMessagesOfConversation(
      otherUserId,
      user,
      searchMessagesDto,
    );
  }

  @Patch(':id/conversations/:conversationId')
  @ResponseMessage('Message updated successfully!')
  async updateMessage(
    @Req() request: Request,
    @Body() updateMessageDto: UpdateMessageDto,
    @Param('id', ParseUUIDPipe) messageId: string,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    const user = request.user as User;

    return this.messagesService.handleUpdateMessage(
      user,
      conversationId,
      messageId,
      updateMessageDto,
    );
  }

  @Delete(':id')
  @ResponseMessage('Message deleted successfully!')
  async deleteMessage(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) messageId: string,
  ) {
    const user = request.user as User;

    return this.messagesService.handleDeleteMessage(user, messageId);
  }
}
