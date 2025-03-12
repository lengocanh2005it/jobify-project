import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import axios from 'axios';
import { Provider } from 'libs/common/constants';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookProvider extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('facebook.client_id') ?? '',
      clientSecret: configService.get<string>('facebook.client_secret') ?? '',
      callbackURL: configService.get<string>('facebook.callback_url') ?? '',
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    try {
      const { data } = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture.width(500)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return {
        provider: Provider.FACEBOOK,
        provider_id: data.id,
        full_name: data.name,
        email: data.email || null,
        avatar_url: data.picture?.data?.url || null,
      };
    } catch (error) {
      console.error(
        'Error fetching user data from Facebook:',
        error.response?.data || error.message,
      );
      return null;
    }
  }
}
