import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from 'libs/common/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'apps/users/src/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
