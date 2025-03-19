import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { GenerateReportDto } from 'libs/common/dtos/generate-report.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ReportsService {
  constructor(
    @Inject('REPORTS_SERVICE')
    private readonly rabbitMqReportClient: ClientProxy,
  ) {}

  public handleGenerateReport = async (
    generateReportDto: GenerateReportDto,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqReportClient.send(
        { cmd: 'generate-report' },
        {
          generateReportDto,
          user,
        },
      ),
    );
  };
}
