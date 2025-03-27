import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SmsService } from 'apps/api-gateway/src/sms/sms.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { SendSmsDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('sms')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@Roles(Role.ADMIN)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post()
  @ResponseMessage('Sent message to phone number successfully.')
  async sendSms(@Body() { to, message }: SendSmsDto, @Req() request: Request) {
    const user = request.user as User;

    if (!user.phone_number)
      throw new BadRequestException(
        `Phone number of user '${user.full_name}' not found.`,
      );

    await this.smsService.sendSms(user.phone_number, to, message);

    return {
      success: `Message '${message}' has been sent to phone number '${to}'.`,
    };
  }
}
