import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { User } from 'apps/users/src/entities/users.entity';
import { UsersService } from 'apps/users/src/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from 'libs/common/dtos/login.dto';
import { UpdatePasswordDto } from 'libs/common/dtos/update-password.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject('USERS_SERVICE') private readonly rabbitMqUserClient: ClientProxy,
    @Inject('REDIS_SERVICE') private readonly rabbitMqRedisClient: ClientProxy,
    @Inject('EMAILS_SERVICE') private readonly rabbitMqEmailClient: ClientProxy,
  ) {}

  public handleLogin = async (loginDto: LoginDto) => {
    const user = await this.usersService.handleVerifyUser(loginDto);

    const accessToken = this.jwtService.sign({
      userId: user.id,
      role: user.role?.name,
    });

    return { accessToken };
  };

  public handleUpdatePassword = async (
    updatePasswordDto: UpdatePasswordDto,
    userId: string,
  ) => {
    try {
      const { password, newPassword, otp } = updatePasswordDto;

      const user = await lastValueFrom<User | null>(
        this.rabbitMqUserClient.send({ cmd: 'get-password' }, userId),
      );

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

      const isMatchPassword = await bcrypt.compare(user.password, password);

      if (!isMatchPassword)
        throw new RpcException(`Current password isn't correct.`);

      const otpInRedis = await lastValueFrom<string | null>(
        this.rabbitMqRedisClient.send({ cmd: 'get-key' }, `${user.email}:otp`),
      );

      if (otp !== otpInRedis) throw new RpcException(`OTP isn't correct.`);

      return this.rabbitMqUserClient.send(
        { cmd: 'update-pw-user' },
        { newPassword, userId: user.id },
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleForgetPassword = (email: string, type: string) => {
    try {
      this.rabbitMqEmailClient.emit('send-email', { email, type });

      return {
        message: `OTP has been sent to email: "${email}"`,
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
