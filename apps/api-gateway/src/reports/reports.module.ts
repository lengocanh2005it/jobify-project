import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ReportsController } from 'apps/api-gateway/src/reports/reports.controller';
import { ReportsService } from 'apps/api-gateway/src/reports/reports.service';

@Module({
  imports: [CommonModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
