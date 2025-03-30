import { Injectable } from '@nestjs/common';
import { InfisicalProvider } from 'libs/common/providers';
import { authenticator } from 'otplib';
import * as qrCode from 'qrcode';

@Injectable()
export class TwoFactorAuthenticationProvider {
  constructor(private readonly infisicalProvider: InfisicalProvider) {}

  public generateSecret = async (userId: string) => {
    const secret = authenticator.generateSecret();

    const otpAuthUrl = authenticator.keyuri(userId, 'Jobify-App', secret);

    try {
      await this.infisicalProvider.setSecret(`TOTP_SECRET_${userId}`, secret);
    } catch (err) {
      console.error('Failed to store secret in Infisical:', err);
      throw new Error('Error saving secret. Please try again.');
    }

    return {
      otpAuthUrl,
    };
  };

  public generateQrCode = async (otpAuthUrl: string) => {
    try {
      return qrCode.toDataURL(otpAuthUrl);
    } catch (err) {
      console.error('Error generating QR Code:', err);
      throw new Error('Failed to generate QR Code');
    }
  };

  public verifyOtp = (otp: string, secret: string) => {
    return authenticator.verify({ token: otp, secret });
  };
}
