import {
  InfisicalProvider,
  TransactionsProvider,
  TwoFactorAuthenticationProvider,
} from '@app/common';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Device } from 'apps/auth/src/entities';
import { User } from 'apps/users/src/entities';
import * as bcrypt from 'bcrypt';
import { EmailType, Provider } from 'libs/common/constants';
import {
  CreateDeviceDto,
  LoginDto,
  UpdatePasswordDto,
  Verify2FaDto,
  VerifyNewDeviceDto,
} from 'libs/common/dtos';
import {
  CreateSocialAccount,
  generateFingerprint,
  generateOTP,
  generateRpcExceptionResponse,
  getDeviceType,
  JwtPayload,
  RequestMetadata,
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
    private readonly transactionProvider: TransactionsProvider,
    @Inject('SMS_SERVICE') private readonly rabbitMqSmsClient: ClientProxy,
    private readonly twoFactorAuthenticationProvider: TwoFactorAuthenticationProvider,
    private readonly infisicalProvider: InfisicalProvider,
  ) {}

  public handleLogin = async (
    loginDto: LoginDto,
    requestMetadata: RequestMetadata,
  ) => {
    return this.transactionProvider.executeTransaction(async (queryRunner) => {
      const deviceRepository = queryRunner.manager.getRepository(Device);

      const user = await lastValueFrom<User>(
        this.rabbitMqUserClient.send({ cmd: 'verify-user' }, loginDto),
      );

      const { forwardedFor, ip, userAgent } = requestMetadata;

      const ipAddress = forwardedFor || ip || 'Unknown IP address';

      const fingerprint = generateFingerprint(ipAddress, userAgent);

      const existingDevice = await deviceRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
          fingerprint,
        },
        relations: ['user'],
      });

      if (!existingDevice || (existingDevice && !existingDevice.is_trusted)) {
        const lastKnownDevice = (await this.getLastKnownDevices(user.id))[0];

        if (!lastKnownDevice)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.NOT_FOUND,
              'No last known device found for this user.',
            ),
          );

        const otp = generateOTP();

        this.rabbitMqRedisClient.emit('set-key', {
          key: `${user.email}:otp-verify-new-device`,
          data: otp,
          ttl: 5 * 60,
        });

        let isOptSent = false;

        const deviceType = lastKnownDevice.device_type;

        if (deviceType === 'mobile' || deviceType === 'iphone') {
          if (!lastKnownDevice.phone_number)
            throw new RpcException(
              generateRpcExceptionResponse(
                HttpStatus.BAD_REQUEST,
                'Cannot send OTP: The last known mobile device does not have a registered phone number.',
              ),
            );

          const { phone_number } = lastKnownDevice;

          this.rabbitMqSmsClient.emit('send-sms', {
            from: this.configService.get<string>('twilio.phone_number', ''),
            to: phone_number,
            message: `Hi ${user.full_name}, your verification code is: ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
          });

          this.rabbitMqEmailClient.emit('send-email', {
            email: user.email,
            type: EmailType.NEW_DEVICE_LOGIN,
            extraData: {
              userName: user.full_name,
              location: 'Ha Noi, Viet Nam',
              deviceType,
              time: new Date().toISOString(),
            },
          });

          isOptSent = true;
        } else if (deviceType === 'desktop') {
          this.rabbitMqEmailClient.emit('send-email', {
            email: user.email,
            type: EmailType.VERIFY_OTP,
          });

          isOptSent = true;
        }

        if (!isOptSent)
          throw new RpcException(
            generateRpcExceptionResponse(
              HttpStatus.BAD_REQUEST,
              'Unable to send OTP. No valid method found.',
            ),
          );

        throw new RpcException(
          generateRpcExceptionResponse(HttpStatus.FORBIDDEN, {
            description: `We detected a login attempt from an unrecognized device. An OTP has been sent to your registered ${deviceType === 'desktop' ? 'email.' : deviceType === 'mobile' || deviceType === 'smartphone' ? 'SMS.' : ''}`,
            status: 'OTP_SENT',
            nextStep: 'ENTER_OTP',
            deviceInfo: {
              deviceType: deviceType,
              location: 'Hanoi, Vietnam',
              loginTime: new Date().toISOString(),
            },
          }),
        );
      }

      if (user.is_two_factor_enabled)
        throw new RpcException(
          generateRpcExceptionResponse(HttpStatus.FORBIDDEN, {
            description:
              'Two-factor authentication is enabled. Please enter the OTP code from your authenticator app to proceed.',
            requires2FA: true,
          }),
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
    });
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

  public handleForgetPassword = (email: string, type: EmailType) => {
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
      type: EmailType.VERIFY_EMAIL,
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

  private getLastKnownDevices = async (userId: string) => {
    return this.transactionProvider.executeTransaction(async (queryRunner) => {
      const deviceRepository = queryRunner.manager.getRepository(Device);

      return deviceRepository.find({
        where: {
          user: {
            id: userId,
          },
          is_trusted: true,
        },
        order: {
          lastLogin: 'DESC',
        },
      });
    });
  };

  public handleCreateDevice = async (
    createDeviceDto: CreateDeviceDto,
    user: User,
  ) => {
    return this.transactionProvider.executeTransaction(async (queryRunner) => {
      const deviceRepository = queryRunner.manager.getRepository(Device);

      const newDevice = deviceRepository.create(createDeviceDto);

      newDevice.user = user;

      await deviceRepository.save(newDevice);
    });
  };

  public handleVerifyNewDevice = async (
    verifyNewDeviceDto: VerifyNewDeviceDto,
    requestMetaData: RequestMetadata,
    user: User,
  ) => {
    return this.transactionProvider.executeTransaction(async (queryRunner) => {
      const deviceRepository = queryRunner.manager.getRepository(Device);

      const { otp } = verifyNewDeviceDto;

      const otpInRedisStore = await lastValueFrom(
        this.rabbitMqRedisClient.send(
          'get-key',
          `${user.email}:otp-verify-new-device`,
        ),
      );

      if (!otpInRedisStore)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Your OTP has expired. Please try again by requesting a new code.`,
          ),
        );

      if (otpInRedisStore !== otp)
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `The OTP you entered is incorrect. Please check and try again.`,
          ),
        );

      const { ip, forwardedFor, userAgent } = requestMetaData;

      const ipAddress = forwardedFor || ip || 'Unknown IP address.';

      const fingerprint = generateFingerprint(ipAddress, userAgent);

      const deviceType = getDeviceType(userAgent);

      const newDeviceForUser = deviceRepository.create({
        ipAddress,
        fingerprint,
        lastLogin: new Date(),
        device_type: deviceType,
        ...(deviceType === 'mobile' && { phone_number: user.phone_number }),
        is_trusted: true,
      });

      newDeviceForUser.user = user;

      await deviceRepository.save(newDeviceForUser);

      return {
        success: 'Your new device has been verified. You are now logged in.',
      };
    });
  };

  public handleGenerate2Fa = async (userId: string) => {
    const { otpAuthUrl } =
      await this.twoFactorAuthenticationProvider.generateSecret(userId);

    const qrCodeDataUrl =
      await this.twoFactorAuthenticationProvider.generateQrCode(otpAuthUrl);

    return {
      otpAuthUrl,
      qrCodeDataUrl,
    };
  };

  public handleVerify2Fa = async (
    verify2FaDto: Verify2FaDto,
    userId: string,
  ) => {
    const { otp, type } = verify2FaDto;

    const secret = await this.infisicalProvider.getSecret(
      `TOTP_SECRET_${userId}`,
    );

    if (!secret)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Secret for user with id '${userId}' not found.`,
        ),
      );

    const isValid = this.twoFactorAuthenticationProvider.verifyOtp(otp, secret);

    if (!isValid)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'OTP is not correct. Please enter again.',
        ),
      );

    if (type === 'enable') {
      this.rabbitMqUserClient.emit('enable-2fa', userId);

      return {
        message:
          'Congratulations! You have successfully enabled two-factor authentication. Your account is now more secure.',
      };
    } else {
      this.rabbitMqUserClient.emit('disable-2fa', userId);

      return {
        message:
          'Two-factor authentication has been disabled. Your account is now less secure.',
      };
    }
  };

  public handleLogin2Fa = async (email: string, otp: string) => {
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
          `User with email '${email}' not found.`,
        ),
      );

    const secret = await this.infisicalProvider.getSecret(
      `TOTP_SECRET_${user.id}`,
    );

    if (!secret)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.NOT_FOUND,
          `Secret for user with id '${user.id}' not found.`,
        ),
      );

    const isValid = this.twoFactorAuthenticationProvider.verifyOtp(otp, secret);

    if (!isValid)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          'OTP is not correct. Please enter again.',
        ),
      );

    const { accessToken, refreshToken } = this.signTokens(
      user.id,
      user.role.name,
    );

    this.rabbitMqRedisClient.emit('set-key', {
      key: `${email}:refresh-token`,
      data: refreshToken,
      ttl: 30 * 60,
    });

    return { accessToken, refreshToken };
  };
}
