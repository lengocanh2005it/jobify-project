import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'apps/users/src/users.service';
import { LoginDto } from 'libs/common/dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  public handleLogin = async (loginDto: LoginDto) => {
    const user = await this.usersService.handleVerifyUser(loginDto);

    const accessToken = this.jwtService.sign({ userId: user.id });

    return { accessToken };
  };
}
