import { MailerService } from '@nestjs-modules/mailer';
import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  EmailTemplateNameEnum,
  SUBJECT_EMAIL_MAP,
} from 'libs/common/constants';
import { generateRpcExceptionResponse } from 'libs/common/utils';

@Injectable()
export class EmailsService {
  constructor(private readonly mailerService: MailerService) {}

  public handleSendEmail = async (
    email: string,
    templateName: EmailTemplateNameEnum,
    context: Record<string, any>,
  ) => {
    try {
      let attachments: Array<{
        filename: string;
        path: string;
        contentType: string;
      }> = [];

      if (
        templateName === EmailTemplateNameEnum.EMAIL_REPORT &&
        context?.fileUrl
      ) {
        const { fileUrl } = context;

        if (typeof fileUrl !== 'string')
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              `File url must be a string.`,
            ),
          );

        const url = new URL(fileUrl);

        const filenameFromUrl = url.pathname.split('/').pop();

        const fileExtension = filenameFromUrl?.split('.').pop();

        if (!fileExtension) throw new Error('File extension not found in URL.');

        const now = new Date();

        const year = now.getFullYear();

        const month = (now.getMonth() + 1).toString().padStart(2, '0');

        const day = now.getDate().toString().padStart(2, '0');

        const filename = `report-companies-overview-(${year}-${month}-${day}).${fileExtension}`;

        attachments = [
          {
            filename,
            path: fileUrl,
            contentType:
              fileExtension === 'csv' ? 'text/csv' : 'application/pdf',
          },
        ];
      }

      await this.mailerService.sendMail({
        to: email,
        subject: SUBJECT_EMAIL_MAP[templateName],
        template: templateName,
        context,
        ...(attachments.length !== 0 && { attachments }),
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
