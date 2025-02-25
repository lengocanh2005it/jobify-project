import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'apps/users/src/entities/roles.entity';
import { User } from 'apps/users/src/entities/users.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Notification } from 'apps/notifications/src/entities/notifications.entity';

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
    ]),
    CommonModule,
    TypeOrmModule.forFeature([User, Role, Notification]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
