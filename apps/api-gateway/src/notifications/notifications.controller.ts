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
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { SearchNotificationsDto } from 'libs/common/dtos/search-notifications.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ResponseMessage('Notifications fetched successfully!')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getNotifications(
    @Req() request: Request,
    @Query() filters?: SearchNotificationsDto,
  ) {
    const user = request.user as User;

    return this.notificationsService.getNotifications(user, filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Notification details fetched successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.notificationsService.getNotification(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Notification deleted successfully!')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.notificationsService.deleteNotification(id, user);
  }
}
