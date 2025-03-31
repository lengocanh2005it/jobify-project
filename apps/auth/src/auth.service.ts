import {
  InfisicalProvider,
  TransactionsProvider,
  TwoFactorAuthenticationProvider,
} from '@app/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Device } from 'apps/auth/src/entities';
import { User } from 'apps/users/src/entities';
import * as bcrypt from 'bcrypt';
import { format } from 'date-fns';
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_TTL_OTP_EXPIRED,
  EmailTemplateNameEnum,
  Provider,
  Role,
} from 'libs/common/constants';
import {
  CreateDeviceDto,
  LoginDto,
  UpdatePasswordDto,
  Verify2FaDto,
  VerifyNewDeviceDto,
  VerifyOtpDto,
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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

      if (!user.is_email_verified) {
        const otp = generateOTP();

        await this.cacheManager.set(
          `${loginDto.email}:otp`,
          otp,
          DEFAULT_TTL_OTP_EXPIRED,
        );

        this.rabbitMqEmailClient.emit('send-email', {
          email: loginDto.email,
          templateName: EmailTemplateNameEnum.EMAIL_OTP_VERIFICATION,
          context: {
            otp,
            full_name: user.full_name,
          },
        });

        return {
          success: true,
          message:
            'Please check your email for the OTP to complete verification.',
        };
      }

      if (user.role.name !== 'admin') {
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

          const deviceType = lastKnownDevice.device_type;

          if (user.is_two_factor_enabled)
            throw new RpcException(
              generateRpcExceptionResponse(HttpStatus.FORBIDDEN, {
                description: `We detected a login attempt from an unrecognized device, and this account has 2FA enabled. Please retrieve the OTP from the Google Authenticator app linked to this account and enter it in the OTP verification field.`,
                next_step: 'ENTER_OTP',
                details: {
                  deviceType: deviceType,
                  location: 'Ha Noi, Viet Nam',
                  loginTime: format(new Date(), 'EEEE, yyyy-MM-dd HH:mm:ss'),
                },
              }),
            );

          const otp = generateOTP();

          await this.cacheManager.set(
            `${user.email}:otp`,
            otp,
            DEFAULT_TTL_OTP_EXPIRED,
          );

          let isOptSent = false;

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
              message: `Hi ${user.full_name}, your verification code is: ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
            });

            isOptSent = true;
          } else if (deviceType === 'desktop') {
            const otp = generateOTP();

            await this.cacheManager.set(
              `${user.email}:otp`,
              otp,
              DEFAULT_TTL_OTP_EXPIRED,
            );

            this.rabbitMqEmailClient.emit('send-email', {
              email: user.email,
              templateName: EmailTemplateNameEnum.EMAIL_OTP_VERIFICATION,
              context: {
                full_name: user.full_name,
                otp,
              },
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

          this.rabbitMqEmailClient.emit('send-email', {
            email: user.email,
            templateName: EmailTemplateNameEnum.EMAIL_NEW_DEVICE_LOGIN,
            context: {
              full_name: user.full_name,
              location: 'Ha Noi, Viet Nam',
              device_type: deviceType,
              time: format(new Date(), 'EEEE, yyyy-MM-dd HH:mm:ss'),
              support_email: this.configService.get<string>(
                'support_email',
                '',
              ),
              support_phone: this.configService.get<string>(
                'support_phone',
                '',
              ),
            },
          });

          throw new RpcException(
            generateRpcExceptionResponse(HttpStatus.FORBIDDEN, {
              description: `We detected a login attempt from an unrecognized device. An OTP has been sent to your registered ${deviceType === 'desktop' ? 'email.' : deviceType === 'mobile' || deviceType === 'smartphone' ? 'SMS.' : ''}`,
              next_step: 'ENTER_OTP',
              details: {
                deviceType: deviceType,
                location: 'Ha Noi, Viet Nam',
                loginTime: format(new Date(), 'EEEE, yyyy-MM-dd HH:mm:ss'),
              },
            }),
          );
        }
      }

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

    if (!user.is_two_factor_enabled)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.FORBIDDEN,
          'Please enable 2FA to be able to change the password.',
        ),
      );

    if (!otp)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Please include the OTP received from the Google Authenticator app.`,
        ),
      );

    const secret = await this.infisicalProvider.getSecret(
      `TOTP_SECRET_${user.id}`,
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

    const isMatchPassword = await bcrypt.compare(
      password,
      user.password ? user.password : '',
    );

    if (!isMatchPassword)
      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `Current password isn't correct.`,
        ),
      );

    return this.rabbitMqUserClient.send(
      { cmd: 'update-pw-user' },
      { newPassword, userId: user.id },
    );
  };

  public handleForgetPassword = async (
    email: string,
    templateName: EmailTemplateNameEnum,
  ) => {
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

    const { full_name } = user;

    const otp = generateOTP();

    await this.cacheManager.set(`${email}:otp`, otp, DEFAULT_TTL_OTP_EXPIRED);

    this.rabbitMqEmailClient.emit('send-email', {
      email,
      templateName,
      context: {
        otp,
        full_name,
      },
    });

    return {
      success: true,
      message: `Password reset email sent successfully.`,
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

    await this.cacheManager.del(`${email}:refresh-token`);

    await this.cacheManager.del(`${email}:otp`);

    return {
      success: true,
      message: 'Signed out successfully.',
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
  ) => {
    return this.transactionProvider.executeTransaction(async (queryRunner) => {
      const deviceRepository = queryRunner.manager.getRepository(Device);

      const { otp, email } = verifyNewDeviceDto;

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

      await this.verifyOtp(email, otp, user);

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
        userAgent,
      });

      newDeviceForUser.user = user;

      await deviceRepository.save(newDeviceForUser);

      return {
        success: true,
        message: 'Your new device has been verified. You are now logged in.',
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

  public handleVerifyOtp = async (verifyOtpDto: VerifyOtpDto) => {
    const { otp, email } = verifyOtpDto;

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

    await this.verifyOtp(email, otp, user);

    await this.cacheManager.del(`${email}:otp`);

    await this.cacheManager.del(`${email}:otp-attempts`);

    this.rabbitMqUserClient.emit('update-verified-email', email);

    return {
      success: true,
      message: 'Verified email successfully. You can now log in.',
    };
  };

  private verifyOtp = async (email: string, otp: string, user: User) => {
    const cachedOtp = await this.cacheManager.get(`${email}:otp`);

    if (!cachedOtp) {
      await this.sendNewOtp(email, user);

      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.BAD_REQUEST,
          `The OTP has expired. Please check email '${email}' for a new OTP.`,
        ),
      );
    }

    const attempts =
      Number(await this.cacheManager.get(`${email}:otp-attempts`)) || 1;

    if (attempts >= DEFAULT_MAX_ATTEMPTS) {
      await this.sendNewOtp(email, user);

      await this.cacheManager.del(`${email}:otp-attempts`);

      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.FORBIDDEN,
          `You have entered the wrong OTP more than ${DEFAULT_MAX_ATTEMPTS} times. Please enter the new code that has been sent to your email.`,
        ),
      );
    }

    if (otp !== cachedOtp) {
      const remainingAttempts = DEFAULT_MAX_ATTEMPTS - attempts;

      await this.cacheManager.set(
        `${email}:otp-attempts`,
        attempts + 1,
        DEFAULT_TTL_OTP_EXPIRED,
      );

      if (remainingAttempts > 0) {
        throw new RpcException(
          generateRpcExceptionResponse(
            HttpStatus.BAD_REQUEST,
            `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`,
          ),
        );
      }

      await this.sendNewOtp(email, user);

      await this.cacheManager.del(`${email}:otp-attempts`);

      throw new RpcException(
        generateRpcExceptionResponse(
          HttpStatus.FORBIDDEN,
          `You have entered the wrong OTP more than ${DEFAULT_MAX_ATTEMPTS} times. Please enter the new code that has been sent to your email.`,
        ),
      );
    }

    await this.cacheManager.del(`${email}:otp`);

    await this.cacheManager.del(`${email}:otp-attempts`);
  };

  private async sendNewOtp(email: string, user: User) {
    const newOtp = generateOTP();

    await this.cacheManager.set(
      `${email}:otp`,
      newOtp,
      DEFAULT_TTL_OTP_EXPIRED,
    );

    this.rabbitMqEmailClient.emit('send-email', {
      email,
      templateName: EmailTemplateNameEnum.EMAIL_OTP_VERIFICATION,
      context: {
        otp: newOtp,
        full_name: user.full_name,
      },
    });
  }
}
