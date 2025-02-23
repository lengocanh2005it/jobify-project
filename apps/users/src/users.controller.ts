import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get-users' })
  async getUsers(@Ctx() context: RmqContext) {
    return await this.usersService.getUsers();
  }

  @MessagePattern({ cmd: 'create-user' })
  async createUser(@Payload() createUserDto: CreateUserDto) {
    return await this.usersService.createUser(createUserDto);
  }

  @MessagePattern({ cmd: 'get-profile' })
  async getProfile(@Payload('userId') userId: string) {
    return await this.usersService.handleGetProfile(userId);
  }
}
