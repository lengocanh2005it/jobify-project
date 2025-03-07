import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { User } from 'apps/users/src/entities/users.entity';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateUserDto, UpdateUserDto } from 'libs/common/dtos';
import { AssignCompanyToRecruitersDto } from 'libs/common/dtos/assign-company-to-recruiters.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';
import { FileValidationPipe } from 'libs/common/pipe/file-validation.pipe';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ResponseMessage('All users fetched successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  getUsers(@Req() request: Request, @Paginate() query: PaginateQuery) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @ResponseMessage('Get user successfully.')
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  getUser(@Param('id', ParseUUIDPipe) userId: string, @Req() request: Request) {
    const user = request.user as User;

    return this.usersService.handleGetUser(userId, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @Roles(Role.ADMIN)
  createUser(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createUser(createUserDto, files);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Profile of user updated successfully!')
  @UseInterceptors(AnyFilesInterceptor())
  updateUser(
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
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  deleteUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Req() request: Request,
  ) {
    const user = request.user as User;

    return this.usersService.handleDeleteUser(userId, user);
  }

  @Patch('company/assign')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.RECRUITER)
  assignCompanyToRecruiters(
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
