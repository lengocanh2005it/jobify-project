import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'apps/users/src/entities/roles.entity';
import { User } from 'apps/users/src/entities/users.entity';
import { UsersModule } from 'apps/users/src/users.module';
import { UsersService } from 'apps/users/src/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Notification } from 'apps/notifications/src/entities/notifications.entity';
import { Skill } from 'apps/users/src/entities/skills.entity';

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
    ]),
    TypeOrmModule.forFeature([User, Role, Notification, Skill]),
    UsersModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
