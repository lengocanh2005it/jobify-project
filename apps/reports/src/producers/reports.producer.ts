import { InjectFlowProducer } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { User } from 'apps/users/src/entities';
import { FlowProducer } from 'bullmq';
import { GenerateReportDto } from 'libs/common/dtos';

@Injectable()
export class ReportsProducer {
  constructor(
    @InjectFlowProducer('reportFlowProducer')
    private readonly flowProducer: FlowProducer,
  ) {}

  async createReportFlow(generateReportDto: GenerateReportDto, user: User) {
    const { reportType, format } = generateReportDto;

    const { email } = user;

    await this.flowProducer.add({
      name: 'send-email',
      queueName: 'emails-queue',
      data: { email },
      opts: { removeOnComplete: { age: 0 } },
      children: [
        {
          name: 'upload-report',
          queueName: 'uploads-queue',
          opts: { removeOnComplete: { age: 0 } },
          children: [
            {
              name: 'generate-report',
              queueName: 'reports-queue',
              data: { reportType, format },
              opts: { removeOnComplete: { age: 0 } },
            },
          ],
        },
      ],
    });
  }
}
