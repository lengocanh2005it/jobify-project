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
import { PaginateQuery } from 'nestjs-paginate';
import { catchError, lastValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USERS_SERVICE') private readonly rabbitMqUsersClient: ClientProxy,
  ) {}

  public getUsers = async (query: PaginateQuery) => {
    return await lastValueFrom(
      this.rabbitMqUsersClient.send(
        { cmd: 'get-users' },
        {
          query,
        },
      ),
    );
  };

  public createUser = async (
    createUserDto: CreateUserDto,
    files?: Array<Express.Multer.File>,
  ) => {
    return await lastValueFrom(
      this.rabbitMqUsersClient.send(
        { cmd: 'create-user' },
        {
          createUserDto,
          files,
        },
      ),
    );
  };

  public handleGetUser = async (userId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqUsersClient.send(
        { cmd: 'get-user' },
        {
          userId,
          user,
        },
      ),
    );
  };

  public handleUpdateUser = async (
    userId: string,
    updateUserDto: UpdateUserDto,
    user: User,
    files?: Array<Express.Multer.File>,
  ) => {
    return await lastValueFrom(
      this.rabbitMqUsersClient.send(
        { cmd: 'update-user' },
        { updateUserDto, userId, user, files },
      ),
    );
  };

  public handleDeleteUser = async (userId: string, user: User) => {
    return await lastValueFrom(
      this.rabbitMqUsersClient.send(
        { cmd: 'delete-user' },
        {
          userId,
          user,
        },
      ),
    );
  };

  public handleAssignCompanyToRecruiters = async (
    assignCompanyToRecruitersDto: AssignCompanyToRecruitersDto,
    user: User,
  ) => {
    return await lastValueFrom(
      this.rabbitMqUsersClient.send(
        { cmd: 'assign-company' },
        {
          assignCompanyToRecruitersDto,
          user,
        },
      ),
    );
  };
}
