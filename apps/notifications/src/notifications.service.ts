import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Application } from 'apps/applications/src/entities';
import {
  Notification,
  UserNotification,
} from 'apps/notifications/src/entities';
import { User } from 'apps/users/src/entities';
import { NotificationTypes } from 'libs/common/constants';
import { SearchNotificationsDto } from 'libs/common/dtos';
import {
  CreateNotificationDto,
  generateRpcExceptionResponse,
} from 'libs/common/utils';
import { omit } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @InjectRepository(UserNotification)
    private readonly userNotificationRepository: Repository<UserNotification>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  public handleCreateNotifications = async (
    userIds: string[],
    data: CreateNotificationDto,
  ) => {
    const { metadata, ...res } = data;

    let notification = await this.notificationRepository.findOneBy({
      title: res.title,
    });

    if (!notification) {
      notification = await this.notificationRepository.save(
        this.notificationRepository.create(res),
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

    const validUsers = users.filter((user): user is User => user !== undefined);

    const userNotifications = validUsers.map((user) => ({
      user: { id: user.id },
      notification: { id: notification.id },
    }));

    const savedUserNotifications =
      await this.userNotificationRepository.save(userNotifications);

    if (metadata?.jobId) {
      await this.dataSource
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

      await this.userNotificationRepository.save(appNotifications);
    }

    if (metadata && metadata?.interviewId) {
      await this.dataSource
        .createQueryBuilder()
        .relation(UserNotification, 'interview')
        .of(savedUserNotifications.map((un) => un.id))
        .set(metadata.interviewId);
    }

    if (metadata && metadata?.conversationId) {
      await this.dataSource
        .createQueryBuilder()
        .relation(UserNotification, 'conversation')
        .of(savedUserNotifications.map((un) => un.id))
        .set(metadata.conversationId);
    }
  };

  public handleGetNotifications = async (
    user: User,
    filters?: SearchNotificationsDto,
  ) => {
    const query = this.userNotificationRepository
      .createQueryBuilder('user-notification')
      .leftJoinAndSelect('user-notification.user', 'user')
      .leftJoinAndSelect('user-notification.job', 'job')
      .leftJoinAndSelect('user-notification.application', 'application')
      .leftJoinAndSelect('user-notification.interview', 'interview')
      .leftJoinAndSelect('user-notification.notification', 'notification')
      .andWhere('user.id = :id', { id: user.id })
      .select([
        'user-notification',
        'notification',
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
  };

  public handleGetUserNotification = async (
    userNotificationId: string,
    user: User,
  ) => {
    const userNotification = await this.userNotificationRepository.findOne({
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
  };

  public handleDeleteUserNotification = async (
    userNotificationId: string,
    user: User,
  ) => {
    const notification = await this.userNotificationRepository.findOne({
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

    await this.userNotificationRepository.delete({
      id: userNotificationId,
    });

    return {
      success: 'Notification deleted successfully!',
    };
  };
}
