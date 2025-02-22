import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'apps/users/src/entities/users.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { LoginDto } from 'libs/common/dtos/login.dto';
import { handleEncodedPassword } from 'libs/common/utils/encoded-password.util';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  public getUsers = async () => {
    return await this.userRepository.find({
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  };

  public createUser = async (createUserDto: CreateUserDto) => {
    const { password } = createUserDto;

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: handleEncodedPassword(password),
    });

    return await this.userRepository.save(newUser);
  };

  public handleVerifyUser = async (
    loginDto: LoginDto,
  ): Promise<Partial<User>> => {
    const { email, password } = loginDto;

    const findUser = await this.userRepository.findOneBy({ email });

    if (!findUser) throw new RpcException('User Not Found.');

    const isMatchPassword = await bcrypt.compare(password, findUser.password);

    if (!isMatchPassword) throw new RpcException('Password is not correct.');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _passwordUser, ...res } = findUser;

    return res;
  };
}
