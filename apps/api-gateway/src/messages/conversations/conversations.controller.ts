import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from 'apps/api-gateway/src/messages/conversations/conversation.service';
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { PremiumGuard } from 'libs/common/guards/premium.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RoleAuthGuard, PremiumGuard)
@Roles(Role.CANDIDATE, Role.RECRUITER)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Delete(':id')
  @ResponseMessage('Conversation deleted successfully!')
  deleteConversation(
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
