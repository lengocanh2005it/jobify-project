import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EmailsService } from 'apps/emails/src/emails.service';
import { Job } from 'bullmq';
import { EmailType } from 'libs/common/constants';

@Processor('emails-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailsService: EmailsService) {
    super();
  }

  async process(
    job: Job<{ email: string; type: EmailType }>,
    token?: string,
  ): Promise<any> {
    console.log(
      `Processing job '${job.id}': Sending email to '${job.data.email}'`,
    );
    return this.emailsService.handleSendEmail(job.data.email, job.data.type);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job with id: '${job.id}' completed.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job with id: '${job.id} failed due to: `, err);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.error(
      `Retrying job with id: '${job.id}', attempt: ${job.attemptsMade + 1}`,
    );
  }
}
