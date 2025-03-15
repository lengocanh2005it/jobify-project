import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { render } from '@react-email/render';
import { EmailType } from 'libs/common/constants';
import {
  AccountDeleteEmail,
  OtpEmail,
  PremiumSubscriptionSuccessEmail,
} from 'libs/common/emails/templates';
import { generateOTP, generateRpcExceptionResponse } from 'libs/common/utils';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { JSX } from 'react';

@Injectable()
export class EmailsService {
  private readonly transporter: Transporter;
  private readonly emailTemplates: Record<
    EmailType,
    { component: JSX.Element; subject: string; generateData?: () => any }
  > = {
    [EmailType.PAYMENT_SUCCESSFULLY]: {
      component: <PremiumSubscriptionSuccessEmail />,
      subject: 'PAYMENT FOR SUBSCRIPTION SUCCESSFULLY!',
    },
    [EmailType.VERIFY_EMAIL]: {
      component: <OtpEmail otp="{otp}" />,
      subject: 'OTP VERIFICATION CODE',
      generateData: () => ({ otp: generateOTP() }),
    },
    [EmailType.VERIFY_OTP]: {
      component: <OtpEmail otp="{otp}" />,
      subject: 'OTP VERIFICATION CODE',
      generateData: () => ({ otp: generateOTP() }),
    },
    [EmailType.ACCOUNT_DELETE]: {
      component: <AccountDeleteEmail />,
      subject: 'ACCOUNT DELETION NOTICE',
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

  public handleSendEmail = async (email: string, type: EmailType) => {
    const template = this.emailTemplates[type];

    if (!template)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Unsupported email type: ${type}`,
        ),
      );

    let content = template.component;

    if (template.generateData) {
      const data = template.generateData();

      if (type === EmailType.VERIFY_EMAIL || type === EmailType.VERIFY_OTP) {
        this.rabbitMqRedisClient.emit('set-key', {
          key: `${email}:otp`,
          data: data.otp,
          ttl: 120,
        });
        content = <OtpEmail otp={data.otp} />;
      }
    }

    const htmlContent = await render(content);

    await this.transporter.sendMail({
      from: 'Jobify Support Team <jobify@supportteams.org>',
      to: email,
      subject: template.subject,
      html: htmlContent,
    });
  };
}
