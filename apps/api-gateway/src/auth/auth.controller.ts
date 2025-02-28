import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateCompanyDto, CreateUserDto, LoginDto } from 'libs/common/dtos';
import { ForgetPasswordDto } from 'libs/common/dtos/forget-password.dto';
import { UpdatePasswordDto } from 'libs/common/dtos/update-password.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ResponseMessage('Logged in successfully.')
  handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.handleLogin(loginDto);
  }

  @Post('sign-up')
  @ResponseMessage('Signed up successfully.')
  handleSignup(@Body() createUserDto: CreateUserDto) {
    return this.authService.handleSignup(createUserDto);
  }

  @Post('company')
  @ResponseMessage('Company created successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN)
  handleCreateCompany(
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
  handleGetProfile(@Req() request: Request) {
    return this.authService.handleGetProfile(request.user?.id as string);
  }

  @Post('update-password')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.authService.handleUpdatePassword(updatePasswordDto, userId);
  }

  @Post('forget-password')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.handleForgetPassword(forgetPasswordDto);
  }
}
