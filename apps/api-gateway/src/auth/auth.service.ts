import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { LoginDto } from 'libs/common/dtos/login.dto';
import { catchError } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly rabbitMqAuthClient: ClientProxy,
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
}
