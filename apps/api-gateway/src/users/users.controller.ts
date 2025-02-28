import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { Role } from 'libs/common/constants';
import { ResponseMessage, Roles } from 'libs/common/decorators';
import { CreateUserDto, UpdateUserDto } from 'libs/common/dtos';
import { AssignCompanyToRecruitersDto } from 'libs/common/dtos/assign-company-to-recruiters.dto';
import { JwtAuthGuard, RoleAuthGuard } from 'libs/common/guards';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ResponseMessage('All users fetched successfully.')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  getUsers() {
    return this.usersService.getUsers();
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  getUser(@Param('id') userId: string) {
    return this.usersService.handleGetUser(userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN, Role.CANDIDATE, Role.RECRUITER)
  @ResponseMessage('Profile updated successfully!')
  @UseInterceptors(FileInterceptor('avatar'))
  updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.usersService.handleUpdateUser(userId, updateUserDto, avatar);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  deleteUser(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.handleDeleteUser(userId);
  }

  @Patch('company/assign')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  assignCompanyToRecruiters(
    @Body() assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
  ) {
    return this.usersService.handleAssignCompanyToRecruiters(
      assignCompanyToRecruitersDto,
    );
  }
}
