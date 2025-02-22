import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from 'apps/api-gateway/src/users/users.service';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { JwtAuthGuard } from 'libs/common/guards/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.usersService.getUsers();
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }
}
