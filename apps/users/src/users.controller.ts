import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get-users' })
  getUsers() {
    return this.usersService.getUsers();
  }

  @MessagePattern({ cmd: 'create-user' })
  async createUser(@Payload() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }
}
