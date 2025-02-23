import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCompanyDto } from 'libs/common/dtos';
import { LoginDto } from 'libs/common/dtos';
import { catchError } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly rabbitMqAuthClient: ClientProxy,
    @Inject('JOBS_SERVICE') private readonly rabbitMqJobClient: ClientProxy,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
  ) {}

  public handleLogin = (loginDto: LoginDto) => {
    return this.rabbitMqAuthClient.send({ cmd: 'login' }, loginDto).pipe(
      catchError((err: Error) => {
        if (err.message.includes('User Not Found'))
          throw new NotFoundException('User Not Found.');

        if (err.message.includes('Password is not correct'))
          throw new BadRequestException('Password is incorrect.');

        throw new BadRequestException('Error from Auth Service');
      }),
    );
  };

  public handleCreateCompany = (
    userId: string,
    createCompanyDto: CreateCompanyDto,
  ) => {
    return this.rabbitMqJobClient.send(
      { cmd: 'create-company' },
      { createCompanyDto, userId },
    );
  };

  public handleGetProfile = (userId: string) => {
    return this.rabbitMqUserClient
      .send({ cmd: 'get-profile' }, { userId })
      .pipe(
        catchError((err: Error) => {
          if (err.message.includes('User Not Found.'))
            throw new NotFoundException('User Not Found.');

          throw new BadRequestException('Error from Users Service');
        }),
      );
  };
}
