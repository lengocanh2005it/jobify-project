import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'apps/notifications/src/entities';
import { Role } from 'apps/users/src/entities';
import { Skill } from 'apps/users/src/entities';
import { User } from 'apps/users/src/entities';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Module({
  imports: [
    ClientsModule.register([
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
        name: 'EMAILS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'emails_queue',
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
        name: 'APPLICATIONS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'applications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    CommonModule,
    TypeOrmModule.forFeature([User, Role, Notification, Skill]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Users Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class UsersModule {}
