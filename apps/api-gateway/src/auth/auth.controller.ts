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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { User } from 'apps/users/src/entities';
import { Request, Response } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  AssignRolesDto,
  CreateCompanyDto,
  CreateUserDto,
  ForgetPasswordDto,
  Login2FaDto,
  LoginDto,
  RefreshTokenDto,
  RevokeRolesDto,
  UpdatePasswordDto,
  Verify2FaDto,
  VerifyNewDeviceDto,
  VerifyOtpDto,
} from 'libs/common/dtos';
import {
  CustomGoogleRecaptchaGuard,
  JwtAuthGuard,
  RoleAuthGuard,
} from 'libs/common/guards';
import { FileValidationPipe } from 'libs/common/pipes';
import {
  CreateSocialAccount,
  RequestMetadata,
  SocialLogin,
} from 'libs/common/utils';
import { RBAcAnyPermissions, RBAcGuard, RBAcPermissions } from 'nestjs-rbac';

@Controller('auth')
@ApiTags(API_TAGS.AUTH)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post('sign-in')
  @UseGuards(CustomGoogleRecaptchaGuard)
  @ResponseMessage('Logged in successfully.')
  @ApiOperation({
    summary: 'User login',
    description:
      'Allows a user to log in using their email and password. Returns an access token and refresh token upon successful authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged in successfully.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password.',
  })
  async handleLogin(@Body() loginDto: LoginDto, @Req() request: Request) {
    const requestMetadata: RequestMetadata = {
      ip: request.socket.remoteAddress || '',
      forwardedFor: request.headers['x-forwarded-for'] as string,
      userAgent: request.headers['user-agent'] || 'Unknown User-Agent',
    };

    return this.authService.handleLogin(loginDto, requestMetadata);
  }

  @Post('sign-up')
  @UseGuards(CustomGoogleRecaptchaGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ResponseMessage('Otp has been sent to the email successfully.')
  @ApiOperation({
    summary: 'User sign-up',
    description: 'Registers a new user and uploads any necessary files.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'lengocanhpyne363@gmail.com',
          description: 'User email',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: 'User password',
        },
        phone_number: {
          type: 'string',
          example: '+84393873630',
          description: 'User phone number',
        },
        address: {
          type: 'string',
          example: '123 Main Street, London, England',
          description: 'User address',
        },
        bio: {
          type: 'string',
          example: '3+ Years Experiences with NestJS',
          nullable: true,
          description: 'User bio',
        },
        type: {
          type: 'string',
          enum: ['candidate', 'recruiter'],
          example: 'recruiter',
          description: 'Role of user',
        },
        full_name: {
          type: 'string',
          example: 'John Doe',
          description: 'User full name',
        },
        expected_salary: {
          type: 'number',
          example: 1200,
          nullable: true,
          description: 'User expected salary ($)',
        },
        skills: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['Java', 'React', 'Next.js'],
          nullable: true,
          description: 'User skills',
        },
        certifications: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['AWS Certified', 'Google Developer Certified'],
          nullable: true,
          description: 'User certifications',
        },
        createCompanyDto: {
          type: 'object',
          nullable: true,
          description: 'Data needed to create a company',
          properties: {
            name: {
              type: 'string',
              example: 'FPT Software',
              description: 'Name of the company',
            },
            bio: {
              type: 'string',
              example: 'A company specializing in software.',
              nullable: true,
              description: 'Bio of the company',
            },
            address: {
              type: 'string',
              example: 'Ha Noi',
              description: 'Address of the company',
            },
            website: {
              type: 'string',
              example: 'https://fpt.software.com.vn',
              nullable: true,
              description: 'Website URL of the company',
            },
          },
        },
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Resume (CV) file (optional)',
        },
        cover_letter: {
          type: 'string',
          format: 'binary',
          description: 'Cover letter file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'OTP has been sent to the email.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Otp has been sent to the email successfully.',
        data: {
          success: true,
          message:
            'Please check your email for the OTP to complete verification.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async handleSignup(
    @Body() createUserDto: CreateUserDto,
    @Req() request: Request,
    @UploadedFiles(FileValidationPipe) files?: Array<Express.Multer.File>,
  ) {
    const requestMetadata: RequestMetadata = {
      ip: request.socket.remoteAddress || '',
      forwardedFor: request.headers['x-forwarded-for'] as string,
      userAgent: request.headers['user-agent'] || 'Unknown User-Agent',
    };

    return this.authService.handleSignup(createUserDto, requestMetadata, files);
  }

  @Post('sign-out')
  @ResponseMessage('Signed out successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'User sign-out',
    description: 'Log out account of user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Logged out successfully.',
  })
  async handleSignout(@Req() request: Request) {
    const user = request.user as User;

    return this.authService.handleSignout(user);
  }

  @Post('company')
  @ResponseMessage('Company created successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.RECRUITER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiBody({
    type: CreateCompanyDto,
    description: 'Data need to be create company.',
  })
  @ApiOperation({
    summary: 'Create new company',
    description: 'Create a new company with given data.',
  })
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcAnyPermissions(
    ['user@read'],
    ['user@create'],
    ['user@update'],
    ['user@delete'],
  )
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profile of user',
    description: 'Get profile details of user',
  })
  @ApiResponse({
    status: 200,
    description: 'Get profile successfully.',
    schema: {
      example: {
        id: '59831b25-f500-11ef-8dc6-0242ac110002',
        email: 'user123@gmail.com',
        phone_number: '+13234234234',
        address: 'Ha Noi',
        bio: 'FrontEnd Developer',
        full_name: 'John Doe',
        avatar_url: 'https://avatar.example.com',
        is_premium: true,
        expiry_date: '2025-03-20T12:23:55Z',
        role: 'candidate',
        notifications: [
          {
            id: '59831b25-f500-11ef-8dc6-0242ac110002',
            title: 'New Job Application',
            message: 'A new job that suitable for you...',
          },
        ],
        skills: ['React', 'NestJS'],
        expected_salary: 2000,
      },
    },
  })
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard, CustomGoogleRecaptchaGuard, RBAcGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcPermissions('auth@change_password')
  @ApiOperation({
    summary: 'Update user password',
    description: 'Update user password with some data.',
  })
  @ApiBody({
    type: UpdatePasswordDto,
    description: 'Data of updating password for user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Password updated successfully.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Password updated successfully.',
        data: {
          success: true,
          message: 'Password updated successfully.',
        },
      },
    },
  })
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.id as string;

    return this.authService.handleUpdatePassword(updatePasswordDto, userId);
  }

  @Post('forget-password')
  @ResponseMessage('OTP has been sent to email.')
  @UseGuards(CustomGoogleRecaptchaGuard)
  @ApiOperation({
    summary: 'User forget password',
    description: 'Sent OTP to email of user to reset password.',
  })
  @ApiBody({
    type: ForgetPasswordDto,
    description: 'Data has been used for reset password of user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reset password for user.',
    schema: {
      example: {
        message: `OTP has been sent to email.`,
      },
    },
  })
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.handleForgetPassword(forgetPasswordDto);
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Refresh access token if it has expired.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Data has been used for refreshing token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Token refresh successfully.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ResponseMessage('Token refreshed successfully.')
  async refreshToken(@Body() { email }: RefreshTokenDto) {
    return this.authService.handleRefreshToken(email);
  }

  @Get('google')
  @ApiOperation({
    summary: 'Google Authentication',
    description: 'Login via Google',
  })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @ApiOperation({
    summary: 'Google Callback',
    description: 'Callback that Google used after authenticate successfully.',
  })
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
  @ApiOperation({
    summary: 'Facebook Authentication',
    description: 'Login via Facebook',
  })
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {}

  @Get('facebook/callback')
  @ApiOperation({
    summary: 'Facebook Callback',
    description:
      'Callback that Facebook used after authentication successfully.',
  })
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
  @ApiOperation({
    summary: 'Linkedin Authentication',
    description: 'Login via Linkedin',
  })
  @UseGuards(AuthGuard('linkedin'))
  async linkedInAuth() {}

  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  @ApiOperation({
    summary: 'Linkedin Callback',
    description:
      'Callback that Linkedin used after authentication successfully.',
  })
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
  @ApiOperation({
    summary: 'Social Account registered',
    description: 'New social account created successfully.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        socialLogin: {
          type: 'object',
          properties: {
            provider: {
              type: 'enum',
              enum: ['google', 'facebook', 'linkedin'],
              example: 'google',
            },
            provider_id: {
              type: 'string',
              format: 'provider_id',
              example: '1235345345',
            },
            full_name: {
              type: 'string',
              format: 'full_name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'johndoe123@gmail.com',
            },
            avatar_url: {
              type: 'string',
              format: 'avatar_url',
              example: 'https://res.cloudinary.com/user-default.png',
            },
          },
        },
        role: {
          type: 'enum',
          enum: ['candidate', 'recruiter'],
          example: 'candidate',
          format: 'role',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Social account created successfully.',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'john.doe@example.com',
        full_name: 'John Doe',
        bio: 'Software engineer with 5 years of experience in web development.',
        phone_number: '+1 234 567 890',
        address: '123 Main St, City, Country',
        certifications: ['AWS Certified Developer', 'Google Cloud Associate'],
        is_premium: false,
        expiry_date: null,
        role: 'candidate',
        provider: 'google',
        provider_id: '3234234234',
      },
    },
  })
  @ResponseMessage('Social account created successfully.')
  async createSocialAccount(@Body() createSocialAccount: CreateSocialAccount) {
    return this.authService.handleCreateSocialAccount(createSocialAccount);
  }

  @Post('verify-new-device')
  @ResponseMessage('Verify new device successfully.')
  @ApiOperation({
    summary: 'Verify new device',
    description: 'Verify new device by entering OTP in SMS/email.',
  })
  @ApiBody({
    type: VerifyNewDeviceDto,
    description: 'Data need to be used to verify thew new device.',
  })
  @ApiResponse({
    status: 201,
    description: 'Verify new device successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Verify new device successfully.',
        data: {
          success: true,
          message: 'Your new device has been verified. You are now logged in.',
        },
      },
    },
  })
  async handleVerifyNewDevice(
    @Body() verifyNewDeviceDto: VerifyNewDeviceDto,
    @Req() request: Request,
  ) {
    const requestMetadata: RequestMetadata = {
      ip: request.socket.remoteAddress || '',
      forwardedFor: request.headers['x-forwarded-for'] as string,
      userAgent: request.headers['user-agent'] || 'Unknown User-Agent',
    };

    return this.authService.handleVerifyNewDevice(
      verifyNewDeviceDto,
      requestMetadata,
    );
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcPermissions('auth@enable_2fa')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate 2FA QR Code',
    description:
      'This endpoint generates a QR code and OTP authentication URL for enabling two-factor authentication (2FA). The user must be authenticated.',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully generated 2FA QR Code and OTP URL',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            otpAuthUrl: {
              type: 'string',
              example: 'otpauth://totp/MyApp:user@example.com?...',
              description: 'OTP authentication URL used to set up 2FA.',
            },
            qrCodeDataUrl: {
              type: 'string',
              example: 'data:image/png;base64,...',
              description: 'Base64 encoded image of the QR code.',
            },
          },
        },
      },
    },
  })
  @ResponseMessage('Generated 2FA secret successfully.')
  async generate2FA(@Req() request: Request) {
    const userId = (request.user as User).id;

    return this.authService.handleGenerate2FA(userId);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @RBAcAnyPermissions(['auth@enable_2fa'], ['auth@disable_2fa'])
  @ApiBearerAuth()
  @ResponseMessage('2FA verified successfully.')
  @ApiOperation({
    summary: 'Verify 2FA OTP',
    description:
      'This endpoint verifies the OTP code entered by the user. It can be used to enable or disable two-factor authentication (2FA).',
  })
  @ApiBody({
    description: 'OTP verification data',
    type: Verify2FaDto,
    examples: {
      enable2FA: {
        summary: 'Enable 2FA',
        value: { otp: '123456', type: 'enable' },
      },
      disable2FA: {
        summary: 'Disable 2FA',
        value: { otp: '654321', type: 'disable' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '2FA verified successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP format or incorrect OTP.',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated.',
  })
  @ApiForbiddenResponse({
    description: 'User does not have the required role.',
  })
  async verify2FA(@Body() verify2FaDto: Verify2FaDto, @Req() request: Request) {
    const userId = (request.user as User).id;

    return this.authService.handleVerify2FA(verify2FaDto, userId);
  }

  @Post('sign-in-2fa')
  @ResponseMessage('Logged in via 2Fa successfully.')
  @ApiOperation({
    summary: '2FA Sign-In',
    description:
      'This endpoint allows users to log in using a one-time password (OTP) as part of two-factor authentication (2FA).',
  })
  @ApiBody({
    description: 'Login credentials for 2FA',
    type: Login2FaDto,
    examples: {
      loginWith2FA: {
        summary: 'Example request',
        value: { otp: '123456', email: 'user@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged in via 2FA successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP or email format.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or 2FA verification failed.',
  })
  async handleLogin2Fa(@Body() login2FaDto: Login2FaDto) {
    return this.authService.handleLogin2Fa(login2FaDto);
  }

  @Post('verify-otp')
  @ResponseMessage('Email verified successfully.')
  @ApiOperation({
    summary: 'Verify OTP',
    description: `This endpoint verifies the OTP sent to the user's email for account activation.`,
  })
  @ApiResponse({
    status: 201,
    description: 'Email verified successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or OTP has expired.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many incorrect attempts. Please request a new OTP.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.handleVerifyOtp(verifyOtpDto);
  }

  @Post('assign-roles')
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @RBAcPermissions('admin@assign_roles')
  @ApiOperation({
    summary: 'Assign role to users (user -> adminss)',
    description:
      'This endpoint allows to assign role to users. (user -> admin)',
  })
  @ApiBody({
    type: AssignRolesDto,
    description: 'Data need to sent to assign roles for user.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        message: 'Assign role to users successfully.',
      },
    },
  })
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @RBAcPermissions('admin@assign-role')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth()
  async assignRoleToUsers(@Body() assignRolesDto: AssignRolesDto) {
    return this.authService.handleAssignRolesToUser(assignRolesDto);
  }

  @Post('revoke-roles')
  @ApiOperation({
    summary: 'Revoke role of users (admin -> user)',
    description:
      'This endpoint allows to revoke role of ssusers. (admin -> user)',
  })
  @UseGuards(JwtAuthGuard, RoleAuthGuard, RBAcGuard)
  @Roles(Role.SUPERADMIN)
  @RBAcPermissions('superadmin@revoke_roles')
  @ApiBearerAuth()
  @ApiBody({
    type: RevokeRolesDto,
    description: 'Data need to sent to revoke role of users.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        message: 'Revok role of users successfully.',
      },
    },
  })
  async revokeRoleOfUsers(@Body() revokeRolesDto: RevokeRolesDto) {
    return this.authService.handleRevokeRoleOfUsers(revokeRolesDto);
  }
}
