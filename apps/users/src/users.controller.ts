import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { UpdateUserDto } from 'libs/common/dtos/update-user.dto';
import { UsersService } from './users.service';
import { AssignCompanyToRecruitersDto } from 'libs/common/dtos/assign-company-to-recruiters.dto';

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
    @Payload('avatar') avatar?: Express.Multer.File,
  ) {
    return await this.usersService.handleUpdateUser(
      userId,
      updateUserDto,
      avatar,
    );
  }

  @MessagePattern({ cmd: 'delete-user' })
  async deleteUser(@Payload() userId: string) {
    return await this.usersService.handleDeleteUser(userId);
  }

  @MessagePattern({ cmd: 'get-password' })
  async getPasswordOfUser(@Payload() userId: string) {
    return await this.usersService.handleGetPasswordOfUser(userId);
  }

  @MessagePattern({ cmd: 'update-pw-user' })
  async handleUpdatePasswordOfUser(
    @Payload('newPassword') newPassword: string,
    @Payload('userId') userId: string,
  ) {
    return await this.usersService.handleUpdatePassword(newPassword, userId);
  }

  @MessagePattern({ cmd: 'get-users-matched-requirements' })
  async handleGetUsersMatchedRequirements(@Payload() requirements: string[]) {
    return await this.usersService.handleGetUsersMatchedRequirements(
      requirements,
    );
  }

  @EventPattern('update-premium')
  async handleUpdatePremium(@Payload() userId: string) {
    return await this.usersService.handleUpdatePremium(userId);
  }

  @MessagePattern({ cmd: 'assign-company' })
  async handleAssignCompanyToRecruiters(
    @Payload()
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
  ) {
    return await this.usersService.handleAssignCompanyToRecruiters(
      assignCompanyToRecruitersDto,
    );
  }

  @MessagePattern({ cmd: 'get-user-by-field' })
  async handleGetUserByField(
    @Payload('field') field: string,
    @Payload('value') value,
  ) {}
}
