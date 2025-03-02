import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateUserDto, UpdateUserDto } from 'libs/common/dtos';
import { AssignCompanyToRecruitersDto } from 'libs/common/dtos/assign-company-to-recruiters.dto';
import { catchError } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUsersClient: ClientProxy,
  ) {}

  public getUsers = (user: User) => {
    return this.rabbitMqUsersClient.send(
      { cmd: 'get-users' },
      {
        user,
      },
    );
  };

  public createUser = (
    createUserDto: CreateUserDto,
    files?: Array<Express.Multer.File>,
  ) => {
    return this.rabbitMqUsersClient
      .send(
        { cmd: 'create-user' },
        {
          createUserDto,
          files,
        },
      )
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

  public handleGetUser = (userId: string, user: User) => {
    return this.rabbitMqUsersClient.send(
      { cmd: 'get-user' },
      {
        userId,
        user,
      },
    );
  };

  public handleUpdateUser = (
    userId: string,
    updateUserDto: UpdateUserDto,
    user: User,
    files?: Array<Express.Multer.File>,
  ) => {
    return this.rabbitMqUsersClient.send(
      { cmd: 'update-user' },
      { updateUserDto, userId, user, files },
    );
  };

  public handleDeleteUser = (userId: string, user: User) => {
    return this.rabbitMqUsersClient.send(
      { cmd: 'delete-user' },
      {
        userId,
        user,
      },
    );
  };

  public handleAssignCompanyToRecruiters = (
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    user: User,
  ) => {
    return this.rabbitMqUsersClient.send(
      { cmd: 'assign-company' },
      {
        assignCompanyToRecruitersDto,
        user,
      },
    );
  };
}
