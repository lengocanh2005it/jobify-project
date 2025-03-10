import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { UsersService } from 'apps/users/src/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, UpdatePasswordDto } from 'libs/common/dtos';
import { JwtPayload } from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
    @Inject('EMAILS_SERVICE') private readonly rabbitMqEmailClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  public handleLogin = async (loginDto: LoginDto) => {
    const user = await this.usersService.handleVerifyUser(loginDto);

    const accessToken = this.jwtService.sign({
      userId: user.id,
      role: user.role?.name,
    });

    const refreshToken = this.jwtService.sign(
      {
        userId: user.id,
        role: user.role?.name,
      },
      {
        expiresIn: this.configService.get<string>('refresh_token_life'),
      },
    );

    const { email } = loginDto;

    this.rabbitMqRedisClient.emit('set-key', {
      key: `${email}:refresh-token`,
      data: refreshToken,
      ttl: 30 * 60,
    });

    return { accessToken, refreshToken };
  };

  public handleUpdatePassword = async (
    updatePasswordDto: UpdatePasswordDto,
    userId: string,
  ) => {
    const { password, newPassword, otp } = updatePasswordDto;

    const user = await lastValueFrom<User | null>(
      this.rabbitMqUserClient.send({ cmd: 'get-password' }, userId),
    );

    if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

    const isMatchPassword = await bcrypt.compare(user.password, password);

    if (!isMatchPassword)
      throw new RpcException(`Current password isn't correct.`);

    const otpInRedis = await lastValueFrom<string | null>(
      this.rabbitMqRedisClient.send({ cmd: 'get-key' }, `${user.email}:otp`),
    );

    if (otp !== otpInRedis) throw new RpcException(`OTP isn't correct.`);

    return this.rabbitMqUserClient.send(
      { cmd: 'update-pw-user' },
      { newPassword, userId: user.id },
    );
  };

  public handleForgetPassword = (email: string, type: string) => {
    this.rabbitMqEmailClient.emit('send-email', { email, type });

    return {
      message: `OTP has been sent to email: "${email}"`,
    };
  };

  public handleRefreshToken = async (email: string) => {
    const cachedRefreshToken = await lastValueFrom<string | null>(
      this.rabbitMqRedisClient.send('get-key', `${email}:refresh-token`),
    );

    if (!cachedRefreshToken)
      throw new RpcException(
        `Email '${email}' doesn't have any refresh token cached in Redis.'`,
      );

    const jwtPayload = await this.jwtService.verifyAsync<JwtPayload>(
      cachedRefreshToken,
      {
        secret: this.configService.get<string>('jwt_secret_key') ?? '',
      },
    );

    const { userId, role } = jwtPayload;

    const payload = {
      userId,
      role,
    };

    const accessToken = this.jwtService.sign(payload);

    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('refresh_token_life'),
    });

    this.rabbitMqRedisClient.emit('set-key', {
      key: `${email}:refresh-token`,
      data: newRefreshToken,
      ttl: 30 * 60,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  };

  public handleVerifyEmail = async (email: string) => {
    const user = await lastValueFrom<User | null>(
      this.rabbitMqUserClient.send(
        { cmd: 'get-user-by-field' },
        {
          field: 'email',
          value: email,
        },
      ),
    );

    if (!user) throw new RpcException(`User with email: '${email}' not found.`);

    this.rabbitMqEmailClient.emit('send-email', {
      email,
      type: 'verify-email',
    });

    return {
      success: `OTP has been sent to email: '${email}'.`,
    };
  };

  public handleSignout = async (user: User) => {
    const findUser = await lastValueFrom<User | null>(
      this.rabbitMqUserClient.send({ cmd: 'get-user-jwt' }, user.id),
    );

    if (!findUser)
      throw new RpcException(
        `User with id: '${user.id}' not found in system database.`,
      );

    const { email } = user;

    this.rabbitMqRedisClient.emit('del-key', `${email}:refresh-token`);

    this.rabbitMqRedisClient.emit('del-key', `${email}:otp`);

    return {
      success: 'Signed out successfully.',
    };
  };
}
