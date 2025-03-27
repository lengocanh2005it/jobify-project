import { CommonModule } from '@app/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'apps/notifications/src/entities';
import { Role, Skill, User } from 'apps/users/src/entities';
import { ServicesExceptionInterceptor } from 'libs/common/interceptors';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Device } from 'apps/auth/src/entities';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([User, Role, Notification, Skill, Device]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'SERVICE_NAME',
      useValue: 'Users Service',
    },
    ServicesExceptionInterceptor,
  ],
  exports: [UsersService],
})
export class UsersModule {}
