import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'apps/users/src/entities/users.entity';
import { UsersModule } from 'apps/users/src/users.module';
import { UsersService } from 'apps/users/src/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UsersModule, CommonModule],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
