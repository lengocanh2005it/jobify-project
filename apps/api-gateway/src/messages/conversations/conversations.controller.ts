import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ConversationsService } from 'apps/api-gateway/src/messages/conversations/conversation.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard, PremiumGuard } from 'libs/common/guards';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RoleAuthGuard, PremiumGuard)
@Roles(Role.CANDIDATE, Role.RECRUITER)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Delete(':id')
  @ResponseMessage('Conversation deleted successfully!')
  @ApiOperation({
    summary: 'Delete conversation',
    description: 'Delete an existing conversation by id.',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of conversation',
    example: '0969eecd-0920-49b8-8c6d-f2ae22cabb1c',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'Conversation deleted successfully.',
      },
    },
  })
  async deleteConversation(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    const user = request.user as User;

    return this.conversationsService.handleDeleteConversation(
      user,
      conversationId,
    );
  }
}
