import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Role } from 'apps/users/src/entities/roles.entity';
import { User } from 'apps/users/src/entities/users.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'libs/common/dtos';
import { LoginDto } from 'libs/common/dtos';
import { UpdateUserDto } from 'libs/common/dtos';
import { handleEncodedPassword } from 'libs/common/utils';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectDataSource() private readonly dataSource: DataSource,
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
    const { password, type, email } = createUserDto;

    const userWithEmail = await this.userRepository.findOneBy({ email });

    if (userWithEmail) throw new RpcException('Email has been existed.');

    const role = await this.handleGetRoleByName(type);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: handleEncodedPassword(password),
      avatar_url:
        'https://res.cloudinary.com/daiqcjyk9/image/upload/v1735465375/default_user_logo_b1f7pd.png',
    });

    await this.userRepository.save(newUser);

    await this.dataSource
      .createQueryBuilder()
      .relation(User, 'role')
      .of(newUser.id)
      .set(role.id);

    const { password: passwordUser, ...res } = newUser;

    return res;
  };

  public handleVerifyUser = async (loginDto: LoginDto) => {
    const { email, password } = loginDto;

    const findUser = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!findUser) throw new RpcException('User Not Found.');

    const isMatchPassword = await bcrypt.compare(password, findUser.password);

    if (!isMatchPassword) throw new RpcException('Password is not correct.');

    const { password: _passwordUser, ...res } = findUser;

    return res;
  };

  public handleGetRoleByName = async (roleName: string) => {
    const role = await this.roleRepository.findOneBy({ name: roleName });

    if (!role) throw new RpcException('Role Not Found.');

    return role;
  };

  public handleGetProfile = async (userId: string) => {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) throw new RpcException('User Not Found.');

    const { password, ...res } = user;

    return {
      ...res,
      role: user.role.name,
    };
  };

  public handleGetUser = async (userId: string) => {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) throw new RpcException('User Not Found.');

      const { password, ...res } = user;

      return res;
    } catch (err) {
      console.error(err);
    }
  };

  public handleUpdateUser = async (
    userId: string,
    updateUserDto: UpdateUserDto,
  ) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException('User Not Found.');

      await this.userRepository.update({ id: userId }, updateUserDto);

      const savedUser = (await this.userRepository.findOneBy({
        id: userId,
      })) as User;

      const { password, ...res } = savedUser;

      return res;
    } catch (err) {
      console.error(err);
    }
  };

  public handleDeleteUser = async (userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException('User Not Found.');

      await this.userRepository.delete({ id: userId });

      return { msg: 'User deleted successfully!' };
    } catch (err) {
      console.error(err);
    }
  };

  public handleGetPasswordOfUser = async (userId: string) => {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: {
          id: true,
          password: true,
          email: true,
        },
      });

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

      return user;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  public handleUpdatePassword = async (newPassword: string, userId: string) => {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) throw new RpcException(`User With ID: '${userId}' Not Found.`);

      await this.userRepository.update(
        { id: userId },
        {
          password: handleEncodedPassword(newPassword),
        },
      );

      return {
        message: 'Password updated successfully.',
      };
    } catch (err) {
      console.error(err);
    }
  };
}
