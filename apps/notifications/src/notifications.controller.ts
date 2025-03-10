import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { SearchNotificationsDto } from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { CreateNotificationDto } from 'libs/common/utils';
import { NotificationsService } from './notifications.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('create-notification')
  async handleCreateNotifications(
    @Payload('data') createNotificationDto: CreateNotificationDto,
    @Payload('userIds') userIds: string[],
  ) {
    return this.notificationsService.handleCreateNotifications(
      userIds,
      createNotificationDto,
    );
  }

  @MessagePattern({ cmd: 'get-notifications' })
  async getNotifications(
    @Payload('user') user: User,
    @Payload('filters') filters?: SearchNotificationsDto,
  ) {
    return this.notificationsService.handleGetNotifications(user, filters);
  }

  @MessagePattern({ cmd: 'get-notification' })
  async getNotification(
    @Payload('notificationId') notificationId: string,
    @Payload('user') user: User,
  ) {
    return this.notificationsService.handleGetUserNotification(
      notificationId,
      user,
    );
  }

  @MessagePattern({ cmd: 'delete-notification' })
  async deleteNotification(
    @Payload('notificationId') notificationId: string,
    @Payload('user') user: User,
  ) {
    return this.notificationsService.handleDeleteUserNotification(
      notificationId,
      user,
    );
  }
}
