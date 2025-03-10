import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { EmailsService } from './emails.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @EventPattern('send-email')
  async handleSendEmail(
    @Payload('email') email: string,
    @Payload('type') type: string,
  ) {
    return await this.emailsService.handleSendEmail(email, type);
  }
}
