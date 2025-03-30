import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { API_TAGS, Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import {
  AssignCompanyToRecruitersDto,
  CreateUserDto,
  UpdateUserDto,
} from 'libs/common/dtos';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { FileValidationPipe } from 'libs/common/pipes';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('users')
@UseGuards(JwtAuthGuard, RoleAuthGuard)
@ApiTags(API_TAGS.USERS)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ResponseMessage('All users fetched successfully.')
  @Roles(Role.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({
    summary: 'Get all users',
    description: 'All users retrieved successfully.',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMINS can have permission to get all users.',
  })
  @ApiResponse({
    status: 200,
    description: 'All users retrieved successfully.',
    schema: {
      example: {
        data: [
          {
            id: '03b6c87d-d626-46f6-8702-f917a56f0ca4',
            email: 'recruiter1@gmail.com',
            phone_number: '0393873630',
            address: 'HCM City',
            bio: null,
            full_name: 'Luke Coleman',
            avatar_url:
              'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
            expected_salary: null,
            is_premium: true,
            premium_expiry: '2025-03-28T16:55:44.000Z',
            role: {
              name: 'candidate',
            },
            createdAt: '2025-02-25T21:28:13.450Z',
          },
          {
            id: '1803739f-bf27-4698-9c00-450a4039411b',
            email: 'lengocanh20422021222e1242@gmail.com',
            phone_number: '0393873630',
            address: 'Ho Chi Minh City',
            bio: null,
            full_name: 'John Doe',
            avatar_url:
              'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
            expected_salary: null,
            is_premium: false,
            premium_expiry: null,
            role: {
              name: 'recruiter',
            },
            createdAt: '2025-03-09T07:57:18.337Z',
          },
        ],
        meta: {
          itemsPerPage: 2,
          totalItems: 19,
          currentPage: 1,
          totalPages: 10,
          sortBy: [['id', 'ASC']],
        },
        links: {
          current: 'http://localhost:3001/users/?page=1&limit=2&sortBy=id:ASC',
          next: 'http://localhost:3001/users/?page=2&limit=2&sortBy=id:ASC',
          last: 'http://localhost:3001/users/?page=10&limit=2&sortBy=id:ASC',
        },
      },
    },
  })
  async getUsers(@Paginate() query: PaginateQuery) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @ResponseMessage('Get user successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ApiOperation({
    summary: 'Get user details',
    description: 'Get user details with user id',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of user',
    example: '1803739f-bf27-4698-9c00-450a4039411b',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: '1803739f-bf27-4698-9c00-450a4039411b',
        email: 'lengocanh20422021222e1242@gmail.com',
        phone_number: '0393873630',
        address: 'Ho Chi Minh City',
        bio: null,
        full_name: 'John Doe',
        avatar_url:
          'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
        expected_salary: null,
        is_premium: false,
        premium_expiry: null,
        role: {
          name: 'recruiter',
        },
        createdAt: '2025-03-09T07:57:18.337Z',
      },
    },
  })
  async getUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    const cacheKey = `users:${userId}`;

    const cachedUser = await this.cacheManager.get(cacheKey);

    if (cachedUser) return cachedUser;

    const findUser = await this.usersService.handleGetUser(userId, user);

    await this.cacheManager.set(cacheKey, user);

    return findUser;
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  @Roles(Role.ADMIN)
  @ResponseMessage('User created successfully.')
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user with some given data.',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMINS can have permission to create user.',
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
    schema: {
      example: {
        id: '1803739f-bf27-4698-9c00-450a4039411b',
        email: 'lengocanh20422021222e1242@gmail.com',
        phone_number: '0393873630',
        address: 'Ho Chi Minh City',
        bio: null,
        full_name: 'John Doe',
        avatar_url:
          'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
        expected_salary: null,
        is_premium: false,
        premium_expiry: null,
        role: {
          name: 'recruiter',
        },
        createdAt: '2025-03-09T07:57:18.337Z',
      },
    },
  })
  async createUser(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createUser(createUserDto, files);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Profile of user updated successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Update user',
    description: 'Update information of user with some given data.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: '1803739f-bf27-4698-9c00-450a4039411b',
        email: 'lengocanh20422021222e1242@gmail.com',
        phone_number: '0393873630',
        address: 'Ho Chi Minh City',
        bio: null,
        full_name: 'John Doe',
        avatar_url:
          'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
        expected_salary: null,
        is_premium: false,
        premium_expiry: null,
        role: {
          name: 'recruiter',
        },
        createdAt: '2025-03-09T07:57:18.337Z',
      },
    },
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
          nullable: true,
        },
        phone_number: {
          type: 'string',
          example: '+1234567890',
          description: 'User phone number',
          nullable: true,
        },
        address: {
          type: 'string',
          example: '123 Main St',
          description: 'User address',
          nullable: true,
        },
        bio: {
          type: 'string',
          example: 'Software Engineer',
          nullable: true,
          description: 'User bio',
        },
        full_name: {
          type: 'string',
          example: 'John Doe',
          description: 'User full name',
          nullable: true,
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
        updateCompanyDto: {
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
          description: 'Resume (CV) file',
          nullable: true,
        },
        cover_letter: {
          type: 'string',
          format: 'binary',
          description: 'Cover letter file (optional)',
          nullable: true,
        },
      },
    },
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
    @UploadedFiles(new FileValidationPipe()) files: Array<Express.Multer.File>,
  ) {
    const user = request.user as User;

    return this.usersService.handleUpdateUser(
      userId,
      updateUserDto,
      user,
      files,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('User deleted successfully.')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete an existing user by user id',
  })
  @ApiParam({
    name: 'id',
    description: 'The id of user',
    example: '1803739f-bf27-4698-9c00-450a4039411b',
  })
  @ApiQuery({
    name: 'applicationId',
    type: String,
    description:
      'The application id that recruiter want to remove candidate from their jobs.',
    nullable: true,
    required: false,
  })
  @ApiForbiddenResponse({
    description:
      'Only ADMINS and RECRUITER can have permission to delete user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
  })
  async deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Req() request: Request,
    @Query('applicationId') applicationId?: string,
    @Query('jobId') jobId?: string,
  ) {
    const user = request.user as User;

    return this.usersService.handleDeleteUser(
      userId,
      user,
      applicationId,
      jobId,
    );
  }

  @Patch('company/assign')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('Assigned company to recruiters successfully.')
  @ApiOperation({
    summary: 'Assign company to recruiters',
    description: `Assign company to recruiters if they don't belongs to any companies.`,
  })
  @ApiBody({
    type: AssignCompanyToRecruitersDto,
    description: 'Some given data to assign company to recruiters.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        message: 'Assigned these recruiters to this company successfully.',
      },
    },
  })
  async assignCompanyToRecruiters(
    @Body() assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.usersService.handleAssignCompanyToRecruiters(
      assignCompanyToRecruitersDto,
      user,
    );
  }
}
