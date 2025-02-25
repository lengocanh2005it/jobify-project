import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateNotificationDto } from 'libs/common/utils/types';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('create-notification')
  async handleCreateNotifications(
    @Payload('data') createNotificationDto: CreateNotificationDto,
    @Payload('userIds') userIds: string[],
  ) {
    await this.notificationsService.handleCreateNotifications(
      userIds,
      createNotificationDto,
    );
  }
}
