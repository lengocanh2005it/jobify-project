import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { User } from 'apps/users/src/entities';
import { Request, Response } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateCompanyDto,
  CreateUserDto,
  ForgetPasswordDto,
  LoginDto,
  RefreshTokenDto,
  UpdatePasswordDto,
  VerifyEmailDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { FileValidationPipe } from 'libs/common/pipes';
import { CreateSocialAccount, SocialLogin } from 'libs/common/utils';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

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
    const userId = (request?.user as User).id;

    const cacheKey = `users:${userId}`;

    const cachedProfile = await this.cacheManager.get(cacheKey);

    if (cachedProfile) return cachedProfile;

    const profile = await this.authService.handleGetProfile(userId);

    await this.cacheManager.set(cacheKey, profile);

    return profile;
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() request: Request, @Res() res: Response) {
    const user = request.user as SocialLogin;

    if (user?.provider && user?.provider_id) {
      const findUser = await this.authService.handleCheckExistedSocialAccount(
        user.provider,
        user.provider_id,
        user?.email ? user.email : undefined,
      );

      if (findUser)
        return res.status(200).json({
          statusCode: 200,
          message: 'Logged in successfully!',
          data: findUser,
        });
    }

    return res.render('socials', { user });
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() request: Request, @Res() res: Response) {
    const user = request.user as SocialLogin;

    if (user?.provider && user?.provider_id) {
      const findUser = await this.authService.handleCheckExistedSocialAccount(
        user.provider,
        user.provider_id,
        user?.email ? user.email : undefined,
      );

      if (findUser)
        return res.status(200).json({
          statusCode: 200,
          message: 'Logged in successfully!',
          data: findUser,
        });
    }

    return res.render('socials', { user });
  }

  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  async linkedInAuth() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  async linkedinAuthRedirect(@Req() request: Request, @Res() res: Response) {
    const user = request.user as SocialLogin;

    if (user?.provider && user?.provider_id) {
      const findUser = await this.authService.handleCheckExistedSocialAccount(
        user.provider,
        user.provider_id,
        user?.email ? user.email : undefined,
      );

      if (findUser)
        return res.status(200).json({
          statusCode: 200,
          message: 'Logged in successfully!',
          data: findUser,
        });
    }

    return res.render('socials', { user });
  }

  @Post('create-social-account')
  @ResponseMessage('Social account created successfully.')
  async createSocialAccount(@Body() createSocialAccount: CreateSocialAccount) {
    return this.authService.handleCreateSocialAccount(createSocialAccount);
  }
}
