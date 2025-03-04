import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { SearchNotificationsDto } from 'libs/common/dtos/search-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
  ) {}

  public getNotifications = (user: User, filters?: SearchNotificationsDto) => {
    return this.rabbitMqNotificationClient.send(
      { cmd: 'get-notifications' },
      {
        user,
        filters,
      },
    );
  };

  public getNotification = (notificationId: string, user: User) => {
    return this.rabbitMqNotificationClient.send(
      { cmd: 'get-notification' },
      {
        notificationId,
        user,
      },
    );
  };

  public deleteNotification = (notificationId: string, user: User) => {
    return this.rabbitMqNotificationClient.send(
      { cmd: 'delete-notification' },
      {
        notificationId,
        user,
      },
    );
  };
}
