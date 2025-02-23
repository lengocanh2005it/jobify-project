import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'apps/users/src/entities/users.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CommonModule } from '@app/common';
import { Role } from 'apps/users/src/entities/roles.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
