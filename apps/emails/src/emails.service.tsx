import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { render } from '@react-email/render';
import { EmailType } from 'libs/common/constants';
import {
  AccountDeleteEmail,
  ChangePasswordEmail,
  NewDeviceEmail,
  OtpEmail,
  PremiumSubscriptionSuccessEmail,
  SendReportEmail,
} from 'libs/common/emails/templates';
import { generateOTP, generateRpcExceptionResponse } from 'libs/common/utils';
import * as nodemailer from 'nodemailer';
import { JSX } from 'react';

@Injectable()
export class EmailsService {
  private readonly transporter: nodemailer.Transporter;
  private readonly emailTemplates: Record<
    EmailType,
    {
      component: (data?: any) => JSX.Element;
      subject: string;
      generateData?: (data?: any) => any;
    }
  > = {
    [EmailType.PAYMENT_SUCCESSFULLY]: {
      component: () => <PremiumSubscriptionSuccessEmail />,
      subject: 'PAYMENT FOR SUBSCRIPTION SUCCESSFULLY!',
    },
    [EmailType.VERIFY_EMAIL]: {
      component: (data) => <OtpEmail otp={data.otp} />,
      subject: 'OTP VERIFICATION CODE',
      generateData: () => ({ otp: generateOTP() }),
    },
    [EmailType.VERIFY_OTP]: {
      component: (data) => <OtpEmail otp={data.otp} />,
      subject: 'OTP VERIFICATION CODE',
      generateData: () => ({ otp: generateOTP() }),
    },
    [EmailType.ACCOUNT_DELETE]: {
      component: () => <AccountDeleteEmail />,
      subject: 'ACCOUNT DELETION NOTICE',
    },
    [EmailType.REPORT]: {
      component: (data) => <SendReportEmail fileUrl={data.fileUrl} />,
      subject: 'SYSTEM REPORT',
      generateData: (fileUrl) => ({ fileUrl }),
    },
    [EmailType.CHANGE_PASSWORD]: {
      component: (data) => <ChangePasswordEmail username={data.full_name} />,
      subject: 'PASSWORD CHANGE CONFIRMATION',
      generateData: (full_name) => ({ full_name }),
    },
    [EmailType.NEW_DEVICE_LOGIN]: {
      component: (data) => (
        <NewDeviceEmail
          userName={data.userName}
          location={data.location}
          deviceType={data.deviceType}
          time={data.time}
        />
      ),
      subject: '⚠️ UNRECOGNIZED DEVICE LOGIN',
      generateData: ({ userName, location, deviceType, time }) => ({
        userName,
        location,
        deviceType,
        time,
      }),
    },
  };

  constructor(
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: configService.get<string>('nodemailer.email_send'),
        pass: configService.get<string>('nodemailer.email_password'),
      },
    });
  }

  public handleSendEmail = async (
    email: string,
    type: EmailType,
    extraData?: any,
  ) => {
    const template = this.emailTemplates[type];

    if (!template) {
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Unsupported email type: ${type}.`,
        ),
      );
    }

    const data = template.generateData ? template.generateData(extraData) : {};

    if (type === EmailType.VERIFY_EMAIL || type === EmailType.VERIFY_OTP) {
      this.rabbitMqRedisClient.emit('set-key', {
        key: `${email}:otp`,
        data: data.otp,
        ttl: 120,
      });
    }

    const content = template.component(data);
    const htmlContent = await render(content);

    const mailOptions: nodemailer.SendMailOptions = {
      from: 'Jobify Support Team <jobify@supportteams.org>',
      to: email,
      subject: template.subject,
      html: htmlContent,
    };

    if (type === EmailType.REPORT && data.fileUrl) {
      const url = new URL(data.fileUrl as string);

      const filenameFromUrl = url.pathname.split('/').pop();

      const fileExtension = filenameFromUrl?.split('.').pop();

      if (!fileExtension) throw new Error('File extension not found in URL.');

      const now = new Date();

      const year = now.getFullYear();

      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      const day = now.getDate().toString().padStart(2, '0');

      const filename = `report-companies-overview-(${year}-${month}-${day}).${fileExtension}`;

      mailOptions.attachments = [
        {
          filename,
          path: data.fileUrl,
          contentType: fileExtension === 'csv' ? 'text/csv' : 'application/pdf',
        },
      ];
    }

    await this.transporter.sendMail(mailOptions);
  };
}
