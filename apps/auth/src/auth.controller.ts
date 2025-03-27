import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { EmailType, Provider } from 'libs/common/constants';
import {
  CreateDeviceDto,
  LoginDto,
  UpdatePasswordDto,
  VerifyNewDeviceDto,
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
    @Payload('type') type: EmailType,
  ) {
    return this.authService.handleForgetPassword(email, type);
  }

  @MessagePattern({ cmd: 'refresh-token' })
  async handleRefreshToken(@Payload() email: string) {
    return this.authService.handleRefreshToken(email);
  }

  @MessagePattern({ cmd: 'verify-email' })
  async handleVerifyEmail(@Payload() email: string) {
    return this.authService.handleVerifyEmail(email);
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
    @Payload('user') user: User,
  ) {
    return this.authService.handleVerifyNewDevice(
      verifyNewDeviceDto,
      requestMetadata,
      user,
    );
  }
}
