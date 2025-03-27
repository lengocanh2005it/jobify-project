import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  constructor(
    @Inject('SMS_SERVICE') private readonly rabbitMqSmsClient: ClientProxy,
  ) {}

  public sendSms = async (from: string, to: string, message: string) => {
    return lastValueFrom<void>(
      this.rabbitMqSmsClient.emit(
        { cmd: 'send-sms' },
        {
          from,
          to,
          message,
        },
      ),
    );
  };
}
