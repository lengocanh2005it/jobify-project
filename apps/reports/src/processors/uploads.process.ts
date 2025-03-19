import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ReportsService } from 'apps/reports/src/reports.service';
import { Job } from 'bullmq';
import { generateRpcExceptionResponse } from 'libs/common/utils';

@Processor('uploads-queue')
export class UploadProcessor extends WorkerHost {
  constructor(private readonly reportsService: ReportsService) {
    super();
  }

  async process(job: Job<any>) {
    const childrenValues = Object.values<string>(await job.getChildrenValues());

    if (!childrenValues.length)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Job '${job.name}' doesn't have children values.`,
        ),
      );

    return this.reportsService.uploadReport(childrenValues[0]);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(`Job '${job.name}' completed.`);
  }

  @OnWorkerEvent('active')
  onJobActive(job: Job) {
    console.log(`Processing job '${job.name}'`);
  }
}
