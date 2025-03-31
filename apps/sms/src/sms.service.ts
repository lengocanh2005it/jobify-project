import { Injectable } from '@nestjs/common';
import { TwilioService } from 'nestjs-twilio';

@Injectable()
export class SmsService {
  constructor(private readonly twilioService: TwilioService) {}

  async handleSendSMS(from: string, to: string, message: string) {
    try {
      const response = await this.twilioService.client.messages.create({
        from,
        to,
        body: message,
      });

      return response;
    } catch (error) {
      console.error(`SMS sending failed: ${error.message}`, error);
      throw new Error('Failed to send SMS');
    }
  }
}
