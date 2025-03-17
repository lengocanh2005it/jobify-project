import { Module } from '@nestjs/common';
import { UsersController } from 'apps/api-gateway/src/users/users.controller';
import { UsersService } from 'apps/api-gateway/src/users/users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
