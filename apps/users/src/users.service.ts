import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'apps/users/src/entities/users.entity';
import { CreateUserDto } from 'libs/common/dtos/create-user.dto';
import { handleEncodedPassword } from 'libs/common/utils/encoded-password.util';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  public getUsers = () => {
    return this.userRepository.find();
  };

  public createUser = async (createUserDto: CreateUserDto) => {
    const { password } = createUserDto;

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: handleEncodedPassword(password),
    });

    return await this.userRepository.save(newUser);
  };
}
