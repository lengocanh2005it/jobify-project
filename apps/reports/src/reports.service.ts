import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ReportTypesContext } from 'apps/reports/src/contexts';
import { generateRpcExceptionResponse, ReportData } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ReportsService {
  constructor(
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('UPLOADS_SERVICE')
    private readonly rabbitMqUploadClient: ClientProxy,
    @Inject('EMAILS_SERVICE') private readonly rabbitMqEmailClient: ClientProxy,
    private readonly reportsTypeContext: ReportTypesContext,
  ) {}

  public handleGenerateReport = async (reportType: string, format: string) => {
    const reportData = await lastValueFrom<ReportData[]>(
      this.rabbitMqJobClient.send({ cmd: 'get-report-data' }, {}),
    );

    if (!reportData || !reportData.length)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'Report data is empty.',
        ),
      );

    const strategy = this.reportsTypeContext.getStrategy(format);

    return strategy.generate(reportData, format);
  };

  public uploadReport = async (reportFilePath: string) => {
    return lastValueFrom<string>(
      this.rabbitMqUploadClient.send(
        { cmd: 'upload-filepath' },
        reportFilePath,
      ),
    );
  };

  public sendEmail = (email: string, fileUrl: string) => {
    this.rabbitMqEmailClient.emit(
      { cmd: 'send-report-to-email' },
      {
        email,
        fileUrl,
      },
    );

    return {
      success: true,
    };
  };
}
