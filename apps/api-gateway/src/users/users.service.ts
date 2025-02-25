import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { UpdateUserDto } from 'libs/common/dtos/update-user.dto';
import { catchError } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUsersClient: ClientProxy,
  ) {}

  public getUsers = () => {
    return this.rabbitMqUsersClient.send({ cmd: 'get-users' }, {});
  };

  public createUser = (createUserDto: CreateUserDto) => {
    return this.rabbitMqUsersClient
      .send({ cmd: 'create-user' }, createUserDto)
      .pipe(
        catchError((err: Error) => {
          if (err.message.includes('Role Not Found'))
            throw new NotFoundException('Role Not Found.');

          if (err.message.includes('Email has been existed.'))
            throw new BadRequestException('Email has been existed.');

          throw new BadRequestException('Error from Users Service');
        }),
      );
  };

  public handleGetUser = (userId: string) => {
    return this.rabbitMqUsersClient.send({ cmd: 'get-user' }, userId);
  };

  public handleUpdateUser = (userId: string, updateUserDto: UpdateUserDto) => {
    return this.rabbitMqUsersClient.send(
      { cmd: 'update-user' },
      { updateUserDto, userId },
    );
  };

  public handleDeleteUser = (userId: string) => {
    return this.rabbitMqUsersClient.send({ cmd: 'delete-user' }, userId);
  };
}
