import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  BULLMQ_RETRY_DELAY,
  BULLMQ_RETRY_LIMIT,
  EmailType,
} from 'libs/common/constants';

@Injectable()
export class EmailsProducer {
  constructor(
    @InjectQueue('emails-queue') private readonly emailsQueue: Queue,
  ) {}

  async sendEmail(email: string, type: EmailType) {
    await this.emailsQueue.add(
      'send-email',
      { email, type },
      {
        attempts: BULLMQ_RETRY_LIMIT,
        backoff: { type: 'exponential', delay: BULLMQ_RETRY_DELAY },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
