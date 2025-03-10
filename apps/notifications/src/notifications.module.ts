import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'apps/notifications/src/entities';
import { UserNotification } from 'apps/notifications/src/entities';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
    ]),
    CommonModule,
    TypeOrmModule.forFeature([Notification, UserNotification]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Notifications Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class NotificationsModule {}
