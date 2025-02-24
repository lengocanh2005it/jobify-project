import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from 'libs/common/dtos/update-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get-users' })
  async getUsers() {
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

  @MessagePattern({ cmd: 'get-user' })
  async getUser(@Payload() userId: string) {
    return await this.usersService.handleGetUser(userId);
  }

  @MessagePattern({ cmd: 'update-user' })
  async updateUser(
    @Payload('userId') userId: string,
    @Payload('updateUserDto') updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.handleUpdateUser(userId, updateUserDto);
  }

  @MessagePattern({ cmd: 'delete-user' })
  async deleteUser(@Payload() userId: string) {}
}
