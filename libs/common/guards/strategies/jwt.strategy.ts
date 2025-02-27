import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { User } from 'apps/users/src/entities/users.entity';
import { JwtPayload } from 'libs/common/utils/types';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt_secret_key') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = (await lastValueFrom<User | null>(
      this.rabbitMqUserClient.send({ cmd: 'get-user' }, payload.userId),
    )) as User;

    return user;
  }
}
