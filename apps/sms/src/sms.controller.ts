import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SmsProducer } from 'apps/sms/src/producers';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class SmsController {
  constructor(private readonly smsProducer: SmsProducer) {}

  @EventPattern('send-sms')
  async handleSendSms(
    @Payload('from') from: string,
    @Payload('to') to: string,
    @Payload('message') message: string,
  ) {
    return this.smsProducer.handleSendSMS(from, to, message);
  }
}
