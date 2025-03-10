import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { SearchNotificationsDto } from 'libs/common/dtos';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('NOTIFICATIONS_SERVICE')
    private readonly rabbitMqNotificationClient: ClientProxy,
  ) {}

  public getNotifications = async (
    user: User,
    filters?: SearchNotificationsDto,
  ) => {
    return await lastValueFrom(
      this.rabbitMqNotificationClient.send(
        { cmd: 'get-notifications' },
        {
          user,
          filters,
        },
      ),
    );
  };

  public getNotification = async (notificationId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqNotificationClient.send(
        { cmd: 'get-notification' },
        {
          notificationId,
          user,
        },
      ),
    );
  };

  public deleteNotification = async (notificationId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqNotificationClient.send(
        { cmd: 'delete-notification' },
        {
          notificationId,
          user,
        },
      ),
    );
  };
}
