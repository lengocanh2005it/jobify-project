import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ReportsService } from 'apps/reports/src/reports.service';
import { Job } from 'bullmq';
import { generateRpcExceptionResponse } from 'libs/common/utils';

@Processor('emails-queue')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly reportsService: ReportsService) {
    super();
  }

  async process(job: Job<{ email: string }>) {
    const values = await job.getChildrenValues();

    const childrenValues = Object.values<string>(values);

    if (!childrenValues.length)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Job '${job.name}' doesn't have children values.`,
        ),
      );

    const { email } = job.data;

    return this.reportsService.sendEmail(email, childrenValues[0]);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job '${job.name}' completed.`);
  }

  @OnWorkerEvent('active')
  onJobActive(job: Job) {
    console.log(`Processing job '${job.name}'....`);
  }
}
