import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from 'apps/api-gateway/src/notifications/notifications.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { SearchNotificationsDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ResponseMessage('Notifications fetched successfully!')
  async getNotifications(
    @Req() request: Request,
    @Query() filters?: SearchNotificationsDto,
  ) {
    const user = request.user as User;

    return this.notificationsService.getNotifications(user, filters);
  }

  @Get(':id')
  @ResponseMessage('Notification details fetched successfully!')
  getNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.notificationsService.getNotification(id, user);
  }

  @Delete(':id')
  @ResponseMessage('Notification deleted successfully!')
  deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.notificationsService.deleteNotification(id, user);
  }
}
