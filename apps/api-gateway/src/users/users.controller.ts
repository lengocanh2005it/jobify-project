import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { Request } from 'express';
import { Role } from 'libs/common/constants';
import { Roles } from 'libs/common/decorators/roles.decorator';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { JwtAuthGuard } from 'libs/common/guards/jwt.guard';
import { RoleAuthGuard } from 'libs/common/guards/role.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles(Role.ADMIN)
  getUsers(@Req() request: Request) {
    return this.usersService.getUsers();
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }
}
