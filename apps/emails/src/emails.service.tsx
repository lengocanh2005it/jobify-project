import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { render } from '@react-email/render';
import { OtpEmail } from 'libs/common/emails/templates';
import PremiumSubscriptionSuccessEmail from 'libs/common/emails/templates/payment-successful.email';
import { generateOTP } from 'libs/common/utils/generate-otp.util';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailsService {
  private transporter: Transporter;

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

  public handleSendEmail = async (email: string, type: string) => {
    try {
      if (type === 'payment_successfully') {
        const content = await render(<PremiumSubscriptionSuccessEmail />);

        await this.transporter.sendMail({
          from: 'Jobify Support Team <jobify@supportteams.org>',
          to: email,
          subject: 'PAYMENT FOR SUBSCRIPTION SUCCESSFULLY!',
          html: content,
        });
      } else if (type === 'verify-otp') {
        const otp = generateOTP();

        this.rabbitMqRedisClient.emit('set-key', {
          key: `${email}:otp`,
          data: otp,
          ttl: 120,
        });

        const content = await render(<OtpEmail otp={otp} />);

        await this.transporter.sendMail({
          from: 'Jobify Support Team <jobify@supportteams.org>',
          to: email,
          subject: 'OTP VERIFICATION CODE',
          html: content,
        });
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
