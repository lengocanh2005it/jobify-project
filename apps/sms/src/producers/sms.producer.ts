import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BULLMQ_RETRY_DELAY, BULLMQ_RETRY_LIMIT } from 'libs/common/constants';

@Injectable()
export class SmsProducer {
  constructor(@InjectQueue('sms-queue') private readonly smsQueue: Queue) {}

  public handleSendSMS = async (from: string, to: string, message: string) => {
    await this.smsQueue.add(
      'send-sms',
      { from, to, message },
      {
        attempts: BULLMQ_RETRY_LIMIT,
        backoff: { type: 'exponential', delay: BULLMQ_RETRY_DELAY },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  };
}
