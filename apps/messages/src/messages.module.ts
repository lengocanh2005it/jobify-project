import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation, Message } from 'apps/messages/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Message, Conversation])],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Messages Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class MessagesModule {}
