import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailsProducer } from 'apps/emails/src/emails.producer';
import { EmailType } from 'libs/common/constants';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class EmailsController {
  constructor(private readonly emailsProducer: EmailsProducer) {}

  @EventPattern('send-email')
  async handleSendEmail(
    @Payload('email') email: string,
    @Payload('type') type: EmailType,
  ) {
    return this.emailsProducer.sendEmail(email, type);
  }
}
