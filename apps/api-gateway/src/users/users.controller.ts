import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }
}
