import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { GoogleRecaptchaGuard } from '@nestlab/google-recaptcha';

@Injectable()
export class CustomGoogleRecaptchaGuard extends GoogleRecaptchaGuard {
  async canActivate(context: ExecutionContext): Promise<true> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      throw new BadRequestException('reCAPTCHA token is missing or invalid.');
    }
  }
}
