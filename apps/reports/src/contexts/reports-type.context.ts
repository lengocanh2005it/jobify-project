import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportStrategy } from 'apps/reports/src/interfaces';
import {
  CsvReportStrategy,
  PdfReportStrategy,
} from 'apps/reports/src/strategies';

@Injectable()
export class ReportTypesContext {
  private strategies: { [key: string]: ReportStrategy } = {};

  constructor(
    private readonly pdfReportStrategy: PdfReportStrategy,
    private readonly csvReportStrategy: CsvReportStrategy,
  ) {
    this.strategies['pdf'] = this.pdfReportStrategy;
    this.strategies['csv'] = this.csvReportStrategy;
  }

  getStrategy(format: string): ReportStrategy {
    const strategy = this.strategies[format];

    if (!strategy)
      throw new BadRequestException(`Unsupported report type: ${format}.`);

    return strategy;
  }
}
