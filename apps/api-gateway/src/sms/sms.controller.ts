import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SmsService } from 'apps/api-gateway/src/sms/sms.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { SendSmsDto } from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('sms')
@UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
@Roles(Role.ADMIN)
@RBAcPermissions('admin@send_message')
@ApiBearerAuth()
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post()
  @ApiOperation({
    summary: 'Send SMS',
    description:
      'This endpoint sends an SMS message to a specified phone number. The user must have a registered phone number.',
  })
  @ApiBody({
    description: 'SMS sending data',
    type: SendSmsDto,
    examples: {
      example1: {
        summary: 'Send a sample SMS',
        value: { to: '+1234567890', message: 'Hello, this is a test message!' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Sent message to phone number successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: {
              type: 'string',
              example:
                "Message 'Hello, this is a test message!' has been sent to phone number '+1234567890'.",
            },
          },
        },
      },
    },
  })
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
