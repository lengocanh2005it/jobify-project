import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ReportStrategy } from 'apps/reports/src/interfaces';
import { createObjectCsvWriter } from 'csv-writer';
import { generateRpcExceptionResponse, ReportData } from 'libs/common/utils';

@Injectable()
export class CsvReportStrategy implements ReportStrategy {
  async generate(data: ReportData[], format: string): Promise<string> {
    if (format !== 'csv')
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'Format must be a csv file.',
        ),
      );

    const now = new Date();

    const year = now.getFullYear();

    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const day = now.getDate().toString().padStart(2, '0');

    const filePath = `./libs/common/files/report-companies-overview-(${year}-${month}-${day}).csv`;

    try {
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'company', title: 'Company' },
          { id: 'totalJobs', title: 'Total Jobs' },
          { id: 'totalApplications', title: 'Total Applications' },
          { id: 'totalSavedJobs', title: 'Total Saved Jobs' },
          { id: 'totalClosedJobs', title: 'Total Closed Jobs' },
          { id: 'revenue', title: 'Revenue ($)' },
        ],
      });

      await csvWriter.writeRecords(data);
    } catch (err) {
      console.error('Error when creating csv file: ', err);
      throw err;
    }

    return filePath;
  }
}
