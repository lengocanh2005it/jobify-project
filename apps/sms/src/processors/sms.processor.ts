import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { SmsService } from 'apps/sms/src/sms.service';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';

@Processor('sms-queue')
export class SmsProcessor extends WorkerHost {
  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly smsService: SmsService,
  ) {
    super();
  }

  async process(
    job: Job<{ from: string; to: string; message: string }>,
  ): Promise<any> {
    console.log(
      `Processing job '${job.name}': Sending message '${job.data.message}' to phone number '${job.data.to}'...`,
    );

    await this.smsService.handleSendSMS(
      job.data.from,
      job.data.to,
      job.data.message,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job '${job.name}' completed.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.pinoLogger.info(`Job '${job.name} failed due to: `, err);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.error(
      `Retrying job '${job.name}', attempt: ${job.attemptsMade + 1}`,
    );
  }
}
