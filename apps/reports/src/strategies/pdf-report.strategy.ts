import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ReportStrategy } from 'apps/reports/src/interfaces/reports-strategy.interface';
import * as fs from 'fs';
import { generateRpcExceptionResponse } from 'libs/common/utils';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfReportStrategy implements ReportStrategy {
  generate(data: any[], format: string): string {
    if (format !== 'pdf')
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'Format must be a pdf type.',
        ),
      );

    const now = new Date();

    const year = now.getFullYear();

    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const day = now.getDate().toString().padStart(2, '0');

    const filePath = `./libs/common/files/report-companies-overview-(${year}-${month}-${day}).pdf`;

    try {
      const doc = new PDFDocument();

      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(18).text('Job Report', { align: 'center' });

      doc.moveDown();

      data.forEach((item) => {
        doc.fontSize(12).text(`Company: ${item.company}`);
        doc.text(`Total Jobs: ${item.totalJobs}`);
        doc.text(`Total Applications: ${item.totalApplications}`);
        doc.text(`Revenue: $${item.revenue}`);
        doc.moveDown();
      });

      doc.end();
    } catch (err) {
      console.error('Error when creating pdf file: ', err);
      throw err;
    }

    return filePath;
  }
}
