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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'apps/api-gateway/src/auth/auth.service';
import { User } from 'apps/users/src/entities';
import { Request, Response } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  CreateCompanyDto,
  CreateUserDto,
  ForgetPasswordDto,
  LoginDto,
  RefreshTokenDto,
  UpdatePasswordDto,
  VerifyEmailDto,
  VerifyNewDeviceDto,
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
  @ResponseMessage('Signed up successfully.')
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
          example: 'user@example.com',
          description: 'User email',
        },
        password: {
          type: 'string',
          example: 'password123',
          description: 'User password',
        },
        phone_number: {
          type: 'string',
          example: '+1234567890',
          description: 'User phone number',
        },
        address: {
          type: 'string',
          example: '123 Main St',
          description: 'User address',
        },
        bio: {
          type: 'string',
          example: 'Software Engineer',
          nullable: true,
          description: 'User bio',
        },
        type: {
          type: 'string',
          enum: ['candidate', 'recruiter'],
          example: 'candidate',
          description: 'Role of user',
        },
        full_name: {
          type: 'string',
          example: 'John Doe',
          description: 'User full name',
        },
        expected_salary: {
          type: 'number',
          example: 50000,
          nullable: true,
          description: 'User expected salary',
        },
        skills: {
          type: 'string',
          example: 'Java, React',
          nullable: true,
          description: 'User skills',
        },
        certifications: {
          type: 'string',
          example: "['AWS Certified', 'Google Developer Certified']",
          nullable: true,
          description: 'User certifications',
        },
        createCompanyDto: {
          type: 'string',
          example: {
            name: 'FPT Software',
            bio: 'A company specialize in software.',
            address: 'Ha Noi',
            website: 'https://fpt.software.com.vn',
          },
          nullable: true,
          description: 'Data need to be create company.',
        },
        resume: {
          type: 'string',
          format: 'binary',
          description: 'Resume (CV) file (required)',
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
    description: 'User successfully signed up.',
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard, CustomGoogleRecaptchaGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
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
        message: 'Password updated successfully.',
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

  @Post('verify-email')
  @ResponseMessage('OTP has been sent to email.')
  @ApiOperation({
    summary: 'Verify email of user',
    description: 'Verify email of user',
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Data has been used for verify email of user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Email verified successfully.',
    schema: {
      example: {
        message: 'Email verified successfully.',
      },
    },
  })
  async verifyEmail(@Body() { email }: VerifyEmailDto) {
    return this.authService.handleVerifyEmail(email);
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Verify new device successfully.')
  @ApiOperation({
    summary: 'Verify new device',
    description: 'Verify new device by entering OTP in SMS/email.',
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Data need to be used to verify thew new device.',
  })
  @ApiResponse({
    status: 201,
    description: 'Verify new device successfully',
    schema: {
      example: {
        message: 'Your new device has been verified. You are now logged in.',
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

    const user = request.user as User;

    return this.authService.handleVerifyNewDevice(
      verifyNewDeviceDto,
      requestMetadata,
      user,
    );
  }
}
