import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportsProducer } from 'apps/reports/src/producers';
import { User } from 'apps/users/src/entities';
import { GenerateReportDto } from 'libs/common/dtos';

@Controller()
export class ReportsController {
  constructor(private readonly reportsProducer: ReportsProducer) {}

  @MessagePattern({ cmd: 'generate-report' })
  async generateReport(
    @Payload('generateReportDto') generateReportDto: GenerateReportDto,
    @Payload('user') user: User,
  ) {
    await this.reportsProducer.createReportFlow(generateReportDto, user);

    return { message: 'Please check your email to receive report file.' };
  }
}
