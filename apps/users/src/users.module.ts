import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'apps/users/src/entities/users.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
