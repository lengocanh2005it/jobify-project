import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage } from 'libs/common/decorators';
import { Roles } from 'libs/common/decorators';
import { CreateCompanyDto } from 'libs/common/dtos';
import { LoginDto } from 'libs/common/dtos';
import { JwtAuthGuard } from 'libs/common/guards';
import { RoleAuthGuard } from 'libs/common/guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ResponseMessage('LoggedIn successfully.')
  handleLogin(@Body() loginDto: LoginDto) {
    return this.authService.handleLogin(loginDto);
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
      (request?.user as Record<string, string | number>).userId as string,
      createCompanyDto,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Get profile successfully.')
  handleGetProfile(@Req() request: Request) {
    return this.authService.handleGetProfile(
      (request?.user as Record<string, string | number>).userId as string,
    );
  }
}
