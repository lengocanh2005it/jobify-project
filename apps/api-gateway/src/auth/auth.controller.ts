import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateCompanyDto, CreateUserDto, LoginDto } from 'libs/common/dtos';
import { ForgetPasswordDto } from 'libs/common/dtos/forget-password.dto';
import { RefreshTokenDto } from 'libs/common/dtos/refresh-token.dto';
import { UpdatePasswordDto } from 'libs/common/dtos/update-password.dto';
import { VerifyEmailDto } from 'libs/common/dtos/verify-email.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { FileValidationPipe } from 'libs/common/pipe/file-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ResponseMessage('Logged in successfully.')
  async handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.handleLogin(loginDto);
  }

  @Post('sign-up')
  @UseInterceptors(AnyFilesInterceptor())
  @ResponseMessage('Signed up successfully.')
  async handleSignup(
    @Body() createUserDto: CreateUserDto,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>,
  ) {
    return this.authService.handleSignup(createUserDto, files);
  }

  @Post('sign-out')
  @ResponseMessage('Signed out successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async handleSignout(@Req() request: Request) {
    const user = request.user as User;

    return this.authService.handleSignout(user);
  }

  @Post('company')
  @ResponseMessage('Company created successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN)
  async handleCreateCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @Req() request: Request,
  ) {
    return this.authService.handleCreateCompany(
      request.user?.id as string,
      createCompanyDto,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Get profile successfully.')
  async handleGetProfile(@Req() request: Request) {
    return this.authService.handleGetProfile(request.user?.id as string);
  }

  @Post('update-password')
  @ResponseMessage('Password updated successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.authService.handleUpdatePassword(updatePasswordDto, userId);
  }

  @Post('forget-password')
  @ResponseMessage('OTP has been sent to email.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.handleForgetPassword(forgetPasswordDto);
  }

  @Post('refresh-token')
  @ResponseMessage('Token refreshed successfully.')
  async refreshToken(@Body() { email }: RefreshTokenDto) {
    return this.authService.handleRefreshToken(email);
  }

  @Post('verify-email')
  @ResponseMessage('OTP has been sent to email.')
  async verifyEmail(@Body() { email }: VerifyEmailDto) {
    return this.authService.handleVerifyEmail(email);
  }
}
