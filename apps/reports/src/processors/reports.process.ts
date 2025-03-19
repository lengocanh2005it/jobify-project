import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { ReportsService } from 'apps/reports/src/reports.service';
import { Job } from 'bullmq';

@Processor('reports-queue')
export class ReportsProcessor extends WorkerHost {
  constructor(private readonly reportsService: ReportsService) {
    super();
  }

  async process(job: Job<{ reportType: string; format: string }>) {
    const { reportType, format } = job.data;

    const data = await this.reportsService.handleGenerateReport(
      reportType,
      format,
    );

    return data;
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
