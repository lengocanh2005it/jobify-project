import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateCompanyDto, CreateUserDto, LoginDto } from 'libs/common/dtos';
import { ForgetPasswordDto } from 'libs/common/dtos/forget-password.dto';
import { UpdatePasswordDto } from 'libs/common/dtos/update-password.dto';
import { catchError, firstValueFrom } from 'rxjs';

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

  public handleUpdatePassword = (
    updatePasswordDto: UpdatePasswordDto,
    userId: string,
  ) => {
    return this.rabbitMqAuthClient.send(
      { cmd: 'update-password' },
      { updatePasswordDto, userId },
    );
  };

  public handleForgetPassword = (forgetPasswordDto: ForgetPasswordDto) => {
    const { email, type } = forgetPasswordDto;

    return this.rabbitMqAuthClient.send(
      { cmd: 'forget-password' },
      {
        email,
        type,
      },
    );
  };

  public handleSignup = async (
    createUserDto: CreateUserDto,
    files?: Array<Express.Multer.File>,
  ) => {
    const result = await firstValueFrom(
      this.rabbitMqUserClient.send(
        { cmd: 'create-user' },
        {
          createUserDto,
          files,
        },
      ),
    );

    return result;
  };

  public handleRefreshToken = (email: string) => {
    return this.rabbitMqAuthClient.send({ cmd: 'refresh-token' }, email);
  };

  public handleVerifyEmail = (email: string) => {
    return this.rabbitMqAuthClient.send({ cmd: 'verify-email' }, email);
  };

  public handleSignout = (user: User) => {
    return this.rabbitMqAuthClient.send({ cmd: 'sign-out' }, user);
  };
}
