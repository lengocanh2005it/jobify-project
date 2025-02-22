import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUsersClient: ClientProxy,
  ) {}

  public getUsers = () => {
    return this.rabbitMqUsersClient.send({ cmd: 'get-users' }, {});
  };

  public createUser = (createUserDto: CreateUserDto) => {
    return this.rabbitMqUsersClient.send({ cmd: 'create-user' }, createUserDto);
  };
}
