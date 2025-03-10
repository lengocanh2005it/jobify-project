import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { CommonModule } from '@app/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'apps/messages/src/entities';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Conversation } from 'apps/messages/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'users_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'UPLOADS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'uploads_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'NOTIFICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'notifications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'JOBS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'jobs_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    CommonModule,
    TypeOrmModule.forFeature([Message, Conversation]),
  ],
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
