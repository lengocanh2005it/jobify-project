import { CacheInterceptor } from '@nestjs/cache-manager';
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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
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
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ResponseMessage('New message created successfully!')
  @ApiOperation({
    summary: 'Create new message',
    description: 'Create a new message with some data.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: 'Hello World!',
          description: 'Content of the message.',
        },
        replied_message_id: {
          type: 'string',
          nullable: true,
          example: 'c',
          description: 'Parent message to replied',
        },
        receiver_id: {
          type: 'string',
          example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          description: 'Receiver id that message to sent.',
        },
        file: {
          nullable: true,
          type: 'string',
          format: 'binary',
          description: 'File (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        content: 'Hello World!',
        is_read: false,
        read_at: null,
        type: 'text',
        attachment_url: null,
        repliedMessage: null,
        receiver: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          email: 'john01@gmail.com',
          full_name: 'John Doe',
          phone_number: '+424244234234',
        },
        conversation: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          conversation_name: null,
          participants: [
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              full_name: 'John Doe',
              email: 'john01@gmail.com',
            },
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              full_name: 'Luke Coleman',
              email: 'john01@gmail.com',
            },
          ],
          messages: [
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              content: 'Hello World!',
              is_read: false,
              read_at: null,
              type: 'text',
              attachment_url: null,
              repliedMessage: null,
              receiver: {
                id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
                email: 'john01@gmail.com',
                full_name: 'John Doe',
                phone_number: '+424244234234',
                roe: {
                  name: 'candidate',
                },
              },
              sender: {
                id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
                email: 'john01@gmail.com',
                full_name: 'John Doe',
                phone_number: '+424244234234',
                roe: {
                  name: 'recruiter',
                },
              },
            },
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              content: 'Hello World!',
              is_read: false,
              read_at: null,
              type: 'text',
              attachment_url: null,
              repliedMessage: null,
              receiver: {
                id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
                email: 'john01@gmail.com',
                full_name: 'John Doe',
                phone_number: '+424244234234',
                roe: {
                  name: 'candidate',
                },
              },
              sender: {
                id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
                email: 'john01@gmail.com',
                full_name: 'John Doe',
                phone_number: '+424244234234',
                roe: {
                  name: 'recruiter',
                },
              },
            },
          ],
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get all messages from all conversations.',
    description: 'All messages retrieved successfully.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          content: 'Hello World!',
          is_read: false,
          read_at: null,
          type: 'text',
          attachment_url: null,
          repliedMessage: null,
          receiver: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            email: 'john01@gmail.com',
            full_name: 'John Doe',
            phone_number: '+424244234234',
            roe: {
              name: 'candidate',
            },
          },
          sender: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            email: 'john01@gmail.com',
            full_name: 'John Doe',
            phone_number: '+424244234234',
            roe: {
              name: 'recruiter',
            },
          },
        },
      ],
    },
  })
  @ResponseMessage('Messages fetched successfully!')
  @UseInterceptors(CacheInterceptor)
  async getMessages(@Req() request: Request) {
    const user = request.user as User;

    return this.messagesService.handleGetMessages(user);
  }

  @Get('/users/:otherUserId')
  @ResponseMessage(
    'Messages in the conversation with the user have been retrieved successfully!',
  )
  @ApiOperation({
    summary: 'Get all messages of current user wih other user.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
        content: 'Hello World!',
        is_read: false,
        read_at: null,
        type: 'text',
        attachment_url: null,
        repliedMessage: null,
        receiver: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          email: 'john01@gmail.com',
          full_name: 'John Doe',
          phone_number: '+424244234234',
          roe: {
            name: 'candidate',
          },
        },
        conversation: {
          id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
          conversation_name: null,
          participants: [
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              full_name: 'John Doe',
              email: 'john01@gmail.com',
            },
            {
              id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
              full_name: 'Luke Coleman',
              email: 'john01@gmail.com',
            },
          ],
          sender: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            email: 'john01@gmail.com',
            full_name: 'John Doe',
            phone_number: '+424244234234',
            roe: {
              name: 'recruiter',
            },
          },
          conversation: {
            id: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
            conversation_name: null,
          },
        },
      },
    },
  })
  @ApiParam({
    name: 'otherUserId',
    description: 'The other User id that you want to send message',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
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
  @ApiOperation({
    summary: 'Update message',
    description: 'Update an existing message with some given data.',
  })
  @ApiBody({
    type: UpdateMessageDto,
    description: 'Some given data to update message',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of the message',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiParam({
    name: 'conversationId',
    description: 'The conversation id that this message belongs to.',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    description: 'Data of the message after updating.',
  })
  @ApiBadRequestResponse({
    description: 'You can only update the message text.',
  })
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
  @ApiOperation({
    summary: 'Delete message',
    description: 'Delete an existing message by id.',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of the message that you want to delete.',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    description: 'Data after deleting the message.',
    schema: {
      example: {
        message: 'Message deleted successfully.',
      },
    },
  })
  async deleteMessage(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) messageId: string,
  ) {
    const user = request.user as User;

    return this.messagesService.handleDeleteMessage(user, messageId);
  }
}
