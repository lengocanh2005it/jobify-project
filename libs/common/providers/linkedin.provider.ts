import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Provider } from 'libs/common/constants';
import { Strategy } from 'passport-linkedin-oauth2';

@Injectable()
export class LinkedInProvider extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('linkedin.client_id') ?? '',
      clientSecret: configService.get<string>('linkedin.client_secret') ?? '',
      callbackURL: configService.get<string>('linkedin.callback_url') ?? '',
      scope: ['openid', 'profile', 'email', 'w_member_social'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any) {
    const { id, displayName, email, picture } = profile;

    const user = {
      provider: Provider.LINKEDIN,
      provider_id: id,
      full_name: displayName,
      email: email || null,
      avatar_url: picture || null,
    };

    return user;
  }
}
