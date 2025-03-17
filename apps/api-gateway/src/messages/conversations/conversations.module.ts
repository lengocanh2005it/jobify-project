import { Module } from '@nestjs/common';
import { ConversationsService } from 'apps/api-gateway/src/messages/conversations/conversation.service';
import { ConversationsController } from 'apps/api-gateway/src/messages/conversations/conversations.controller';

@Module({
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
