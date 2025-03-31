import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { EmailTemplateNameEnum, Provider } from 'libs/common/constants';
import {
  CreateDeviceDto,
  LoginDto,
  UpdatePasswordDto,
  Verify2FaDto,
  VerifyNewDeviceDto,
  VerifyOtpDto,
} from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { CreateSocialAccount, RequestMetadata } from 'libs/common/utils';
import { AuthService } from './auth.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'login' })
  async handleLogin(
    @Payload('loginDto') loginDto: LoginDto,
    @Payload('requestMetadata') requestMetadata: RequestMetadata,
  ) {
    return this.authService.handleLogin(loginDto, requestMetadata);
  }

  @MessagePattern({ cmd: 'login-2fa' })
  async handleLogin2Fa(
    @Payload('otp') otp: string,
    @Payload('email') email: string,
  ) {
    return this.authService.handleLogin2Fa(email, otp);
  }

  @MessagePattern({ cmd: 'update-password' })
  async handleUpdatePassword(
    @Payload('updatePasswordDto') updatePasswordDto: UpdatePasswordDto,
    @Payload('userId') userId: string,
  ) {
    return this.authService.handleUpdatePassword(updatePasswordDto, userId);
  }

  @MessagePattern({ cmd: 'forget-password' })
  handleForgetPassword(
    @Payload('email') email: string,
    @Payload('templateName') templateName: EmailTemplateNameEnum,
  ) {
    return this.authService.handleForgetPassword(email, templateName);
  }

  @MessagePattern({ cmd: 'refresh-token' })
  async handleRefreshToken(@Payload() email: string) {
    return this.authService.handleRefreshToken(email);
  }

  @MessagePattern({ cmd: 'sign-out' })
  async handleSignout(@Payload() user: User) {
    return this.authService.handleSignout(user);
  }

  @MessagePattern({ cmd: 'create-social-account' })
  async createSocialAccount(
    @Payload() createSocialAccount: CreateSocialAccount,
  ) {
    return this.authService.handleCreateSocialAccount(createSocialAccount);
  }

  @MessagePattern({ cmd: 'check-existed-social-account' })
  async handleCheckedExistedSocialAccount(
    @Payload('provider') provider: Provider,
    @Payload('provider_id') provider_id: string,
    @Payload('email') email?: string,
  ) {
    return this.authService.handleCheckExistedSocialAccount(
      provider,
      provider_id,
      email,
    );
  }

  @EventPattern({ cmd: 'create-new-device' })
  async createNewDeviceOfUser(
    @Payload('createDeviceDto') createDeviceDto: CreateDeviceDto,
    @Payload('user') user: User,
  ) {
    return this.authService.handleCreateDevice(createDeviceDto, user);
  }

  @MessagePattern({ cmd: 'verify-new-device' })
  async handleVerifyNewDevice(
    @Payload('verifyNewDeviceDto') verifyNewDeviceDto: VerifyNewDeviceDto,
    @Payload('requestMetadata') requestMetadata: RequestMetadata,
  ) {
    return this.authService.handleVerifyNewDevice(
      verifyNewDeviceDto,
      requestMetadata,
    );
  }

  @MessagePattern({ cmd: 'generate-2fa' })
  async generate2Fa(@Payload() userId: string) {
    return this.authService.handleGenerate2Fa(userId);
  }

  @MessagePattern({ cmd: 'verify-2fa' })
  async verify2Fa(
    @Payload('verify2FADto') verify2FaDto: Verify2FaDto,
    @Payload('userId') userId: string,
  ) {
    return this.authService.handleVerify2Fa(verify2FaDto, userId);
  }

  @MessagePattern({ cmd: 'verify-otp' })
  async verifyOtp(@Payload() verifyOtpDto: VerifyOtpDto) {
    return this.authService.handleVerifyOtp(verifyOtpDto);
  }
}
