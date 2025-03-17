import { Module } from '@nestjs/common';
import { NotificationsController } from 'apps/api-gateway/src/notifications/notifications.controller';
import { NotificationsService } from 'apps/api-gateway/src/notifications/notifications.service';

@Module({
  providers: [NotificationsService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
