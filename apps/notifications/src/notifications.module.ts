import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Notification,
  UserNotification,
} from 'apps/notifications/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
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
