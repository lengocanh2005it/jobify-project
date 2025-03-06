import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConversationsService } from 'apps/api-gateway/src/messages/conversations/conversation.service';
import { ConversationsController } from 'apps/api-gateway/src/messages/conversations/conversations.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MESSAGES_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'messages_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
