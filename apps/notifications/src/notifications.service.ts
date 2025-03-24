import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Application } from 'apps/applications/src/entities';
import {
  Notification,
  UserNotification,
} from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
import { ElasticIndexes, NotificationTypes } from 'libs/common/constants';
import { SearchNotificationsDto } from 'libs/common/dtos';
import { TransactionsProvider } from 'libs/common/providers';
import {
  CreateNotificationDto,
  generateRpcExceptionResponse,
} from 'libs/common/utils';
import { omit } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    private readonly transactionsProvider: TransactionsProvider,
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async onModuleInit() {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userNotificationsRepository =
        queryRunner.manager.getRepository(UserNotification);

      return this.handleSyncNotificationsToElasticsearch(
        userNotificationsRepository,
      );
    });
  }

  public handleCreateNotifications = async (
    userIds: string[],
    data: CreateNotificationDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const notificationRepository =
        queryRunner.manager.getRepository(Notification);

      const userNotificationRepository =
        queryRunner.manager.getRepository(UserNotification);

      const { metadata, ...res } = data;

      let notification = await notificationRepository.findOneBy({
        title: res.title,
      });

      if (!notification) {
        notification = await notificationRepository.save(
          notificationRepository.create(res),
        );
      }

      const users = await Promise.all(
        userIds.map(
          async (userId) =>
            await lastValueFrom<User | undefined>(
              this.rabbitMqUserClient.send({ cmd: 'get-profile' }, { userId }),
            ),
        ),
      );

      const validUsers = users.filter(
        (user): user is User => user !== undefined,
      );

      const userNotifications = validUsers.map((user) => ({
        user: { id: user.id },
        notification: { id: notification.id },
      }));

      const savedUserNotifications =
        await userNotificationRepository.save(userNotifications);

      if (metadata?.jobId) {
        await userNotificationRepository
          .createQueryBuilder()
          .relation(UserNotification, 'job')
          .of(savedUserNotifications.map((un) => un.id))
          .set(metadata.jobId);
      }

      if (metadata && (metadata?.applications as Application[])?.length) {
        const applications = metadata.applications as Application[];

        const appNotifications = validUsers.map((user) => {
          const application = applications.find(
            (app) => app.candidate.id === user.id,
          );

          if (!application) {
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.NOT_FOUND,
                `No application matched for user id: '${user.id}'`,
              ),
            );
          }

          return {
            user: { id: user.id },
            notification: { id: notification.id },
            application: { id: application.id },
          };
        });

        await userNotificationRepository.save(appNotifications);
      }

      if (metadata && metadata?.interviewId) {
        await userNotificationRepository
          .createQueryBuilder()
          .relation(UserNotification, 'interview')
          .of(savedUserNotifications.map((un) => un.id))
          .set(metadata.interviewId);
      }

      if (metadata && metadata?.conversationId) {
        await userNotificationRepository
          .createQueryBuilder()
          .relation(UserNotification, 'conversation')
          .of(savedUserNotifications.map((un) => un.id))
          .set(metadata.conversationId);
      }
    });
  };

  public handleGetNotifications = async (
    user: User,
    filters?: SearchNotificationsDto,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      try {
        const userNotificationRepository =
          queryRunner.manager.getRepository(UserNotification);

        const query = userNotificationRepository
          .createQueryBuilder('user-notification')
          .leftJoinAndSelect('user-notification.user', 'user')
          .leftJoinAndSelect('user-notification.job', 'job')
          .leftJoinAndSelect('user-notification.application', 'application')
          .leftJoinAndSelect('user-notification.interview', 'interview')
          .leftJoinAndSelect('user-notification.notification', 'notification')
          .andWhere('user.id = :id', { id: user.id })
          .select([
            'user-notification',
            'notification.id',
            'notification.title',
            'notification.message',
            'notification.type',
            'job',
            'application.id',
            'application.resume_link',
            'application.cover_letter_link',
            'application.applied_at',
            'interview',
          ]);

        if (filters?.title) {
          query.andWhere('LOWER(notification.title) LIKE LOWER(:title)', {
            title: filters.title,
          });
        }

        if (filters?.type) {
          query.andWhere('notification.type = :type', {
            type: filters.type,
          });
        }

        if (filters?.is_read) {
          query.andWhere('user-notification.is_read = :is_read', {
            is_read: filters.is_read,
          });
        }

        if (filters?.createdAfter) {
          const createdAfterDate = new Date(
            `${filters.createdAfter}T00:00:00.000Z`,
          );

          query.andWhere('user-notification.createdAt >= :createdAfter', {
            createdAfter: createdAfterDate,
          });
        }

        if (filters?.createdBefore) {
          const createdBeforeDate = new Date(
            `${filters.createdBefore}T00:00:00.000Z`,
          );

          query.andWhere('user-notification.createdAt >= :createdBefore', {
            createdBefore: createdBeforeDate,
          });
        }

        return (await query.getMany()).map((userNotification) =>
          userNotification.notification.title ===
          NotificationTypes.RECOMMENDED_JOB.title
            ? omit(userNotification, ['user', 'application'])
            : omit(userNotification, ['user', 'job']),
        );
      } catch (error) {
        if (error?.meta?.statusCode === 404) return [];
        console.error('Elasticsearch search error: ', error);
        throw error;
      }
    });
  };

  public handleGetUserNotification = async (
    userNotificationId: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userNotificationRepository =
        queryRunner.manager.getRepository(UserNotification);

      const userNotification = await userNotificationRepository.findOne({
        where: { id: userNotificationId },
        relations: ['user', 'notification', 'job', 'interview', 'application'],
      });

      if (!userNotification)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Notification with id: '${userNotificationId}' not found.`,
          ),
        );

      if (userNotification.user.id !== user.id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            `You can only get the notification that belongs to you.`,
          ),
        );

      return userNotification.notification.title !==
        NotificationTypes.RECOMMENDED_JOB.title
        ? omit(userNotification, ['user', 'job'])
        : omit(userNotification, ['user']);
    });
  };

  public handleDeleteUserNotification = async (
    userNotificationId: string,
    user: User,
  ) => {
    return this.transactionsProvider.executeTransaction(async (queryRunner) => {
      const userNotificationRepository =
        queryRunner.manager.getRepository(UserNotification);

      const notification = await userNotificationRepository.findOne({
        where: { id: userNotificationId },
        relations: ['user'],
      });

      if (!notification)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.NOT_FOUND,
            `Notification with id: '${userNotificationId}' not found.`,
          ),
        );

      if (notification.user.id !== user.id)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.FORBIDDEN,
            'You can only delete the notification that belongs to you.',
          ),
        );

      await userNotificationRepository.delete({
        id: userNotificationId,
      });

      await this.elasticsearchService.delete({
        index: ElasticIndexes.NOTIFICATIONS,
        id: userNotificationId,
      });

      return {
        success: 'Notification deleted successfully!',
      };
    });
  };

  private handleSyncNotificationsToElasticsearch = async (
    userNotificationRepository: Repository<UserNotification>,
  ) => {
    const userNotifications = await userNotificationRepository
      .createQueryBuilder('user-notification')
      .leftJoinAndSelect('user-notification.user', 'user')
      .leftJoinAndSelect('user-notification.job', 'job')
      .leftJoinAndSelect('user-notification.application', 'application')
      .leftJoinAndSelect('user-notification.interview', 'interview')
      .leftJoinAndSelect('user-notification.notification', 'notification')
      .select([
        'user-notification',
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.type',
        'job',
        'application.id',
        'application.resume_link',
        'application.cover_letter_link',
        'application.applied_at',
        'interview',
      ])
      .orderBy('user-notification.createdAt', 'DESC')
      .getMany();

    const bulkBody = userNotifications.flatMap((userNotification) => [
      {
        index: {
          _index: ElasticIndexes.NOTIFICATIONS,
          _id: userNotification.id,
        },
      },
      userNotification,
    ]);

    if (bulkBody.length > 0) {
      await this.elasticsearchService.bulk({
        index: ElasticIndexes.NOTIFICATIONS,
        body: bulkBody,
      });
    }
  };
}
