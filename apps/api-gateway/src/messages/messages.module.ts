import { Module } from '@nestjs/common';
import { MessagesController } from 'apps/api-gateway/src/messages/messages.controller';
import { MessagesService } from 'apps/api-gateway/src/messages/messages.service';

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
