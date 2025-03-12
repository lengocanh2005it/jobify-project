import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Provider } from 'libs/common/constants';
import { Profile, Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleProvider extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.client_id') ?? '',
      clientSecret: configService.get<string>('google.client_secret') ?? '',
      callbackURL: configService.get<string>('google.callback_url') ?? '',
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    const { id, displayName, emails, photos } = profile;

    const user = {
      provider: Provider.GOOGLE,
      provider_id: id,
      full_name: displayName,
      email: emails?.[0]?.value || null,
      avatar_url: photos?.[0]?.value || null,
    };

    return user;
  }
}
