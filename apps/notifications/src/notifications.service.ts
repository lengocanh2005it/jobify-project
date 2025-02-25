import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'apps/notifications/src/entities/notifications.entity';
import { UserNotification } from 'apps/notifications/src/entities/user-notification.entity';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateNotificationDto } from 'libs/common/utils/types';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UserNotification)
    private readonly userNotification: Repository<UserNotification>,
  ) {}

  public handleCreateCandidateNotifications = async (
    candidateIds: string[],
    data: CreateNotificationDto,
  ) => {
    try {
      for (const candidateId of candidateIds) {
        const candidate = await lastValueFrom<User | undefined>(
          this.rabbitMqUserClient.send(
            { cmd: 'get-profile' },
            { userId: candidateId },
          ),
        );

        if (!candidate)
          throw new RpcException(
            `Candidate With ID: '${candidateId}' Not Found.`,
          );

        const { title } = data;

        let newNotification = await this.notificationRepository.findOneBy({
          title,
        });

        if (!newNotification) {
          newNotification = this.notificationRepository.create(data);

          await this.notificationRepository.save(newNotification);
        }

        const newUserNotification = this.userNotification.create({
          user: { id: candidateId },
          notification: { id: newNotification.id },
        });

        await this.userNotification.save(newUserNotification);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
