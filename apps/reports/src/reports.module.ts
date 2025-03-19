import { CommonModule } from '@app/common';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ReportTypesContext } from 'apps/reports/src/contexts';
import {
  EmailProcessor,
  ReportsProcessor,
  UploadProcessor,
} from 'apps/reports/src/processors';
import { ReportsProducer } from 'apps/reports/src/producers';
import {
  CsvReportStrategy,
  PdfReportStrategy,
} from 'apps/reports/src/strategies';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    CommonModule,
    BullModule.registerFlowProducer({
      name: 'reportFlowProducer',
    }),
    BullModule.registerQueue(
      { name: 'reports-queue' },
      { name: 'uploads-queue' },
      { name: 'emails-queue' },
    ),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Reports Service',
    },
    CsvReportStrategy,
    PdfReportStrategy,
    ReportTypesContext,
    ReportsProcessor,
    ReportsProducer,
    ServicesExceptionInterceptor,
    UploadProcessor,
    EmailProcessor,
  ],
})
export class ReportsModule {}
