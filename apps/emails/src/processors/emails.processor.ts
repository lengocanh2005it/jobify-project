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
    job: Job<{ email: string; type: EmailType; extraData?: any }>,
    token?: string,
  ): Promise<any> {
    console.log(
      `Processing job '${job.name}': Sending email to '${job.data.email}'...`,
    );

    if (!job.data.type) {
      console.error('There is an error from the system.');
      return;
    }

    return this.emailsService.handleSendEmail(
      job.data.email,
      job.data.type,
      job.data?.extraData,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job '${job.name}' completed.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job '${job.name} failed due to: `, err);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.error(
      `Retrying job '${job.name}', attempt: ${job.attemptsMade + 1}`,
    );
  }
}
