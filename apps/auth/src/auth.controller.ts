import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { LoginDto, UpdatePasswordDto } from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { AuthService } from './auth.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'login' })
  async handleLogin(@Payload() loginDto: LoginDto) {
    return this.authService.handleLogin(loginDto);
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
    @Payload('type') type: string,
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
}
