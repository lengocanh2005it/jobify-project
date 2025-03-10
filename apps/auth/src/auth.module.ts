import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'apps/notifications/src/entities';
import { Role, Skill, User } from 'apps/users/src/entities';
import { UsersModule } from 'apps/users/src/users.module';
import { UsersService } from 'apps/users/src/users.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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
        name: 'REDIS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'redis_queue',
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
    TypeOrmModule.forFeature([User, Role, Notification, Skill]),
    UsersModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Auth Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class AuthModule {}
