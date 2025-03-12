import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import * as bcrypt from 'bcrypt';
import { Provider } from 'libs/common/constants';
import { LoginDto, UpdatePasswordDto } from 'libs/common/dtos';
import {
  CreateSocialAccount,
  generateRpcExceptionResponse,
  JwtPayload,
} from 'libs/common/utils';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
    @Inject('EMAILS_SERVICE') private readonly rabbitMqEmailClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  public handleLogin = async (loginDto: LoginDto) => {
    const user = await lastValueFrom<User>(
      this.rabbitMqUserClient.send({ cmd: 'verify-user' }, loginDto),
    );

    const { accessToken, refreshToken } = this.signTokens(
      user.id,
      user.role.name,
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

    if (!user)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `User with id: '${userId}' not found.`,
        ),
      );

    const isMatchPassword = await bcrypt.compare(
      user.password ? user.password : '',
      password,
    );

    if (!isMatchPassword)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Current password isn't correct.`,
        ),
      );

    const otpInRedis = await lastValueFrom<string | null>(
      this.rabbitMqRedisClient.send({ cmd: 'get-key' }, `${user.email}:otp`),
    );

    if (otp !== otpInRedis)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `OTP isn't correct.`,
        ),
      );

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
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Email '${email}' doesn't have any refresh token cached in Redis.'`,
        ),
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

    if (!user)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `User with email: '${email}' not found.`,
        ),
      );

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
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `User with id: '${user.id}' not found.`,
        ),
      );

    const { email } = user;

    this.rabbitMqRedisClient.emit('del-key', `${email}:refresh-token`);

    this.rabbitMqRedisClient.emit('del-key', `${email}:otp`);

    return {
      success: 'Signed out successfully.',
    };
  };

  public handleCreateSocialAccount = async (
    createSocialAccount: CreateSocialAccount,
  ) => {
    const user = await lastValueFrom<User>(
      this.rabbitMqUserClient.send(
        { cmd: 'verify-social-account' },
        createSocialAccount,
      ),
    );

    const { accessToken, refreshToken } = this.signTokens(
      user.id,
      user.role.name,
    );

    if (user.email) {
      this.rabbitMqRedisClient.emit('set-key', {
        key: `${user.email}:refresh-token`,
        data: refreshToken,
        ttl: 30 * 60,
      });
    }

    return { accessToken, refreshToken };
  };

  private signTokens = (
    userId: string,
    roleName: string,
  ): { accessToken: string; refreshToken: string } => {
    const accessToken = this.jwtService.sign({
      userId,
      role: roleName,
    });

    const refreshToken = this.jwtService.sign(
      {
        userId,
        role: roleName,
      },
      {
        expiresIn: this.configService.get<string>('refresh_token_life'),
      },
    );

    return { accessToken, refreshToken };
  };

  public handleCheckExistedSocialAccount = async (
    provider: Provider,
    provider_id: string,
    email?: string,
  ) => {
    const user = await lastValueFrom<User | null>(
      this.rabbitMqUserClient.send(
        { cmd: 'is-existed-social-account' },
        { provider, provider_id, email },
      ),
    );

    if (user) {
      const { accessToken, refreshToken } = this.signTokens(
        user.id,
        user.role.name,
      );

      return { accessToken, refreshToken };
    }

    return null;
  };
}
