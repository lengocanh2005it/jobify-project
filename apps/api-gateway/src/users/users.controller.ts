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
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { User } from 'apps/users/src/entities';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
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
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ResponseMessage('All users fetched successfully.')
  @Roles(Role.ADMIN)
  @UseInterceptors(CacheInterceptor)
  async getUsers(@Paginate() query: PaginateQuery) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @ResponseMessage('Get user successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
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
  async deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Req() request: Request,
    @Query('applicationId') applicationId?: string,
  ) {
    const user = request.user as User;

    return this.usersService.handleDeleteUser(userId, user, applicationId);
  }

  @Patch('company/assign')
  @Roles(Role.ADMIN, Role.RECRUITER)
  @ResponseMessage('Assigned company to recruiters successfully.')
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
