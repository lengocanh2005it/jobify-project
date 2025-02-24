import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators/roles.decorator';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { UpdateUserDto } from 'libs/common/dtos/update-user.dto';
import { JwtAuthGuard } from 'libs/common/guards/jwt.guard';
import { RoleAuthGuard } from 'libs/common/guards/role.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
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
  updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.handleUpdateUser(userId, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  deleteUser(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.handleDeleteUser(userId);
  }
}
