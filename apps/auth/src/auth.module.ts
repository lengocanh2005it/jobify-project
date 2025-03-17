import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'apps/notifications/src/entities';
import { Role, Skill, User } from 'apps/users/src/entities';
import { UsersService } from 'apps/users/src/users.service';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, Role, Notification, Skill]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Auth Service',
    },
    ServicesExceptionInterceptor,
  ],
})
export class AuthModule {}
