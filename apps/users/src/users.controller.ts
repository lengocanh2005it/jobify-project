import { Controller, UseInterceptors } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities';
import { Provider } from 'libs/common/constants';
import {
  AssignCompanyToRecruitersDto,
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
} from 'libs/common/dtos';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { CreateSocialAccount } from 'libs/common/utils';
import { PaginateQuery } from 'nestjs-paginate';
import { UsersService } from './users.service';

@Controller()
@UseInterceptors(ServicesExceptionInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get-users' })
  async getUsers(@Payload('query') query: PaginateQuery) {
    return this.usersService.getUsers(query);
  }

  @MessagePattern({ cmd: 'create-user' })
  async createUser(
    @Payload('createUserDto') createUserDto: CreateUserDto,
    @Payload('files') files?: Array<Express.Multer.File>,
  ) {
    return this.usersService.createUser(createUserDto, files);
  }

  @MessagePattern({ cmd: 'get-profile' })
  async getProfile(@Payload('userId') userId: string) {
    return this.usersService.handleGetProfile(userId);
  }

  @MessagePattern({ cmd: 'get-user' })
  async getUser(
    @Payload('userId') userId: string,
    @Payload('user') user: User,
  ) {
    return this.usersService.handleGetUser(userId, user);
  }

  @MessagePattern({ cmd: 'update-user' })
  async updateUser(
    @Payload('userId') userId: string,
    @Payload('updateUserDto') updateUserDto: UpdateUserDto,
    @Payload('user') user: User,
    @Payload('files') files?: Array<Express.Multer.File>,
  ) {
    return this.usersService.handleUpdateUser(
      userId,
      updateUserDto,
      user,
      files,
    );
  }

  @MessagePattern({ cmd: 'delete-user' })
  async deleteUser(
    @Payload('userId') userId: string,
    @Payload('user') user: User,
  ) {
    return this.usersService.handleDeleteUser(userId, user);
  }

  @MessagePattern({ cmd: 'get-password' })
  async getPasswordOfUser(@Payload() userId: string) {
    return this.usersService.handleGetPasswordOfUser(userId);
  }

  @MessagePattern({ cmd: 'update-pw-user' })
  async handleUpdatePasswordOfUser(
    @Payload('newPassword') newPassword: string,
    @Payload('userId') userId: string,
  ) {
    return this.usersService.handleUpdatePassword(newPassword, userId);
  }

  @MessagePattern({ cmd: 'get-users-matched-requirements' })
  async handleGetUsersMatchedRequirements(@Payload() requirements: string[]) {
    return this.usersService.handleGetUsersMatchedRequirements(requirements);
  }

  @EventPattern('update-premium')
  async handleUpdatePremium(@Payload() userId: string) {
    return this.usersService.handleUpdatePremium(userId);
  }

  @MessagePattern({ cmd: 'assign-company' })
  async handleAssignCompanyToRecruiters(
    @Payload('assignCompanyToRecruitersDto')
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    @Payload('user') user: User,
  ) {
    return this.usersService.handleAssignCompanyToRecruiters(
      assignCompanyToRecruitersDto,
      user,
    );
  }

  @MessagePattern({ cmd: 'get-user-by-field' })
  async handleGetUserByField(
    @Payload('field') field: string,
    @Payload('value') value: string,
  ) {
    return this.usersService.handleGetUserByField(field, value);
  }

  @MessagePattern({ cmd: 'get-user-jwt' })
  async handleGetUserJwt(@Payload() userId: string) {
    return this.usersService.handleGetUserJwt(userId);
  }

  @EventPattern('update-user-limit')
  async handleUpdateUserLimit(
    @Payload('userId') userId: string,
    @Payload('type') type: 'increase' | 'decrease',
  ) {
    return this.usersService.handleUpdateUserLimit(userId, type);
  }

  @MessagePattern({ cmd: 'verify-user' })
  async handleVerifyUser(@Payload() loginDto: LoginDto) {
    return this.usersService.handleVerifyUser(loginDto);
  }

  @MessagePattern({ cmd: 'verify-social-account' })
  async createSocialAccount(
    @Payload() createSocialAccount: CreateSocialAccount,
  ) {
    return this.usersService.handleCreateSocialAccount(createSocialAccount);
  }

  @MessagePattern({ cmd: 'is-existed-social-account' })
  async handleCheckExistedSocialAccount(
    @Payload('provider') provider: Provider,
    @Payload('provider_id') provider_id: string,
    @Payload('email') email?: string,
  ) {
    return this.usersService.handleCheckExistedSocialAccount(
      provider,
      provider_id,
      email,
    );
  }
}
