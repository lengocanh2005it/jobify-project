import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateNotificationDto } from 'libs/common/utils/types';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern('create-candidate-notification')
  async handleCreateNotifications(
    @Payload('data') createNotificationDto: CreateNotificationDto,
    @Payload('candidateIds') candidateIds: string[],
  ) {
    await this.notificationsService.handleCreateCandidateNotifications(
      candidateIds,
      createNotificationDto,
    );
  }
}
